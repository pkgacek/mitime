/* global ScriptApp HtmlService GmailApp Gmail Session */

/**
 * @name doGet
 * @description main function for mitime app. The default export gets removed after build
 * to avoid conflicts with Google Apps Script.
 * @returns {void}
 */
export default function doGet() {
    /**
     * Object for Mitime filters
     * @typedef {{
     *  to: {criteria: {to: string}, action: {removeLabelIds: string[], addLabelIds: string[]}},
     *  from: {criteria: {from: string}, action: {removeLabelIds: string[], addLabelIds: string[]}}
     * }} MitimeFilters
     */

    const MITIME = 'Mitime';
    const MITIME_LABEL = MITIME.toLowerCase();
    const MITIME_LABEL_URL = `https://mail.google.com/mail/u/0/#label/${MITIME_LABEL}`;
    const MITIME_SCRIPT_ID = ScriptApp.getScriptId();
    const MITIME_TRIGGER_SETTINGS_URL = `https://script.google.com/home/projects/${MITIME_SCRIPT_ID}/triggers`;
    const PREVIOUS_DATES = {
        YESTERDAY: 'yesterday',
        LAST_WEEK: 'last week',
        LAST_MONTH: 'last month',
        LAST_YEAR: 'last year',
        // Skip is used to skip fetching the previous date
        SKIP: 'skip',
    };
    const PREVIOUS_DATES_ARRAY = Object.values(PREVIOUS_DATES);
    const BODY = [
        `<p>mitime helps you remember what's happened in your life. Reply to this email with your entry and we'll add it to your timeline.</p>`,
    ].join('\n');
    const FOOTER = [
        `<p>You can check out your entries here: <a href="${MITIME_LABEL_URL}">${MITIME_LABEL_URL}</a></p>`,
        `<hr style='margin-top: 20px;margin-bottom: 20px;border: 0;border-top: 2px=solid whiteSmoke;'>`,
        `<p><i>P.S. You'll receive emails every day. You can change this by changing the <a href="${MITIME_TRIGGER_SETTINGS_URL}">trigger settings</a>.</i></p>`,
    ].join('\n');

    /**
     * Custom error class for Mitime
     */
    class MitimeError extends Error {
        constructor(func, message) {
            super(`${func && `[${func.name}] `}${message}`); // (1)
            this.name = 'MitimeError'; // (2)
        }
    }

    /**
     * @name logger
     * @param {Function} func
     * @param {string} message
     */
    function logger(func, message) {
        // eslint-disable-next-line no-console
        console.log(`${func && `[${func.name}] `}${message}`);
    }

    /**
     * @name setupTrigger
     * @description Setup trigger for mitime
     * @param {string} functionName function name to create trigger for
     * @returns {void}
     */
    function setupTrigger(functionName) {
        /**
         * @name deleteTriggers
         * @description Delete all triggers for this project to avoid multiple triggers
         * @returns {void}
         */
        function deleteTriggers() {
            const triggers = ScriptApp.getProjectTriggers();
            for (let i = 0; i < triggers.length; i++) {
                ScriptApp.deleteTrigger(triggers[i]);
            }
        }

        if (!functionName) throw new MitimeError(setupTrigger, 'Function name is not defined');
        deleteTriggers();
        ScriptApp.newTrigger(functionName).timeBased().everyMinutes(5).create();
    }

    /**
     * @name mitime
     * @description Main function for mitime
     */
    function mitime() {
        /**
         * @name getFilters
         * @description prepares filters object for mitime
         * @param {string} alias
         * @param {Record<string, string>} mailLabelIds
         * @returns {MitimeFilters} Filter object
         */
        const getFilters = (alias, mailLabelIds) => ({
            to: {
                criteria: {
                    to: alias,
                },
                action: {
                    addLabelIds: [mailLabelIds?.[MITIME_LABEL]],
                    removeLabelIds: ['INBOX', 'UNREAD'],
                },
            },
            from: {
                criteria: {
                    from: alias,
                },
                action: {
                    addLabelIds: [mailLabelIds?.[MITIME_LABEL]],
                },
            },
        });

        /**
         * @name createAlias
         * @param {string} user user email
         * @param {string} label label to be added to the end of the user email
         * @returns user email with label added as alias
         */
        function createAlias(user, label) {
            if (!user) throw new MitimeError(createAlias, 'User is not defined');
            if (!label) throw new MitimeError(createAlias, 'Alias is not defined');
            return `${user.split('@')[0]}+${label}@${user.split('@')[1]}`;
        }

        /**
         * @name checkLabels
         * @description check if labels exist, if not create them
         * @param {string[]} labelsArray array of labels
         */
        function checkLabels(labelsArray) {
            if (!labelsArray || labelsArray.length === 0)
                throw new MitimeError(checkLabels, 'Labels array is not defined');
            for (let i = 0; i < labelsArray.length; i++) {
                const label = GmailApp.getUserLabelByName(labelsArray[i]);
                if (!label) GmailApp.createLabel(labelsArray[i]);
            }
        }

        /**
         * @name getLabelIds
         * @description get label ids of provided labels
         * @param {GoogleAppsScript.Gmail.Schema.Label[] | undefined} labels
         * @param {string[]} labelsArray array of labels
         * @returns {Record<string, string>} object with label names as keys and label ids as values
         */
        function getLabelIds(labels, labelsArray) {
            if (!labels || labels.length === 0) throw new MitimeError(getLabelIds, 'Labels are not defined');
            if (!labelsArray || labelsArray.length === 0)
                throw new MitimeError(getLabelIds, 'Labels array is not defined');

            const labelsIds = {};
            for (let i = 0; i < labelsArray.length; i++) {
                const foundLabelId = labels.find((label) => label.name === labelsArray[i])?.id;
                if (!foundLabelId) throw new MitimeError(getLabelIds, 'Could not find label id');
                labelsIds[labelsArray[i]] = foundLabelId;
            }

            if (Object.keys(labelsIds).length !== labelsArray.length) {
                throw new MitimeError(getLabelIds, 'Could not find all label ids');
            }

            return labelsIds;
        }

        /**
         * @name checkFilters
         * @param {GoogleAppsScript.Gmail.Schema.Filter[] | undefined}
         * @param {MitimeFilters} filterCriteria
         * @param {string} user
         * @returns {void}
         */
        function checkFilters(filters, filterCriteria, user) {
            if (!filters || filters.length === 0) throw new MitimeError(checkFilters, 'Filters are not defined');
            const filterCriteriaValues = Object.values(filterCriteria);
            if (!filterCriteria || filterCriteriaValues.length === 0)
                throw new MitimeError(checkFilters, 'Filters object is not defined');
            if (!user) throw new MitimeError(checkFilters, 'User is not defined');

            for (let i = 0; i < filterCriteriaValues.length; i++) {
                const key = Object.keys(filterCriteria)[i];
                const foundFilterId = filters.find(
                    (f) => f.criteria[key] === filterCriteriaValues[i].criteria[key],
                )?.id;
                if (!foundFilterId) Gmail.Users.Settings.Filters.create(filterCriteria[key], user);
            }
        }

        /**
         * @name sendEmail
         * @description send email from alias
         * @param {string} user user email
         * @param {string} alias user email with added alias
         * @param {string} title email title
         * @param {string} body email body
         */
        function sendEmail(user, alias, title, body) {
            if (!user) throw new MitimeError(sendEmail, 'User is not defined');
            if (!alias) throw new MitimeError(sendEmail, 'Alias is not defined');
            if (!title) throw new MitimeError(sendEmail, 'Title is not defined');
            if (!body) throw new MitimeError(sendEmail, 'Body is not defined');

            logger(sendEmail, `Sending email to ${user} with title ${title}`);

            GmailApp.sendEmail(user, title, body, {
                htmlBody: body,
                from: alias,
                name: MITIME,
            });
        }

        /**
         * @name deleteForever
         * @param {string} label
         */
        function deleteForever(label, user) {
            if (!label) throw new MitimeError(deleteForever, 'Label is not defined');
            if (!user) throw new MitimeError(deleteForever, 'User is not defined');

            const threads = GmailApp.search(`in:trash label:${label}`);
            for (let i = 0; i < threads.length; i++) {
                logger(deleteForever, `Deleting forever emails with ${label} label`);
                Gmail.Users.Messages.remove(user, threads[i].getId());
            }
        }

        /**
         * @name removeEmails
         * @param {string} label
         * @param {string} alias
         * @param {string} user
         */
        function removeEmails(label, alias, user) {
            if (!label) throw new MitimeError(removeEmails, 'Label is not defined');
            if (!alias) throw new MitimeError(removeEmails, 'Alias is not defined');
            if (!user) throw new MitimeError(removeEmails, 'User is not defined');

            const threads = GmailApp.search(`label:${label}`, 0, 100);
            for (let i = 0; i < threads.length; i++) {
                const messages = threads[i].getMessages();
                const message = messages[0];
                const fromMitime = `${MITIME} <${alias}>`;

                if (message.getFrom() === fromMitime) {
                    logger(removeEmails, `Removing emails from ${fromMitime} with ${label} label`);
                    message.moveToTrash();
                }
            }
            deleteForever(label, user);
        }

        /**
         * @name getDate
         * @param {string} locale
         * @param {Date} date date to format
         * @returns {string} formatted date
         */
        function getDate(locale, date = new Date()) {
            if (!locale) throw new MitimeError(getDate, 'Timezone is not defined');
            if (!date) throw new MitimeError(getDate, 'Date is not defined');
            return date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            });
        }

        /**
         * @name getPreviousDate
         * @param {number} index
         * @param {string} locale
         * @returns {{name: string, date: string}} object with random date name and date
         */
        function getPreviousDate(index, locale) {
            if (index === null || index === undefined) throw new MitimeError(getPreviousDate, 'Index is not defined');
            if (!locale) throw new MitimeError(getPreviousDate, 'Locale is not defined');

            const date = PREVIOUS_DATES_ARRAY[index];
            let d = new Date();

            if (date === PREVIOUS_DATES.YESTERDAY) d.setDate(d.getDate() - 1);
            if (date === PREVIOUS_DATES.LAST_WEEK) d.setDate(d.getDate() - 7);
            if (date === PREVIOUS_DATES.LAST_MONTH) d.setMonth(d.getMonth() - 1);
            if (date === PREVIOUS_DATES.LAST_YEAR) d.setFullYear(d.getFullYear() - 1);
            if (date === PREVIOUS_DATES.SKIP) return null;

            d = getDate(locale, new Date(d));

            return {
                name: `${date} (${d})`,
                date: d,
            };
        }

        /**
         * @name getRandomIndex
         * @param {number} min
         * @param {number} max
         * @returns {number}
         */
        function getRandomIndex(min, max) {
            if (min === null || min === undefined) throw new MitimeError(getRandomIndex, 'Min is not defined');
            if (max === null || max === undefined) throw new MitimeError(getRandomIndex, 'Max is not defined');

            const parsedMin = Math.ceil(min);
            const parsedMax = Math.floor(max);
            return Math.floor(Math.random() * (parsedMax - parsedMin + 1) + parsedMin);
        }

        const user = Session.getEffectiveUser().getEmail();
        const locale = Session.getActiveUserLocale();
        const alias = createAlias(user, MITIME_LABEL);

        checkLabels([MITIME_LABEL]);

        const { labels } = Gmail.Users.Labels.list(user);
        const labelsIds = getLabelIds(labels, [MITIME_LABEL]);
        const filters = Gmail.Users.Settings.Filters.list(user).filter;
        const filterCriteria = getFilters(alias, labelsIds);

        checkFilters(filters, filterCriteria, user);
        removeEmails(MITIME_LABEL, alias, user);

        const date = getDate(locale);
        const title = `✏️ ${MITIME} time for ${date}`;
        const index = getRandomIndex(0, PREVIOUS_DATES_ARRAY.length - 1);
        const previousDate = getPreviousDate(index, locale);
        let body = BODY;
        const footer = FOOTER;

        // To be used in the future
        // if (previousDate) {
        //     // Check if there is any email with mitime label and previous date, if there is, get its body and attach it to the email.
        //     const heading = [`<p><b>Here's what you wrote ${previousDate.name}:...</b></p>`].join('\n');
        //     logger(mitime, heading);
        //     // Check if there is any email with mitime label and previous date, if there is
        //     // get its body and attach it to the email.
        //     body += heading;
        // }

        body += footer;

        // Send mitime mail to the user
        sendEmail(user, alias, title, body);
    }

    mitime();
    setupTrigger(mitime.name);

    return HtmlService.createHtmlOutput('<p>Mitime is running</p>');
}

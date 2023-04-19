/* global ScriptApp HtmlService GmailApp Gmail Session */

/**
 * Object for Mitime filters
 * @typedef {{
 *  to: {criteria: {to: string}, action: {removeLabelIds: string[], addLabelIds: string[]}},
 *  from: {criteria: {from: string}, action: {removeLabelIds: string[], addLabelIds: string[]}}
 * }} MitimeFilters
 */

const MITIME = 'mitime';
const MITIME_URL = `https://mail.google.com/mail/u/0/#label/${MITIME}`;
const MITIME_SCRIPT_ID = ScriptApp.getScriptId();
const MITIME_TRIGGER_SETTINGS_URL = `https://script.google.com/home/projects/${MITIME_SCRIPT_ID}/triggers`;
const PREVIOUS_DATES = {
    YESTERDAY: 'yesterday',
    LAST_WEEK: 'last week',
    LAST_MONTH: 'last month',
    LAST_YEAR: 'last year',
    SKIP: 'skip',
};
const PREVIOUS_DATES_ARRAY = Object.values(PREVIOUS_DATES);
const HTML_HR_LINE = `<hr style='margin-top:20px;margin-bottom:20px;border:0;border-top:2px solid whiteSmoke;'>`;
const EMAIL_REGEX = /<<(.*?)>>/gim;

/* Email templates */
const EMAIL_TEMPLATES = {
    INITIAL: {
        HEADING: [
            [
                `<p><<MITIME>> helps you remember what's happened in your life. Reply to this email with your entry and it will be added to your journal.</p>`,
                `<p>Everything is stored on your own Gmail account - no data is being sent to any third parties. You're just emailing yourself!</p>`,
            ],
        ],
        THROWBACK: [],
        SETTINGS: [[`<p>You can check out your entries here: <a href="<<MITIME_URL>>"><<MITIME_URL>></a></p>`]],
        QUESTIONS: [
            [
                `<p><i>P.S. You'll receive emails every day. You can change this by changing the <a href="<<MITIME_SETTINGS_URL>>">trigger settings</a>.</i></p>`,
            ],
        ],
    },
    REGULAR: {
        HEADING: [[`<p>Reply to add your entry for <<MITIME_DATE>>.</p>`]],
        THROWBACK: [
            ['<p>Nothing to show here yet. Keep writing!</p>'],
            ['<p>Keep writing...soon you will see some previous entries!</p>'],
        ],
        SETTINGS: [[`<p><a href="<<MITIME_URL>>">journal</a> · <a href="<<MITIME_SETTINGS_URL>>">settings</a></p>`]],
        QUESTIONS: [
            [`<p><i>Who did you meet today?</i></p>`],
            [`<p><i>What have you done today?</i></p>`],
            [`<p><i>What are you planning?</i></p>`],
            [`<p><i>What are you grateful for?</i></p>`],
        ],
    },
};

/**
 * @name getArgsString
 * @description returns string with arguments
 * @param {any[]} args
 * @returns {string} formatted arguments
 */
function getArgsString(args) {
    if (!args || args.length === 0) return '';
    return args.map((arg) => `[${JSON.stringify(typeof arg === 'function' ? arg.name : arg)}]`).join('');
}

/**
 * Custom error class for Mitime
 */
class MitimeError extends Error {
    constructor(func, message, ...args) {
        super(`${getArgsString([func, ...args])} ${message}`);
        this.name = 'MitimeError';
    }
}

/**
 * @name logger
 * @param {Function} func
 * @param {string} message
 * @param  {any[]} args
 */
function logger(func, message, ...args) {
    // eslint-disable-next-line no-console
    console.log(`${getArgsString([func, ...args])} ${message}`);
}

/**
 * @name mitime
 * @description Main function for mitime
 * @param {boolean} isInitialRun decides if it's initial run or not and based on that it will send specific email
 * @returns {void}
 */
export function mitime(isInitialRun = false) {
    logger(mitime, `Running mitime`, `isInitialRun: ${isInitialRun}`);

    /**
     * @name prepareEmailProperties
     * @description prepares properties object for email
     * @param {string} date formatted date as string
     * @returns {{MITIME: string, MITIME_DATE: string, MITIME_URL: string, MITIME_SETTINGS_URL: string}} properties object
     */
    function prepareEmailProperties(date) {
        if (!date) throw new MitimeError(prepareEmailProperties, 'Date is empty');

        logger(prepareEmailProperties, 'Preparing email properties');

        return {
            MITIME_DATE: date,
            MITIME,
            MITIME_URL,
            MITIME_SETTINGS_URL: MITIME_TRIGGER_SETTINGS_URL,
        };
    }
    /**
     * @name randomElement
     * @description returns random element from array
     * @param {T[]} array
     * @returns {T} random element from array
     */
    function randomElement(array) {
        if (!array) throw new MitimeError(randomElement, 'Array is empty');

        logger(randomElement, `Getting random element`);

        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * @name prepareEmail
     * @description replaces properties in string with values from properties object
     * @param {string} string
     * @param {Record<string, string>} properties
     * @returns {string} string with replaced properties
     */
    function prepareEmail(string, properties) {
        if (!string) throw new MitimeError(prepareEmail, 'String is empty');
        if (!properties) throw new MitimeError(prepareEmail, 'Properties are empty');

        logger(prepareEmail, 'Preparing email with properties');

        return string.replace(EMAIL_REGEX, (match, property) => {
            if (!properties[property]) throw new MitimeError(prepareEmail, `Property ${property} not found`);

            logger(prepareEmail, `Replacing property ${property} with value ${properties[property]}`);

            return properties[property];
        });
    }

    /**
     * @name generateEmailContent
     * @description generates email content from random elements of the template
     * @param {object} template
     * @param {string} throwbackContent
     * @returns {string} email content
     */
    function generateEmailContent(template = EMAIL_TEMPLATES.REGULAR, throwbackContent = '') {
        if (!template) throw new MitimeError(generateEmailContent, 'Template is empty');

        const emailContent = [];
        const keys = Object.keys(template);

        logger(generateEmailContent, 'Generating email content from template');

        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === 'THROWBACK' && throwbackContent) {
                emailContent.push(throwbackContent);
            } else {
                if (keys[i] === 'SETTINGS') {
                    emailContent.push(HTML_HR_LINE);
                }
                emailContent.push(randomElement(template[keys[i]]));
            }
        }

        return emailContent.flat().join('\n');
    }

    /**
     * @name generateEmail
     * @description generates mitime email content
     * @param {boolean} isInitialEmail decides if it's initial email or not
     * @param {string} date formatted date as string
     * @param {string} throwbackContent throwback content
     * @returns {string} email content with replaced values
     */
    function generateEmail(isInitialEmail, date, throwbackContent = '') {
        if (isInitialEmail === null || isInitialEmail === undefined)
            throw new MitimeError(generateEmail, 'isInitialEmail is empty');
        if (!date) throw new MitimeError(generateEmail, 'Date is empty');

        logger(generateEmail, `Generating email`, `isInitialEmail: ${isInitialEmail}`);

        const emailContent = generateEmailContent(
            isInitialEmail ? EMAIL_TEMPLATES.INITIAL : EMAIL_TEMPLATES.REGULAR,
            throwbackContent,
        );
        const emailProperties = prepareEmailProperties(date);

        return prepareEmail(emailContent, emailProperties);
    }

    /**
     * @name getFilters
     * @description prepares filters object for mitime
     * @param {string} user
     * @param {string} alias
     * @param {string} labelId
     * @returns {MitimeFilters} Filter object
     */
    const getFilters = (user, alias, labelId) => {
        if (!user) throw new MitimeError(getFilters, 'User is not defined');
        if (!alias) throw new MitimeError(getFilters, 'Alias is not defined', user);
        if (!labelId) throw new MitimeError(getFilters, 'Label id is not defined', user);

        return {
            to: {
                criteria: {
                    to: alias,
                },
                action: {
                    addLabelIds: [labelId],
                    removeLabelIds: ['INBOX', 'UNREAD'],
                },
            },
            from: {
                criteria: {
                    from: alias,
                },
                action: {
                    addLabelIds: [labelId],
                },
            },
        };
    };

    /**
     * @name createAlias
     * @param {string} user user email
     * @param {string} label label to be added to the end of the user email
     * @returns user email with label added as alias
     */
    function createAlias(user, label) {
        if (!user) throw new MitimeError(createAlias, 'User is not defined');
        if (!label) throw new MitimeError(createAlias, 'Alias is not defined', user);

        logger(createAlias, 'Creating alias', user);

        return `${user.split('@')[0]}+${label}@${user.split('@')[1]}`;
    }

    /**
     * @name checkLabel
     * @description check if label exist, if not create it
     * @param {string} user
     * @param {string} label
     */
    function checkLabel(user, label) {
        if (!user) throw new MitimeError(checkLabel, 'User is not defined');
        if (!label) throw new MitimeError(checkLabel, 'Label is not defined', user);

        logger(checkLabel, `Checking label ${label}`, user);

        const foundLabel = GmailApp.getUserLabelByName(label);
        if (!foundLabel) GmailApp.createLabel(foundLabel);
    }

    /**
     * @name getLabelId
     * @description get label ids of provided labels
     * @param {string} user
     * @param {GoogleAppsScript.Gmail.Schema.Label[] | undefined} labels
     * @param {string} label label
     * @returns {string} label id
     */
    function getLabelId(user, labels, label) {
        if (!user) throw new MitimeError(getLabelId, 'User is not defined');
        if (!labels || labels.length === 0) throw new MitimeError(getLabelId, 'Labels are not defined', user);
        if (!label) throw new MitimeError(getLabelId, 'Labels array is not defined');

        logger(getLabelId, `Getting label id of label ${label}`, user);

        const labelId = labels.find((l) => l.name === label)?.id;
        if (!labelId) throw new MitimeError(getLabelId, `Could not find label id for label ${label}`, user);

        return labelId;
    }

    /**
     * @name checkFilters
     * @param {string} user
     * @param {GoogleAppsScript.Gmail.Schema.Filter[] | undefined}
     * @param {MitimeFilters} filterCriteria
     * @returns {void}
     */
    function checkFilters(user, filters, filterCriteria) {
        if (!user) throw new MitimeError(checkFilters, 'User is not defined');
        if (!filters || filters.length === 0) throw new MitimeError(checkFilters, 'Filters are not defined', user);
        const filterCriteriaValues = Object.values(filterCriteria);
        if (!filterCriteria || filterCriteriaValues.length === 0)
            throw new MitimeError(checkFilters, 'Filters object is not defined', user);

        logger(checkFilters, 'Checking filters', user);

        for (let i = 0; i < filterCriteriaValues.length; i++) {
            const key = Object.keys(filterCriteria)[i];
            const foundFilterId = filters.find((f) => f.criteria[key] === filterCriteriaValues[i].criteria[key])?.id;
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

        logger(sendEmail, '------------------');
        logger(sendEmail, `From: ${alias}`);
        logger(sendEmail, `To: ${user}`);
        logger(sendEmail, `Title: ${title}`);
        logger(sendEmail, body);
        logger(sendEmail, '------------------');

        GmailApp.sendEmail(user, title, body, {
            htmlBody: body,
            from: alias,
            name: MITIME,
        });
    }

    /**
     * @name deleteForever
     * @param {string} user
     * @param {string} label
     */
    function deleteForever(user, label) {
        if (!user) throw new MitimeError(deleteForever, 'User is not defined');
        if (!label) throw new MitimeError(deleteForever, 'Label is not defined', user);

        const threads = GmailApp.search(`in:trash label:${label}`);

        for (let i = 0; i < threads.length; i++) {
            const threadId = threads[i].getId();

            logger(deleteForever, `Deleting thread`, user, threadId);

            Gmail.Users.Threads.remove(user, threadId);
        }
    }

    /**
     * @name removeEmails
     * @param {string} user
     * @param {string} alias
     * @param {string} label
     */
    function removeEmails(user, alias, label) {
        if (!user) throw new MitimeError(removeEmails, 'User is not defined');
        if (!alias) throw new MitimeError(removeEmails, 'Alias is not defined', user);
        if (!label) throw new MitimeError(removeEmails, 'Label is not defined', user);
        const threads = GmailApp.search(`label:${label}`, 0, 100);
        let movedToTrash = false;

        for (let i = 0; i < threads.length; i++) {
            const messages = threads[i].getMessages();
            const message = messages[0];
            const fromMitime = `${MITIME} <${alias}>`;

            if (message.getFrom() === fromMitime) {
                logger(removeEmails, 'Moving to trash', user, message.getId());

                message.moveToTrash();
                movedToTrash = true;
            }
        }

        if (movedToTrash) deleteForever(user, label);
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

        logger(getDate, `Getting date for locale: ${locale} and date: ${date}`);

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

        const previousDateName = PREVIOUS_DATES_ARRAY[index];
        let previousDate = new Date();

        logger(
            getPreviousDate,
            `Getting previous date for index: ${index}, locale: ${locale}, previous date name: ${previousDateName} and previous date: ${previousDate}`,
        );

        if (previousDateName === PREVIOUS_DATES.YESTERDAY) previousDate.setDate(previousDate.getDate() - 1);
        if (previousDateName === PREVIOUS_DATES.LAST_WEEK) previousDate.setDate(previousDate.getDate() - 7);
        if (previousDateName === PREVIOUS_DATES.LAST_MONTH) previousDate.setMonth(previousDate.getMonth() - 1);
        if (previousDateName === PREVIOUS_DATES.LAST_YEAR) previousDate.setFullYear(previousDate.getFullYear() - 1);
        if (previousDateName === PREVIOUS_DATES.SKIP) return null;

        previousDate = getDate(locale, new Date(previousDate));

        return {
            name: `${previousDateName} (${previousDate})`,
            date: previousDate,
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

        logger(getRandomIndex, `Getting random index for min: ${parsedMin} and max: ${parsedMax}`);

        return Math.floor(Math.random() * (parsedMax - parsedMin + 1) + parsedMin);
    }

    const user = Session.getEffectiveUser().getEmail();
    const locale = Session.getActiveUserLocale();
    const label = MITIME;
    const alias = createAlias(user, label);

    checkLabel(user, label);

    logger(mitime, 'Finished checking labels');

    const { labels } = Gmail.Users.Labels.list(user);
    const labelId = getLabelId(user, labels, label);
    const filters = Gmail.Users.Settings.Filters.list(user).filter;
    const filterCriteria = getFilters(user, alias, labelId);

    checkFilters(user, filters, filterCriteria);

    logger(mitime, 'Finished checking filters');

    removeEmails(user, alias, label);

    logger(mitime, 'Finished removing emails');

    const date = getDate(locale);
    const title = `✏️ ${MITIME} for ${date}`;

    // To be used in the future
    //
    // const index = getRandomIndex(0, PREVIOUS_DATES_ARRAY.length - 1);
    // const previousDate = getPreviousDate(index, locale);
    //
    // if (previousDate) {
    //     // Check if there is any email with mitime label and previous date, if there is, get its body and attach it to the email.
    //     const heading = [`<p><b>Here's what you wrote ${previousDate.name}:...</b></p>`].join('\n');
    //     // Check if there is any email with mitime label and previous date, if there is
    //     // get its body and attach it to the email.
    //     body += heading;
    // }

    const body = generateEmail(isInitialRun, date);

    sendEmail(user, alias, title, body);

    logger(mitime, 'Finished mitime');
}

/**
 * @name doGet
 * @description main function for GAS app. This script will setup the trigger for mitime
 * and run it for the first time.
 * @returns {void}
 */
export function doGet() {
    logger(doGet, 'Running doGet');
    /**
     * @name setupTrigger
     * @description Setup trigger for mitime
     * @param {string} functionName function name to create trigger for
     * @returns {void}
     */
    function setupTrigger(functionName) {
        logger(setupTrigger, `Setting up trigger for function: ${functionName}`);
        /**
         * @name deleteTriggers
         * @description Delete all triggers for this project to avoid multiple triggers
         * @returns {void}
         */
        function deleteTriggers() {
            logger(deleteTriggers, 'Deleting triggers');
            const triggers = ScriptApp.getProjectTriggers();
            for (let i = 0; i < triggers.length; i++) {
                logger(deleteTriggers, `Deleting trigger`, `${triggers[i].getUniqueId()}`);
                ScriptApp.deleteTrigger(triggers[i]);
            }
        }

        if (!functionName) throw new MitimeError(setupTrigger, 'Function name is not defined');
        deleteTriggers();
        ScriptApp.newTrigger(functionName).timeBased().everyDays(1).atHour(9).create();
    }

    setupTrigger(mitime.name);
    // Run mitime for the first time
    mitime(true);

    logger(doGet, 'Finished doGet');

    return HtmlService.createHtmlOutput(`
    <div>
        <h1>✏️ ${MITIME} setup completed.</h1>
        <p>You should receive an email from ${MITIME} in a few minutes. If you don't see it, check your spam folder.</p>
        <p>For more information about ${MITIME}, visit <a href="https://github.com/pkgacek/mitime">GitHub</a>.</p>
        <p>Enjoy!</p>
    </div>
    `);
}

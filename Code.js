/* minified */
const MITIME = "mitime", MITIME_URL = `https://mail.google.com/mail/u/0/#label/${MITIME}`, MITIME_SCRIPT_ID = ScriptApp.getScriptId(), MITIME_TRIGGER_SETTINGS_URL = `https://script.google.com/home/projects/${MITIME_SCRIPT_ID}/triggers`, PREVIOUS_DATES = {
  YESTERDAY: "yesterday",
  LAST_WEEK: "last week",
  LAST_MONTH: "last month",
  LAST_YEAR: "last year",
  SKIP: "skip"
};
Object.values(PREVIOUS_DATES);
const HTML_HR_LINE = "<hr style='margin-top:20px;margin-bottom:20px;border:0;border-top:2px solid whiteSmoke;'>", EMAIL_REGEX = /<<(.*?)>>/gim, EMAIL_TEMPLATES = {
  INITIAL: {
    HEADING: [
      [
        "<p><<MITIME>> helps you remember what's happened in your life. Reply to this email with your entry and it will be added to your journal.</p>",
        "<p>Everything is stored on your own Gmail account - no data is being sent to any third parties. You're just emailing yourself!</p>"
      ]
    ],
    THROWBACK: [],
    SETTINGS: [['<p>You can check out your entries here: <a href="<<MITIME_URL>>"><<MITIME_URL>></a></p>']],
    QUESTIONS: [
      [
        `<p><i>P.S. You'll receive emails every day. You can change this by changing the <a href="<<MITIME_SETTINGS_URL>>">trigger settings</a>.</i></p>`
      ]
    ]
  },
  REGULAR: {
    HEADING: [["<p>Reply to add your entry for <<MITIME_DATE>>.</p>"]],
    THROWBACK: [
      ["<p>Nothing to show here yet. Keep writing!</p>"],
      ["<p>Keep writing...soon you will see some previous entries!</p>"]
    ],
    SETTINGS: [['<p><a href="<<MITIME_URL>>">journal</a> · <a href="<<MITIME_SETTINGS_URL>>">settings</a></p>']],
    QUESTIONS: [
      ["<p><i>Who did you meet today?</i></p>"],
      ["<p><i>What have you done today?</i></p>"],
      ["<p><i>What are you planning?</i></p>"],
      ["<p><i>What are you grateful for?</i></p>"]
    ]
  }
};
function getArgsString(args) {
  return !args || args.length === 0 ? "" : args.map((arg) => `[${JSON.stringify(typeof arg == "function" ? arg.name : arg)}]`).join("");
}
class MitimeError extends Error {
  constructor(func, message, ...args) {
    super(`${getArgsString([func, ...args])} ${message}`), this.name = "MitimeError";
  }
}
function logger(func, message, ...args) {
  console.log(`${getArgsString([func, ...args])} ${message}`);
}
function mitime(props) {
  const isInitialRun = props && props.isInitialRun || !1;
  function prepareEmailProperties(date2) {
    if (!date2)
      throw new MitimeError(prepareEmailProperties, "Date is empty");
    return logger(prepareEmailProperties, "Preparing email properties"), {
      MITIME_DATE: date2,
      MITIME,
      MITIME_URL,
      MITIME_SETTINGS_URL: MITIME_TRIGGER_SETTINGS_URL
    };
  }
  function randomElement(array) {
    if (!array)
      throw new MitimeError(randomElement, "Array is empty");
    return logger(randomElement, "Getting random element"), array[Math.floor(Math.random() * array.length)];
  }
  function prepareEmail(string, properties) {
    if (!string)
      throw new MitimeError(prepareEmail, "String is empty");
    if (!properties)
      throw new MitimeError(prepareEmail, "Properties are empty");
    return logger(prepareEmail, "Preparing email with properties"), string.replace(EMAIL_REGEX, (match, property) => {
      if (!properties[property])
        throw new MitimeError(prepareEmail, `Property ${property} not found`);
      return logger(prepareEmail, `Replacing property ${property} with value ${properties[property]}`), properties[property];
    });
  }
  function generateEmailContent(template = EMAIL_TEMPLATES.REGULAR, throwbackContent = "") {
    if (!template)
      throw new MitimeError(generateEmailContent, "Template is empty");
    const emailContent = [], keys = Object.keys(template);
    logger(generateEmailContent, "Generating email content from template");
    for (let i = 0; i < keys.length; i++)
      keys[i] === "THROWBACK" && throwbackContent ? emailContent.push(throwbackContent) : (keys[i] === "SETTINGS" && emailContent.push(HTML_HR_LINE), emailContent.push(randomElement(template[keys[i]])));
    return emailContent.flat().join(`
`);
  }
  function generateEmail(isInitialEmail, date2, throwbackContent = "") {
    if (isInitialEmail == null)
      throw new MitimeError(generateEmail, "isInitialEmail is empty");
    if (!date2)
      throw new MitimeError(generateEmail, "Date is empty");
    logger(generateEmail, "Generating email", `isInitialEmail: ${isInitialEmail}`);
    const emailContent = generateEmailContent(
      isInitialEmail ? EMAIL_TEMPLATES.INITIAL : EMAIL_TEMPLATES.REGULAR,
      throwbackContent
    ), emailProperties = prepareEmailProperties(date2);
    return prepareEmail(emailContent, emailProperties);
  }
  const getFilters = (user2, alias2, labelId2) => {
    if (!user2)
      throw new MitimeError(getFilters, "User is not defined");
    if (!alias2)
      throw new MitimeError(getFilters, "Alias is not defined", user2);
    if (!labelId2)
      throw new MitimeError(getFilters, "Label id is not defined", user2);
    return {
      to: {
        criteria: {
          to: alias2
        },
        action: {
          addLabelIds: [labelId2],
          removeLabelIds: ["INBOX", "UNREAD"]
        }
      },
      from: {
        criteria: {
          from: alias2
        },
        action: {
          addLabelIds: [labelId2]
        }
      }
    };
  };
  function createAlias(user2, label2) {
    if (!user2)
      throw new MitimeError(createAlias, "User is not defined");
    if (!label2)
      throw new MitimeError(createAlias, "Alias is not defined", user2);
    return logger(createAlias, "Creating alias", user2), `${user2.split("@")[0]}+${label2}@${user2.split("@")[1]}`;
  }
  function checkLabel(user2, label2) {
    if (!user2)
      throw new MitimeError(checkLabel, "User is not defined");
    if (!label2)
      throw new MitimeError(checkLabel, "Label is not defined", user2);
    logger(checkLabel, `Checking label ${label2}`, user2);
    const foundLabel = GmailApp.getUserLabelByName(label2);
    foundLabel || GmailApp.createLabel(foundLabel);
  }
  function getLabelId(user2, labels2, label2) {
    var _a;
    if (!user2)
      throw new MitimeError(getLabelId, "User is not defined");
    if (!labels2 || labels2.length === 0)
      throw new MitimeError(getLabelId, "Labels are not defined", user2);
    if (!label2)
      throw new MitimeError(getLabelId, "Labels array is not defined");
    logger(getLabelId, `Getting label id of label ${label2}`, user2);
    const labelId2 = (_a = labels2.find((l) => l.name === label2)) == null ? void 0 : _a.id;
    if (!labelId2)
      throw new MitimeError(getLabelId, `Could not find label id for label ${label2}`, user2);
    return labelId2;
  }
  function checkFilters(user2, filters2, filterCriteria2) {
    var _a;
    if (!user2)
      throw new MitimeError(checkFilters, "User is not defined");
    if (!filters2 || filters2.length === 0)
      throw new MitimeError(checkFilters, "Filters are not defined", user2);
    const filterCriteriaValues = Object.values(filterCriteria2);
    if (!filterCriteria2 || filterCriteriaValues.length === 0)
      throw new MitimeError(checkFilters, "Filters object is not defined", user2);
    logger(checkFilters, "Checking filters", user2);
    for (let i = 0; i < filterCriteriaValues.length; i++) {
      const key = Object.keys(filterCriteria2)[i];
      ((_a = filters2.find((f) => f.criteria[key] === filterCriteriaValues[i].criteria[key])) == null ? void 0 : _a.id) || Gmail.Users.Settings.Filters.create(filterCriteria2[key], user2);
    }
  }
  function sendEmail(user2, alias2, title2, body2) {
    if (!user2)
      throw new MitimeError(sendEmail, "User is not defined");
    if (!alias2)
      throw new MitimeError(sendEmail, "Alias is not defined");
    if (!title2)
      throw new MitimeError(sendEmail, "Title is not defined");
    if (!body2)
      throw new MitimeError(sendEmail, "Body is not defined");
    logger(sendEmail, "------------------"), logger(sendEmail, `From: ${alias2}`), logger(sendEmail, `To: ${user2}`), logger(sendEmail, `Title: ${title2}`), logger(sendEmail, body2), logger(sendEmail, "------------------"), GmailApp.sendEmail(user2, title2, body2, {
      htmlBody: body2,
      from: alias2,
      name: MITIME
    });
  }
  function deleteEmails(user2, alias2, label2) {
    if (!user2)
      throw new MitimeError(deleteEmails, "User is not defined");
    if (!alias2)
      throw new MitimeError(deleteEmails, "Alias is not defined", user2);
    if (!label2)
      throw new MitimeError(deleteEmails, "Label is not defined", user2);
    const threads = GmailApp.search(`in:trash label:${label2}`);
    for (let i = 0; i < threads.length; i++) {
      const message = threads[i].getMessages()[0], messageId = message.getId(), fromMitime = `${MITIME} <${alias2}>`;
      message.getFrom() === fromMitime && (logger(deleteEmails, "Deleting message", user2, messageId), Gmail.Users.Messages.remove(user2, messageId));
    }
  }
  function removeEmails(user2, alias2, label2) {
    if (!user2)
      throw new MitimeError(removeEmails, "User is not defined");
    if (!alias2)
      throw new MitimeError(removeEmails, "Alias is not defined", user2);
    if (!label2)
      throw new MitimeError(removeEmails, "Label is not defined", user2);
    const threads = GmailApp.search(`label:${label2}`, 0, 100);
    let movedToTrash = !1;
    for (let i = 0; i < threads.length; i++) {
      const message = threads[i].getMessages()[0], fromMitime = `${MITIME} <${alias2}>`;
      message.getFrom() === fromMitime && (logger(removeEmails, "Moving to trash", user2, message.getId()), message.moveToTrash(), movedToTrash = !0);
    }
    movedToTrash && deleteEmails(user2, alias2, label2);
  }
  function getDate(locale2, date2 = /* @__PURE__ */ new Date()) {
    if (!locale2)
      throw new MitimeError(getDate, "Locale is not defined");
    if (!date2)
      throw new MitimeError(getDate, "Date is not defined");
    return logger(getDate, `Getting date for locale: ${locale2} and date: ${date2}`), date2.toLocaleDateString(locale2, {
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
  }
  const user = Session.getEffectiveUser().getEmail(), locale = Session.getActiveUserLocale() || "en", label = MITIME, alias = createAlias(user, label);
  checkLabel(user, label), logger(mitime, "Finished checking labels");
  const { labels } = Gmail.Users.Labels.list(user), labelId = getLabelId(user, labels, label), filters = Gmail.Users.Settings.Filters.list(user).filter, filterCriteria = getFilters(user, alias, labelId);
  checkFilters(user, filters, filterCriteria), logger(mitime, "Finished checking filters"), removeEmails(user, alias, label), logger(mitime, "Finished removing emails");
  const date = getDate(locale), title = `✏️ ${MITIME} for ${date}`, body = generateEmail(isInitialRun, date);
  sendEmail(user, alias, title, body), logger(mitime, "Finished mitime");
}
function doGet() {
  logger(doGet, "Running doGet");
  function setupTrigger(functionName) {
    logger(setupTrigger, `Setting up trigger for function: ${functionName}`);
    function deleteTriggers() {
      logger(deleteTriggers, "Deleting triggers");
      const triggers = ScriptApp.getProjectTriggers();
      for (let i = 0; i < triggers.length; i++)
        logger(deleteTriggers, "Deleting trigger", `${triggers[i].getUniqueId()}`), ScriptApp.deleteTrigger(triggers[i]);
    }
    if (!functionName)
      throw new MitimeError(setupTrigger, "Function name is not defined");
    deleteTriggers(), ScriptApp.newTrigger(functionName).timeBased().everyDays(1).atHour(9).create();
  }
  return setupTrigger(mitime.name), mitime({ isInitialRun: !0 }), logger(doGet, "Finished doGet"), HtmlService.createHtmlOutput(`
    <div>
        <h1>✏️ ${MITIME} setup completed.</h1>
        <p>You should receive an email from ${MITIME} in a few minutes. If you don't see it, check your spam folder.</p>
        <p>For more information about ${MITIME}, visit <a href="https://github.com/pkgacek/mitime">GitHub</a>.</p>
        <p>Enjoy!</p>
    </div>
    `);
}

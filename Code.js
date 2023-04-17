/* minified */
const MITIME = "Mitime", MITIME_LABEL = MITIME.toLowerCase(), MITIME_LABEL_URL = `https://mail.google.com/mail/u/0/#label/${MITIME_LABEL}`, MITIME_SCRIPT_ID = ScriptApp.getScriptId(), MITIME_TRIGGER_SETTINGS_URL = `https://script.google.com/home/projects/${MITIME_SCRIPT_ID}/triggers`, PREVIOUS_DATES = {
  YESTERDAY: "yesterday",
  LAST_WEEK: "last week",
  LAST_MONTH: "last month",
  LAST_YEAR: "last year",
  SKIP: "skip"
}, PREVIOUS_DATES_ARRAY = Object.values(PREVIOUS_DATES), EMAIL_TEMPLATE = {
  TEMPLATE_1: {
    BODY: [
      "<p>mitime helps you remember what's happened in your life. Reply to this email with your entry and we'll add it to your timeline.</p>"
    ].join(`
`),
    FOOTER: [
      `<p>You can check out your entries here: <a href="${MITIME_LABEL_URL}">${MITIME_LABEL_URL}</a></p>`,
      "<hr style='margin-top: 20px;margin-bottom: 20px;border: 0;border-top: 2px=solid whiteSmoke;'>",
      `<p><i>P.S. You'll receive emails every day. You can change this by changing the <a href="${MITIME_TRIGGER_SETTINGS_URL}">trigger settings</a>.</i></p>`
    ].join(`
`)
  }
};
class MitimeError extends Error {
  constructor(func, message) {
    super(`${func && `[${func.name}] `}${message}`), this.name = "MitimeError";
  }
}
function mitime() {
  const getFilters = (alias2, mailLabelIds) => ({
    to: {
      criteria: {
        to: alias2
      },
      action: {
        addLabelIds: [mailLabelIds == null ? void 0 : mailLabelIds[MITIME_LABEL]],
        removeLabelIds: ["INBOX", "UNREAD"]
      }
    },
    from: {
      criteria: {
        from: alias2
      },
      action: {
        addLabelIds: [mailLabelIds == null ? void 0 : mailLabelIds[MITIME_LABEL]]
      }
    }
  });
  function createAlias(user2, label) {
    if (!user2)
      throw new MitimeError(createAlias, "User is not defined");
    if (!label)
      throw new MitimeError(createAlias, "Alias is not defined");
    return `${user2.split("@")[0]}+${label}@${user2.split("@")[1]}`;
  }
  function checkLabels(labelsArray) {
    if (!labelsArray || labelsArray.length === 0)
      throw new MitimeError(checkLabels, "Labels array is not defined");
    for (let i = 0; i < labelsArray.length; i++)
      GmailApp.getUserLabelByName(labelsArray[i]) || GmailApp.createLabel(labelsArray[i]);
  }
  function getLabelIds(labels2, labelsArray) {
    var _a;
    if (!labels2 || labels2.length === 0)
      throw new MitimeError(getLabelIds, "Labels are not defined");
    if (!labelsArray || labelsArray.length === 0)
      throw new MitimeError(getLabelIds, "Labels array is not defined");
    const labelsIds2 = {};
    for (let i = 0; i < labelsArray.length; i++) {
      const foundLabelId = (_a = labels2.find((label) => label.name === labelsArray[i])) == null ? void 0 : _a.id;
      if (!foundLabelId)
        throw new MitimeError(getLabelIds, "Could not find label id");
      labelsIds2[labelsArray[i]] = foundLabelId;
    }
    if (Object.keys(labelsIds2).length !== labelsArray.length)
      throw new MitimeError(getLabelIds, "Could not find all label ids");
    return labelsIds2;
  }
  function checkFilters(filters2, filterCriteria2, user2) {
    var _a;
    if (!filters2 || filters2.length === 0)
      throw new MitimeError(checkFilters, "Filters are not defined");
    const filterCriteriaValues = Object.values(filterCriteria2);
    if (!filterCriteria2 || filterCriteriaValues.length === 0)
      throw new MitimeError(checkFilters, "Filters object is not defined");
    if (!user2)
      throw new MitimeError(checkFilters, "User is not defined");
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
    GmailApp.sendEmail(user2, title2, body2, {
      htmlBody: body2,
      from: alias2,
      name: MITIME
    });
  }
  function deleteForever(label, user2) {
    if (!label)
      throw new MitimeError(deleteForever, "Label is not defined");
    if (!user2)
      throw new MitimeError(deleteForever, "User is not defined");
    const threads = GmailApp.search(`in:trash label:${label}`);
    for (let i = 0; i < threads.length; i++)
      Gmail.Users.Messages.remove(user2, threads[i].getId());
  }
  function removeEmails(label, alias2, user2) {
    if (!label)
      throw new MitimeError(removeEmails, "Label is not defined");
    if (!alias2)
      throw new MitimeError(removeEmails, "Alias is not defined");
    if (!user2)
      throw new MitimeError(removeEmails, "User is not defined");
    const threads = GmailApp.search(`label:${label}`, 0, 100);
    let movedToTrash = !1;
    for (let i = 0; i < threads.length; i++) {
      const message = threads[i].getMessages()[0], fromMitime = `${MITIME} <${alias2}>`;
      message.getFrom() === fromMitime && (message.moveToTrash(), movedToTrash = !0);
    }
    movedToTrash && deleteForever(label, user2);
  }
  function getDate(locale2, date2 = /* @__PURE__ */ new Date()) {
    if (!locale2)
      throw new MitimeError(getDate, "Timezone is not defined");
    if (!date2)
      throw new MitimeError(getDate, "Date is not defined");
    return date2.toLocaleDateString(locale2, {
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
  }
  function getPreviousDate(index2, locale2) {
    if (index2 == null)
      throw new MitimeError(getPreviousDate, "Index is not defined");
    if (!locale2)
      throw new MitimeError(getPreviousDate, "Locale is not defined");
    const date2 = PREVIOUS_DATES_ARRAY[index2];
    let d = /* @__PURE__ */ new Date();
    return date2 === PREVIOUS_DATES.YESTERDAY && d.setDate(d.getDate() - 1), date2 === PREVIOUS_DATES.LAST_WEEK && d.setDate(d.getDate() - 7), date2 === PREVIOUS_DATES.LAST_MONTH && d.setMonth(d.getMonth() - 1), date2 === PREVIOUS_DATES.LAST_YEAR && d.setFullYear(d.getFullYear() - 1), date2 === PREVIOUS_DATES.SKIP ? null : (d = getDate(locale2, new Date(d)), {
      name: `${date2} (${d})`,
      date: d
    });
  }
  function getRandomIndex(min, max) {
    if (min == null)
      throw new MitimeError(getRandomIndex, "Min is not defined");
    if (max == null)
      throw new MitimeError(getRandomIndex, "Max is not defined");
    const parsedMin = Math.ceil(min), parsedMax = Math.floor(max);
    return Math.floor(Math.random() * (parsedMax - parsedMin + 1) + parsedMin);
  }
  const user = Session.getEffectiveUser().getEmail(), locale = Session.getActiveUserLocale(), alias = createAlias(user, MITIME_LABEL);
  checkLabels([MITIME_LABEL]);
  const { labels } = Gmail.Users.Labels.list(user), labelsIds = getLabelIds(labels, [MITIME_LABEL]), filters = Gmail.Users.Settings.Filters.list(user).filter, filterCriteria = getFilters(alias, labelsIds);
  checkFilters(filters, filterCriteria, user), removeEmails(MITIME_LABEL, alias, user);
  const date = getDate(locale), title = `✏️ ${MITIME} for ${date}`, index = getRandomIndex(0, PREVIOUS_DATES_ARRAY.length - 1);
  getPreviousDate(index, locale);
  let body = EMAIL_TEMPLATE.TEMPLATE_1.BODY;
  const footer = EMAIL_TEMPLATE.TEMPLATE_1.FOOTER;
  body += footer, sendEmail(user, alias, title, body);
}
function doGet() {
  function setupTrigger(functionName) {
    function deleteTriggers() {
      const triggers = ScriptApp.getProjectTriggers();
      for (let i = 0; i < triggers.length; i++)
        ScriptApp.deleteTrigger(triggers[i]);
    }
    if (!functionName)
      throw new MitimeError(setupTrigger, "Function name is not defined");
    deleteTriggers(), ScriptApp.newTrigger(functionName).timeBased().everyMinutes(5).create();
  }
  return setupTrigger(mitime.name), mitime(), HtmlService.createHtmlOutput(`
    <div>
        <h1>✏️ ${MITIME} setup completed.</h1>
        <p>You should receive an email from ${MITIME} in a few minutes. If you don't see it, check your spam folder.</p>
        <br />
        <p>Enjoy!</p>
    </div>
    `);
}

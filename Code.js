function doGet() {
  const u = "Mitime", l = u.toLowerCase(), D = `https://mail.google.com/mail/u/0/#label/${l}`, F = `https://script.google.com/home/projects/${ScriptApp.getScriptId()}/triggers`, g = {
    YESTERDAY: "yesterday",
    LAST_WEEK: "last week",
    LAST_MONTH: "last month",
    LAST_YEAR: "last year",
    // Skip is used to skip fetching the previous date
    SKIP: "skip"
  }, R = Object.values(g), G = [
    "<p>mitime helps you remember what's happened in your life. Reply to this email with your entry and we'll add it to your timeline.</p>"
  ].join(`
`), Y = [
    `<p>You can check out your entries here: <a href="${D}">${D}</a></p>`,
    "<hr style='margin-top: 20px;margin-bottom: 20px;border: 0;border-top: 2px=solid whiteSmoke;'>",
    `<p><i>P.S. You'll receive emails every day. You can change this by changing the <a href="${F}">trigger settings</a>.</i></p>`
  ].join(`
`);
  class o extends Error {
    constructor(s, h) {
      super(`${s && `[${s.name}] `}${h}`), this.name = "MitimeError";
    }
  }
  function S(f, s) {
    console.log(`${f && `[${f.name}] `}${s}`);
  }
  function _(f) {
    function s() {
      const h = ScriptApp.getProjectTriggers();
      for (let d = 0; d < h.length; d++)
        ScriptApp.deleteTrigger(h[d]);
    }
    if (!f)
      throw new o(_, "Function name is not defined");
    s(), ScriptApp.newTrigger(f).timeBased().everyMinutes(5).create();
  }
  function U() {
    const f = (t, e) => ({
      to: {
        criteria: {
          to: t
        },
        action: {
          addLabelIds: [e == null ? void 0 : e[l]],
          removeLabelIds: ["INBOX", "UNREAD"]
        }
      },
      from: {
        criteria: {
          from: t
        },
        action: {
          addLabelIds: [e == null ? void 0 : e[l]]
        }
      }
    });
    function s(t, e) {
      if (!t)
        throw new o(s, "User is not defined");
      if (!e)
        throw new o(s, "Alias is not defined");
      return `${t.split("@")[0]}+${e}@${t.split("@")[1]}`;
    }
    function h(t) {
      if (!t || t.length === 0)
        throw new o(h, "Labels array is not defined");
      for (let e = 0; e < t.length; e++)
        GmailApp.getUserLabelByName(t[e]) || GmailApp.createLabel(t[e]);
    }
    function d(t, e) {
      var n;
      if (!t || t.length === 0)
        throw new o(d, "Labels are not defined");
      if (!e || e.length === 0)
        throw new o(d, "Labels array is not defined");
      const i = {};
      for (let r = 0; r < e.length; r++) {
        const c = (n = t.find((a) => a.name === e[r])) == null ? void 0 : n.id;
        if (!c)
          throw new o(d, "Could not find label id");
        i[e[r]] = c;
      }
      if (Object.keys(i).length !== e.length)
        throw new o(d, "Could not find all label ids");
      return i;
    }
    function E(t, e, i) {
      var r;
      if (!t || t.length === 0)
        throw new o(E, "Filters are not defined");
      const n = Object.values(e);
      if (!e || n.length === 0)
        throw new o(E, "Filters object is not defined");
      if (!i)
        throw new o(E, "User is not defined");
      for (let c = 0; c < n.length; c++) {
        const a = Object.keys(e)[c];
        ((r = t.find(
          (N) => N.criteria[a] === n[c].criteria[a]
        )) == null ? void 0 : r.id) || Gmail.Users.Settings.Filters.create(e[a], i);
      }
    }
    function w(t, e, i, n) {
      if (!t)
        throw new o(w, "User is not defined");
      if (!e)
        throw new o(w, "Alias is not defined");
      if (!i)
        throw new o(w, "Title is not defined");
      if (!n)
        throw new o(w, "Body is not defined");
      S(w, `Sending email to ${t} with title ${i}`), GmailApp.sendEmail(t, i, n, {
        htmlBody: n,
        from: e,
        name: u
      });
    }
    function T(t, e) {
      if (!t)
        throw new o(T, "Label is not defined");
      if (!e)
        throw new o(T, "User is not defined");
      const i = GmailApp.search(`in:trash label:${t}`);
      for (let n = 0; n < i.length; n++)
        S(T, `Deleting forever emails with ${t} label`), Gmail.Users.Messages.remove(e, i[n].getId());
    }
    function p(t, e, i) {
      if (!t)
        throw new o(p, "Label is not defined");
      if (!e)
        throw new o(p, "Alias is not defined");
      if (!i)
        throw new o(p, "User is not defined");
      const n = GmailApp.search(`label:${t}`, 0, 100);
      for (let r = 0; r < n.length; r++) {
        const a = n[r].getMessages()[0], L = `${u} <${e}>`;
        a.getFrom() === L && (S(p, `Removing emails from ${L} with ${t} label`), a.moveToTrash());
      }
      T(t, i);
    }
    function M(t, e = /* @__PURE__ */ new Date()) {
      if (!t)
        throw new o(M, "Timezone is not defined");
      if (!e)
        throw new o(M, "Date is not defined");
      return e.toLocaleDateString(t, {
        weekday: "long",
        year: "numeric",
        month: "numeric",
        day: "numeric"
      });
    }
    function I(t, e) {
      if (t == null)
        throw new o(I, "Index is not defined");
      if (!e)
        throw new o(I, "Locale is not defined");
      const i = R[t];
      let n = /* @__PURE__ */ new Date();
      return i === g.YESTERDAY && n.setDate(n.getDate() - 1), i === g.LAST_WEEK && n.setDate(n.getDate() - 7), i === g.LAST_MONTH && n.setMonth(n.getMonth() - 1), i === g.LAST_YEAR && n.setFullYear(n.getFullYear() - 1), i === g.SKIP ? null : (n = M(e, new Date(n)), {
        name: `${i} (${n})`,
        date: n
      });
    }
    function $(t, e) {
      if (t == null)
        throw new o($, "Min is not defined");
      if (e == null)
        throw new o($, "Max is not defined");
      const i = Math.ceil(t), n = Math.floor(e);
      return Math.floor(Math.random() * (n - i + 1) + i);
    }
    const m = Session.getEffectiveUser().getEmail(), y = Session.getActiveUserLocale(), A = s(m, l);
    h([l]);
    const { labels: O } = Gmail.Users.Labels.list(m), k = d(O, [l]), b = Gmail.Users.Settings.Filters.list(m).filter, j = f(A, k);
    E(b, j, m), p(l, A, m);
    const P = M(y), B = `✏️ ${u} time for ${P}`, x = $(0, R.length - 1);
    I(x, y);
    let v = G;
    v += Y, w(m, A, B, v);
  }
  return U(), _(U.name), "Mitime setup completed";
}

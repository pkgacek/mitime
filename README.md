# ✏️ mitime

A Google Apps Script powered Dabble.me alternative. This is a Google App Script that will send you everyday a reminder to log your thoughts in this email based journal. All your replies will be labeled for you to revisit them anytime.

![mitime message](/screenshot.png 'Email from mitime')

Enjoy!

## Installation

-   Check the [latest release](https://github.com/pkgacek/mitime/releases/latest) to get the latest Google Script Apps Web App link. Clicking the link will setup all necessary labels, filters and triggers.

-   You can also copy the script directly from [Google Apps Script](https://script.google.com/d/1uoBRpbx38WpoJbFqixnJQuD_UNY7H36z0Iq1zDLreXLULWJW590-f6C8/edit?usp=sharing).

## Local setup

Install the packages and build the script:

```
npm install
npm run build // this will create minified script
```

Create a new Google App Script project by visiting: https://script.google.com/home/start and clicking `+ Create new Project`, then copy the content of `Code.js` to your project. Finally, run the script.

You can always use original script that is located in `src/index.js`.

It will:

1. create a `mitime` label in your Gmail
2. setup the daily trigger to send you an email for you to reply. It will also remove any previous triggers for this script
3. will remove all emails recieved from `mitime` to only keep your sent emails

## Developing

You can use `https://github.com/google/clasp` to edit the script with all of the Google Apps Script methods.

Using:

```
npm run deploy
```

will automatically build the script and push it to your Google App Script project (it requires you to log in into clasp first).

## Required permissions

On the first run, the script will ask you to grant those permissions:

1. Gmail (to create labels and send automatic emails)
2. AppScripts (to get your script id and installed triggers)

## Todo

-   [ ] Tests 💀
-   [ ] Add `Throwback` functionality - get emails from the past and attach them to the automatic mail
-   [ ] Add multiple email templates

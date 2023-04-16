# ✏️ mitime

Google App Scripts powered Dabble.me alternative.

## Setup

Install the packages and build the script:

```
npm install
npm run build // this will create minified script
```

and then copy the `dist/Code.js` to your Google App Script project. Finally, run the script.

You can always use unminified script located in `lib/Code.js`.

It will:

1. create a `mitime` label in your Gmail
2. setup the daily trigger to send you an email for you to reply. It will also remove any previous triggers for this script
3. will remove all emails recieved from `mitime` to only keep your sent emails

## Developing

You can use `https://github.com/google/clasp` to edit the script with all of the Google App Scripts methods.

Using:

```
npm run deploy
```

will automatically build the script and push it to your Google App Script project (it requires you to log in into clasp first).

## Required permissions

On the first run, the script will ask you to grant those permissions:

1. Gmail (to create labels and send automatic emails)
2. AppScripts (to get your script id and installed triggers)

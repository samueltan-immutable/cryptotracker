# Crypto tracker slack bot

Built to automate the cryptoslam reporting. This tool generates a screenshot of the table, and scrapes the relevant fields from Cryptoslam & Immutascan and posts the results into slack. It's sketchy but it works.

## Prerequisites

* Use node v16+, and install dependancies with `npm i `  
* As below we use npx and this helps with 
* Rename `.env.example` to `.env`  
* Make sure your slack bot has OAuth scope to `chat:write` and `files:write` (read more [here](https://api.slack.com/messaging/files))  
* Replace 'slack-token' in `.env` file with your bot slack-token (read more [here](https://api.slack.com/authentication/token-types#bot)) 

## Customize
Set network name in Cryptoslam in .env
`CHAIN_NAME='Immutable'`

Set to slack auth token in .env
`SLACK_TOKEN='slack-token'`

Set the CSS reference for the Ranking table with header row in .env
`CSS_RANKING_TABLE_WHEADER='.css-4spr0x > div:nth-child(1)'`

Set the CSS reference for the Seven Day button in .env
`CSS_SEVEN_DAY_SELECTOR='div.css-1hkzn7e:nth-child(2)'`

Set the CSS reference for the Thirty Day button in .env
`CSS_THIRTY_DAY_SELECTOR='div.css-1hkzn7e:nth-child(3)'`

Set the CSS reference for the Ranking table without header row in .env
`CSS_RANKING_TABLE='.css-4spr0x > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)'`

Set the frequency for how often the job should be posting to slack in .env. Options are 'daily', 'weekly', 'hourly' or 'all'
`SLACK_FREQ='daily'`

Set the UTC hour of the day to post the slack message if run daily or weekly in .env
`SLACK_DAILY_RUNHOUR='1'`

Set the slack channels the job should be posting to if set to hourly output in .env
`SLACK_HOURLY_OUTPUT='tp'`

Set the slack channels the job should be posting to if set to daily output in .env
`SLACK_DAILY_OUTPUT='tp'`

Set the slack channels the job should be posting to if set to weekly output in .env
`SLACK_WEEKLY_OUTPUT='tp'`

Weekly ouput setting will override daily which will override hourly on that particular run i.e. if set to output all. The daily slack output setting would be used when current hour = SLACK_DAILY_RUNHOUR

Adjust slack input to post to various slack channels
dc - #deal-cryptoslam
tp - #team-partnerships
wr - #WG-Rewards
ci - #cryptoslam-immutable

You can append multiple destinations to send to two places i.e. 'dctpwr' will send to #deal-cryptoslam, #team-partnerships and #WG-Rewards

Set the error thresholds in .env
`INTERNAL_ERROR_THRESHOLD='0.05'`
`EXTERNAL_ERROR_THRESHOLD='0.05'`


## Run
`npx ts-node ./src/lambda-scraper.ts` to execute the app.

## Debug Mode
`npx ts-node ./src/lambda-scraper.ts -d true` to execute the app with full debug output to console.

## Show Mode
`npx ts-node ./src/lambda-scraper.ts -s true` to execute the app with browser showing.

## Docker Build
Needs to be run on a Windows PC
`docker build --platform linux/amd64 -t crypto-tracker .` to build image
`docker-compose build`

## Docker Run
Needs to be run on a Windows PC
`docker run -dp 3000:3000 --platform linux/amd64 crypto-tracker` to run docker container
`docker-compose up -d`

## Docker Stop
`docker-compose down`
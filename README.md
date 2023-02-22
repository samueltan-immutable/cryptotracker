# Crypto tracker slack bot

Built to automate the cryptoslam reporting. This tool generates a screenshot of the table, and scrapes the relevant fields from Cryptoslam & Immutascan and posts the results into slack. It's sketchy but it works.

## Prerequisites

* Use node v16+, and install dependancies with `npm i `  
* Rename `.env.example` to `.env`  
* Make sure your slack bot has OAuth scope to `chat:write` and `files:write` (read more [here](https://api.slack.com/messaging/files))  
* Replace 'slack-token' in `.env` file with your bot slack-token (read more [here](https://api.slack.com/authentication/token-types#bot))  

## Run
`npx ts-node ./src/lambda-scraper.ts` to execute the app.

## Debug Mode
`npx ts-node ./src/lambda-scraper.ts -d true` to execute the app.

## Show Mode
`npx ts-node ./src/lambda-scraper.ts -s true` to execute the app.

## Docker Build
`docker build --platform linux/amd64 -t crypto-tracker .` to build image

## Docker Run
`docker run -dp 3000:3000 --platform linux/amd64 crypto-tracker` to run docker container
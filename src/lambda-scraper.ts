
//import { Context } from 'aws-lambda';
//import * as aws from 'aws-sdk';
import yargs from 'yargs';
import * as puppeteer from "puppeteer";
import { gql } from 'graphql-tag';
import { gotScraping } from 'got-scraping';
import './utils/env';
import { WebClient } from '@slack/web-api';

const chain_name= process.env.CHAIN_NAME;
const token = process.env.SLACK_TOKEN;
// selectors
//ranking table on the main page right hand section
const rankingTable =process.env.CSS_RANKING_TABLE_WHEADER;

//7 Days data toggle on top left hand option bar
const sevenDaySelector=process.env.CSS_SEVEN_DAY_SELECTOR;

//30 Days data toggle on top left hand option bar
const thirtyDaySelector =process.env.CSS_THIRTY_DAY_SELECTOR;

//Daily data table after line graph
const dailyDataTable =process.env.CSS_RANKING_TABLE;
const sevenDayTableSelector =process.env.CSS_RANKING_TABLE;
const thirtyDayTableSelector =process.env.CSS_RANKING_TABLE;

//Immutascan graphql endpoint
const immmutascanGraphQLEndpoint = process.env.IMMUTASCAN_GRAPHQL_ENDPOINT;
const immmutascanGraphQLAPIKey = process.env.IMMUTASCAN_GRAPHQL_APIKEY;

//Slack message error threshold 
const internal_error_threshold = Number(process.env.INTERNAL_ERROR_THRESHOLD);
const external_error_threshold = Number(process.env.EXTERNAL_ERROR_THRESHOLD);
const slack_daily_output = process.env.SLACK_DAILY_OUTPUT;
const slack_weekly_output = process.env.SLACK_WEEKLY_OUTPUT;
const slack_hourly_output = process.env.SLACK_HOURLY_OUTPUT;
const slack_daily_runhour= Number(process.env.SLACK_DAILY_RUNHOUR);
const slack_weekly_runday= Number(process.env.SLACK_WEEKLY_RUNDAY);


const web = new WebClient(token);

//export const lambdaHandler = async(event: any, context: Context) => {

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function main(debugFlag?: string, showFlag?: string) {
    let attempt = 0;
    let slack_output = slack_hourly_output

    do {
      attempt++;
      try {
        //console.log ('Test ' + isCurrency ("$1,199,692"))
        console.log ('v1.3 CryptoTracker Running')
        
        const now = new Date();
        const freqFlag = process.env.SLACK_FREQ
        if (freqFlag == 'daily') {            
            slack_output = slack_daily_output
            if (now.getUTCHours() != slack_daily_runhour) {
            return {
                statusCode: 200,
                body: 'Skip: not the right time to run'
              }
            }
        } else if ((freqFlag == 'weekly')) {
            slack_output = slack_weekly_output
            if (now.getDay() != slack_weekly_runday) {
            return {
                statusCode: 200,
                body: 'Skip: not the right time to run'
                }
            }
        }
        
        const GET_LATEST = gql`
            query getMetricsAll($address: String!) {
                getMetricsAll(address: $address) {
                items { 
                    type
                    trade_volume_usd
                    trade_volume_eth
                    floor_price_usd
                    floor_price_eth
                    trade_count
                    owner_count
                    __typename
                }
                }
            }
            `
            // Create our number formatter.
            const formatterCurrency = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: "compact",
                compactDisplay: "short"
            });
            const formatterLargeNumber = new Intl.NumberFormat('en-US')
            const formatterPercentage = new Intl.NumberFormat('en-US', {
                style:'percent', 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
                        

            const variables = { address: "global" }
            const c_today = now
            const date = now.toISOString().split("T")[0]; // get a path-safe date

            var lastmonthdate = new Date();
            lastmonthdate.setDate(1);
            let lastmonthdatestring = lastmonthdate.toISOString().split("T")[0];
            if (debugFlag =="true") {console.log('Lastmonth Date ' + lastmonthdatestring)}
            if (debugFlag =="true") {console.log('Date ' + date)}
            if (date.substring(0, 7) == lastmonthdatestring.substring(0, 7)) {
                if (debugFlag =="true") {console.log('Dates are the same ' + lastmonthdate)}
                lastmonthdate.setMonth(lastmonthdate.getMonth()-1);
                if (debugFlag =="true") {console.log('Change month ' + lastmonthdate)}
                lastmonthdatestring = lastmonthdate.toISOString().split("T")[0];
            }
            let browser
            
            if (showFlag == "true") {
                if (debugFlag =="true") {console.log('Launching visible puppeteer')}
                browser = await puppeteer.launch({
                    //use the installed browser instead of Puppeteer's built in one
                    //executablePath: '/usr/bin/google-chrome',
                    defaultViewport: { width: 1920, height: 1080 }, // set browser size (this is the default for testing)
                    //Uncomment if you need to visually see what puppeteer is doing
                    headless:false,
                    slowMo: 200,
                    args: [
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-setuid-sandbox",
                        "--no-sandbox",
                    ]
                });
            } 
            else if (showFlag == "docker") 
            {
                if (debugFlag =="true") {console.log('Launching docker puppeteer')}
                browser = await puppeteer.launch({
                    //use the installed browser instead of Puppeteer's built in one
                    executablePath: '/usr/bin/google-chrome',
                    defaultViewport: { width: 1920, height: 1080 }, // set browser size (this is the default for testing)
                    //Uncomment if you need to visually see what puppeteer is doing
                    //headless:false,
                    //slowMo: 200,
                    //ignoreHTTPSErrors :true,
                    headless:true,
                    args: [
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-setuid-sandbox",
                        "--no-sandbox",
                        '--single-process',
                    ]
                });    
            } else
            {
                if (debugFlag =="true") {console.log('Launching headless default puppeteer')}
                browser = await puppeteer.launch({
                    //use the installed browser instead of Puppeteer's built in one
                    //executablePath: '/usr/bin/chromium-browser',
                    defaultViewport: { width: 1920, height: 1080 }, // set browser size (this is the default for testing)
                    //Uncomment if you need to visually see what puppeteer is doing
                    //headless:false,
                    //slowMo: 200,
                    headless:true
                });    
            }
            
            //Take screenshot
            if (debugFlag =="true") {console.log('Setup target divs')}
            const screenshotPath = "img/cryptoslam - "+ date + ".png";                       
            const url = "https://www.cryptoslam.io"
            
            if (debugFlag =="true") {console.log("Opening cryptoslam...")}
            const page = await browser.newPage();
            if (debugFlag =="true") {console.log('Opening page: ' + url)}
            await page.goto(url);
            if (debugFlag =="true") {console.log("Waiting for 1 second...")}
            await delay(1000);
          
            if (debugFlag =="true") {console.log("Get specific protocol ranking table on the page...")}
            if (rankingTable == undefined) return {
                statusCode: 400,
                body: 'Error: missing ranking table css config'
              }
            const table = await page.$(rankingTable); // get the table

            if (debugFlag =="true") {console.log("Take screenshot...")}
            await table?.screenshot({
                path: screenshotPath,
            });
            if (debugFlag =="true") {console.log("Screenshot saved to: ./" + screenshotPath)}

            //Pull data from ranking table
            if (debugFlag =="true") {console.log("Getting Cryptoslam data...")}
            
            if (dailyDataTable == undefined) return {
                statusCode: 400,
                body: 'Error: missing daily data css config'
              }

            let datatwentyfourhr = await page.$$eval(dailyDataTable, (rows) => {
                return Array.from(rows, (row) => {
                const columns = row.querySelectorAll("a");
                return Array.from(columns, (column) => column.innerText.trim());
                })})
            
            //added console logging to debug issues
            if (debugFlag == "true") {console.table(datatwentyfourhr)}

            //transpose table
            datatwentyfourhr = datatwentyfourhr[0].map((_, colIndex) => datatwentyfourhr.map(row => row[colIndex]));
            //added console logging to debug issues
            if (debugFlag == "true") {
                console.table(datatwentyfourhr)
            }
            //datatwentyfourhr = datatwentyfourhr.filter((item) => item[0]);
                        
            let twentyfourHourTradingData: { chain: string, tradevol: string}[] = []
            let i: number = 0

            //added console logging to debug issues
            if (debugFlag == "true") {console.log(datatwentyfourhr.length)}

            while ((i<datatwentyfourhr.length) && (i %2===0)) {
                twentyfourHourTradingData.push({"chain": datatwentyfourhr[i].toString(), "tradevol": datatwentyfourhr[i+1].toString()})
                i=i+2;
            }
            if (debugFlag =="true") {console.table(twentyfourHourTradingData)}

            let c_twentyfourhourTradeVolume: number = 0
            let twentyfourhourranking: number = 0
            let c_imx_twentyfourhour = twentyfourHourTradingData.filter(chain=> chain.chain ===chain_name)[0]
            twentyfourhourranking  = twentyfourHourTradingData.findIndex(chain => chain.chain ===chain_name)+1
            if (debugFlag =="true") {console.log ('24Hr ranking - ' + twentyfourhourranking)}
            c_twentyfourhourTradeVolume = Number(c_imx_twentyfourhour.tradevol.replace(/[^0-9.-]+/g, ''))
            if (debugFlag =="true") {console.log('24Hr trade volume - ' + c_imx_twentyfourhour.tradevol)}
                        
            //7 day data from table
            if (debugFlag =="true") {console.log('Processing 7 day data')}

            if (sevenDaySelector == undefined) return {
                statusCode: 400,
                body: 'Error: missing seven day selector css config'
              }

            await page.click(sevenDaySelector);
            await delay(5000);
            
            if (sevenDayTableSelector == undefined) return {
                statusCode: 400,
                body: 'Error: missing seven day ranking table selector css config'
              }
            let dataSevenDay = await page.$$eval(sevenDayTableSelector, (rows) => {
                return Array.from(rows, (row) => {
                const columns = row.querySelectorAll("a");
                return Array.from(columns, (column) => column.innerText.trim());
                });
            });

            dataSevenDay = dataSevenDay[0].map((_, colIndex) => dataSevenDay.map(row => row[colIndex]));  
            dataSevenDay = dataSevenDay.filter((item) => item[0]);
            
            let sevenDayTradingData: { chain: string, tradevol: string}[] = []
            i=0;
            while (i<dataSevenDay.length && (i %2===0)) {
                sevenDayTradingData.push({"chain": dataSevenDay[i].toString(), "tradevol": dataSevenDay[i+1].toString()})
                i=i+2;
            }
            if (debugFlag =="true") {console.table(sevenDayTradingData)}

            let c_sevendayTradeVolume: number = 0
            let sevendayranking: number = 0
            //check if IMX in the top 20 list and use the data there
            let c_imx_sevenday = sevenDayTradingData.filter(chain=> chain.chain ===chain_name)[0]
            sevendayranking = sevenDayTradingData.findIndex((value) => value.chain === chain_name) +1
            if (debugFlag =="true") {console.log ('7 Day ranking - ' + sevendayranking)}
            c_sevendayTradeVolume = Number(c_imx_sevenday.tradevol.replace(/[^0-9.-]+/g, ''))
            if (debugFlag =="true") {console.log('7 Day trade volume - ' + c_imx_sevenday.tradevol)}


            if (thirtyDaySelector == undefined) return {
                statusCode: 400,
                body: 'Error: missing thirty day selector css config'
              }
            //30 day data from table
            await page.click(thirtyDaySelector);
            await delay(5000);

            if (thirtyDayTableSelector == undefined) return {
                statusCode: 400,
                body: 'Error: missing thirty day ranking table css config'
              }

            let dataThirtyDay = await page.$$eval(thirtyDayTableSelector, (rows) => {
                return Array.from(rows, (row) => {
                const columns = row.querySelectorAll("a");
                return Array.from(columns, (column) => column.innerText.trim());
                });
            });
            dataThirtyDay = dataThirtyDay[0].map((_, colIndex) => dataThirtyDay.map(row => row[colIndex]));
            dataThirtyDay = dataThirtyDay.filter((item) => item[0]);            
            
            let thirtyDayTradingData: { chain: string, tradevol: string}[] = []
            i=0;
            while (i<dataThirtyDay.length && (i %2===0)) {
                thirtyDayTradingData.push({"chain": dataThirtyDay[i].toString(), "tradevol": dataThirtyDay[i+1].toString()})
                i=i+2;
            }
            if (debugFlag =="true") {console.table(thirtyDayTradingData)}

            let c_thirtydayTradeVolume: number = 0
            let thirtydayranking: number = 0
            //check if IMX in the top 20 list and use the data there
            let c_imx_thirtyday = thirtyDayTradingData.filter(chain=> chain.chain ===chain_name)[0]
            thirtydayranking = thirtyDayTradingData.findIndex((value) => value.chain === chain_name)+1
            if (debugFlag =="true") {console.log ('30 Day ranking - ' + thirtydayranking)}
            c_thirtydayTradeVolume = Number(c_imx_thirtyday.tradevol.replace(/[^0-9.-]+/g, ''))
            if (debugFlag =="true") {
                console.log('30 Day trade volume - ' + c_imx_thirtyday.tradevol)
        
                console.log("")  
                console.log("Cryptoslam data retrieved")
            }
            //clean up puppeteer
            await page.close();
            await browser.close();  
            if (debugFlag =="true") {
                console.log("") 
            
                console.log("Getting Immutascan data...")
            }
            const data: any = await gotScraping(immmutascanGraphQLEndpoint as string, {
                // we are expecting a JSON response back
                responseType: 'json',
                // we must use a post request
                method: 'POST',
                // this is where we pass in our token
                headers: { 'x-api-key': immmutascanGraphQLAPIKey, 'Content-Type': 'application/json' },
                // here is our query with our variables
                body: JSON.stringify({ query: GET_LATEST.loc?.source.body, variables }),
            }).catch(function(e) {
                console.log('promise rejected')
            });

            let posfortoday = 1

            // get the item at index[1] so its the second latest (i.e. yesterday)
            let immutascanTradeDate = new Date(data.body["data"]["getMetricsAll"]["items"][posfortoday]["type"]);

            if (now.getUTCHours() < 10) posfortoday +=1

            let i_twentyfourhourTradeVolume = data.body["data"]["getMetricsAll"]["items"][posfortoday]["trade_volume_usd"];
            if (debugFlag =="true") {console.log("Immutascan trade volume: " + formatterCurrency.format(i_twentyfourhourTradeVolume) + " on: " + immutascanTradeDate)}

            //let temp7day = data.body["data"]["getMetricsAll"]["items"].slice(2,9)
            //let temp30day = data.body["data"]["getMetricsAll"]["items"].slice(2,32)
            //console.table(temp7day)

            let i_sevendayTradeVolume = data.body["data"]["getMetricsAll"]["items"].slice(posfortoday,posfortoday+7).reduce((previous:any, current:any)=> previous+current.trade_volume_usd,0);
            if (debugFlag =="true") {console.log ('Immutascan - 7 Day data: Volume of trades - ' + formatterCurrency.format(i_sevendayTradeVolume))}
            let i_sevendayTradeTrades = data.body["data"]["getMetricsAll"]["items"].slice(posfortoday,posfortoday+7).reduce((previous:any, current:any)=> previous+current.trade_count,0);
            if (debugFlag =="true") {console.log ('Immutascan - 7 Day data: Number of trades - ' + formatterLargeNumber.format(i_sevendayTradeTrades))}

            //console.table(temp30day)
            let i_thirtydayTradeVolume = data.body["data"]["getMetricsAll"]["items"].slice(posfortoday,posfortoday+30).reduce((previous:any, current:any)=> previous+current.trade_volume_usd,0);
            if (debugFlag =="true") {console.log ('Immutascan - 30 Day data: Volume of trades - ' + formatterCurrency.format(i_thirtydayTradeVolume))}
            let i_thirtydayTradeTrades = data.body["data"]["getMetricsAll"]["items"].slice(posfortoday,posfortoday+30).reduce((previous:any, current:any)=> previous+current.trade_count,0);
            if (debugFlag =="true") {console.log ('Immutascan - 30 Day data: Number of trades - ' + formatterLargeNumber.format(i_thirtydayTradeTrades))}

            if (debugFlag =="true") {console.log("Immutascan data retrieved")}

            if (debugFlag =="true") {console.log ('Daily summary - ' + date)}
            const pct24hrVolume = (c_twentyfourhourTradeVolume/i_twentyfourhourTradeVolume)-1
            const pct7dayVolume = (c_sevendayTradeVolume/i_sevendayTradeVolume)-1
            const pct30dayVolume = (c_thirtydayTradeVolume/i_thirtydayTradeVolume)-1
            const maxpctError = Math.max(Math.abs(pct24hrVolume), Math.abs(pct7dayVolume), Math.abs(pct30dayVolume))

            //Summary of 
            let tradingData: { tracker: string, date: string, tradevol24hr_usd:string, tradevol7day_usd:string, tradevol30day_usd:string}[] = 
            [
                {"tracker": "Cryptoslam", "date":c_today.toISOString().split("T")[0], "tradevol24hr_usd": formatterCurrency.format(c_twentyfourhourTradeVolume), "tradevol7day_usd":formatterCurrency.format(c_sevendayTradeVolume), "tradevol30day_usd":formatterCurrency.format(c_thirtydayTradeVolume)},
                {"tracker": "Immutascan", "date":immutascanTradeDate.toISOString().split("T")[0], "tradevol24hr_usd": formatterCurrency.format(i_twentyfourhourTradeVolume), "tradevol7day_usd":formatterCurrency.format(i_sevendayTradeVolume), "tradevol30day_usd":formatterCurrency.format(i_thirtydayTradeVolume)},
                {"tracker": "Cr/Im", "date":date, "tradevol24hr_usd": formatterPercentage.format(pct24hrVolume), "tradevol7day_usd":formatterPercentage.format(pct7dayVolume), "tradevol30day_usd":formatterPercentage.format(pct30dayVolume)}
            ]
            if (debugFlag =="true") {console.table(tradingData)}

            //Output for slack message
            console.log(`Quick data check (Cryptoslam v Immutascan)`)			
            console.log(`Last 24 hours (Rank ${twentyfourhourranking}) -  ${formatterCurrency.format(c_twentyfourhourTradeVolume)} v  ${formatterCurrency.format(i_twentyfourhourTradeVolume)} (${formatterPercentage.format(pct24hrVolume)}})`)
            console.log(`Last 7 days   (Rank ${sevendayranking}) -  ${formatterCurrency.format(c_sevendayTradeVolume)} v  ${formatterCurrency.format(i_sevendayTradeVolume)} (${formatterPercentage.format(pct7dayVolume)})`)
            console.log(`Last 30 days  (Rank ${thirtydayranking}) - ${formatterCurrency.format(c_thirtydayTradeVolume)} v ${formatterCurrency.format(i_thirtydayTradeVolume)} (${formatterPercentage.format(pct30dayVolume)})`)
            console.log ()
            console.log (`Error rate ` + formatterPercentage.format(maxpctError))
            
            const summarymsg = `Quick data check (Cryptoslam v Immutascan)
• Last 24 hours (Rank ${twentyfourhourranking}) -  ${formatterCurrency.format(c_twentyfourhourTradeVolume)} v  ${formatterCurrency.format(i_twentyfourhourTradeVolume)} (${formatterPercentage.format(pct24hrVolume)}) 
• Last 7 days   (Rank ${sevendayranking}) -  ${formatterCurrency.format(c_sevendayTradeVolume)} v  ${formatterCurrency.format(i_sevendayTradeVolume)} (${formatterPercentage.format(pct7dayVolume)}) 
• Last 30 days  (Rank ${thirtydayranking}) - ${formatterCurrency.format(c_thirtydayTradeVolume)} v ${formatterCurrency.format(i_thirtydayTradeVolume)} (${formatterPercentage.format(pct30dayVolume)}) 

Max error rate ${formatterPercentage.format(maxpctError)}`

            //Post to Slack
            //upload screenshot first
            //example - curl -F file=@dramacat.gif -F "initial_comment=Shakes the cat" -F channels=C024BE91L,D032AC32T -H "Authorization: Bearer xoxb-xxxxxxxxx-xxxx" https://slack.com/api/files.upload

            //#deal-cryptoslam - https://hooks.slack.com/services/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
            //#ecosytem team - https://hooks.slack.com/services/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
            //Example curl -X POST -H 'Content-type: application/json' --data '{"text":"Hello, World!"}' https://hooks.slack.com/services/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
            if (debugFlag =="true") {
                console.log('Check Slack auth')
                console.log (await web.auth.test())
            }
            
            //exit here if debub flag is set to true
            if (slack_output == "None" || slack_output =="" || slack_output == null) {
                console.log("Debug mode complete. No post to slack")
                return {
                    statusCode: 200,
                    body: 'Debug complete'
                  }
            } else {
                if (debugFlag =="true") {
                    console.log("Posting to Slack...")
                    console.log ('Check Slack token length - ' + web.token?.length)
                }
            }

            //Slack SDK push to post message and upload file
            //#ecosystem-team - C04B1PCTXEH
            //#wg-imx-user-rewards - C03NCT02NLC
            //#deal-cryptoslam - C03AT6FF1GQ
            //#cryptoslam-immutable - C02LJPASEKE

            var slack_input = {
                file: screenshotPath,  // also accepts Buffer or ReadStream
                filename: "cryptoslam_immutable - "+ date + ".png",
                channel_id: 'C04B1PCTXEH', //prod - C03AT6FF1GQ // testing - C04B1PCTXEH
                initial_comment: summarymsg,
                title: 'Immutable + Cryptoslam data issue - ' + date
            }
            
            //posting to deal-cryptoslam channel
            if (slack_output?.includes("dc")) {
                slack_input.channel_id = 'C03AT6FF1GQ'
                const resultSlackUpload = await web.files.uploadV2(slack_input);
                console.log('Post to #deal-cryptoslam slack channel')
                if (debugFlag =="true") {console.log('Posted to #deal-cryptoslam slack channel: ', resultSlackUpload.files)}
            }

            //posting to team-partnerships channel
            if (slack_output?.includes("tp") || slack_output == null || slack_output == "") {
                slack_input.channel_id = 'C04B1PCTXEH'
                const resultSlackUpload = await web.files.uploadV2(slack_input);
                // `result may contain multiple files uploaded
                console.log('Post to #team-partnerships slack channel')
                if (debugFlag =="true") {console.log('Posted to #team-partnerships slack channel: ', resultSlackUpload.files)}
            }
            
            
            //posting to WG rewards channel
            if (slack_output?.includes("wr")) {
                slack_input.channel_id = 'C03NCT02NLC'
                if (maxpctError > internal_error_threshold) { //prod 0.5 //test 1.0
                    const resultSlackUpload2 = await web.files.uploadV2(slack_input);
                    console.log('Post to #WG-Rewards slack channel')
                    if (debugFlag =="true") {console.log('Posted to #WG-Rewards slack channel:', resultSlackUpload2.files)}
                    }    
            }     
            
            const errormsg = `Data discrepancy > 5% in last 24 hours (Cryptoslam v Immutascan)
• Last 24 hours (Rank ${twentyfourhourranking}) -  ${formatterCurrency.format(c_twentyfourhourTradeVolume)} v  ${formatterCurrency.format(i_twentyfourhourTradeVolume)} (${formatterPercentage.format(pct24hrVolume)}) 
• Last 7 days   (Rank ${sevendayranking}) -  ${formatterCurrency.format(c_sevendayTradeVolume)} v  ${formatterCurrency.format(i_sevendayTradeVolume)} (${formatterPercentage.format(pct7dayVolume)}) 
• Last 30 days  (Rank ${thirtydayranking}) - ${formatterCurrency.format(c_thirtydayTradeVolume)} v ${formatterCurrency.format(i_thirtydayTradeVolume)} (${formatterPercentage.format(pct30dayVolume)})`

            if (slack_output?.includes("ci")) {
            //posting to Cryptoslam shared comms channel
                slack_input.channel_id = 'C02LJPASEKE'
                if (pct24hrVolume < -external_error_threshold) { //prod 0.5 //test 1.0
                    const resultSlackUpload2 = await web.files.uploadV2(slack_input);
                    console.log('Post to #cryptoslam-immutable slack channel')
                    if (debugFlag =="true") {console.log('Posted to #cryptoslam-immutable slack channel: ', resultSlackUpload2.files)}
                    }   
            }          

        return {
          statusCode: 200,
          body: screenshotPath
        }
      } catch (err) {
        console.log('Error:', err);
        if (attempt <= 2) {
          console.log('Trying again');
        }
      }
    } while (attempt <= 2)
    
    if (debugFlag == "true") {
        console.log("Debug mode complete. No post to slack")
        return {
            statusCode: 200,
            body: 'Debug complete'
          }
    } else {
        const result = await web.chat.postMessage({
            //Posting to #team-partnerships
            channel: 'C04B1PCTXEH', //prod - C03AT6FF1GQ // testing - C04B1PCTXEH
            text: 'Error in Cryptotracker job',
            });
        console.log(result)
    }
    
    return {
      statusCode: 400,
      body: 'Error'
    }
    
}
const argv = yargs(process.argv.slice(2))
.usage('Usage: -d <debug_flag> -s <show_flag>')
.options({
   d: { describe: 'debug flag', type: 'string', demandOption: false },
   s: { describe: 'show working flag', type: 'string', demandOption: false }
})
.parseSync();

main(argv.d, argv.s)
.then(() => {
    console.log('CryptoTracker Scraper Complete')
    process.exit(0);
    })
.catch(err => {
  console.error(err);
  process.exit(1);
});
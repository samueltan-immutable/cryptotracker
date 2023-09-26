const AWS = require('aws-sdk');
const ecs = new AWS.ECS();
const SecretsManager = require('./secretsManager.js');


exports.handler = async (event, context) => {
    const cluster = 'launch-ecs-fg-prod';
    const taskDefinition = 'launch-task-cryptotracker';
    const containerName = 'cryptotracker'
    const params = {
        cluster: cluster,
        taskDefinition: taskDefinition,
        overrides: {
            containerOverrides: [
                {
                    name: containerName,
                    environment: [
                        {
                            "name": "SLACK_TOKEN",
                            "value": await SecretsManager.getSecret('prod/cryptotracker/slack', 'us-west-2')
                        },
                        {
                            "name": "CSS_RANKING_TABLE_WHEADER",
                            "value": ".css-1ayfwsn > div:nth-child(1)"
                        },
                        {
                            "name": "CSS_SEVEN_DAY_SELECTOR",
                            "value": "div.css-p7vv0e:nth-child(2)"
                        },
                        {
                            "name": "CSS_THIRTY_DAY_SELECTOR",
                            "value": "div.css-p7vv0e:nth-child(3)"
                        },
                        {
                            "name": "CSS_RANKING_TABLE",
                            "value": ".css-1ayfwsn > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)"                        
                        },
                        {
                            "name": "IMMUTASCAN_GRAPHQL_ENDPOINT",
                            "value": "https://qbolqfa7fnctxo3ooupoqrslem.appsync-api.us-east-2.amazonaws.com/graphql"                        
                        },
                        {
                            "name": "IMMUTASCAN_GRAPHQL_APIKEY",
                            "value": "da2-2xc46nv5njaszgwrb24jhmeavm"                        
                        }
                    
                    ]
                }
            ]
        },
        launchType: 'FARGATE',
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [
                    'subnet-056360544232d2b48', 'subnet-0ac7818769c07bc63', 'subnet-0d372124e4a171617', 'subnet-000bfd4beebcc5693'
                ],
                securityGroups: ['sg-00b9f372198dbf4ef']
            }
        }
    };

    try {
        const response = await ecs.runTask(params).promise();
        console.log(`Launched task: ${
            response.tasks[0].taskArn
        }`);
    } catch (error) {
        console.error(error);
    }
};
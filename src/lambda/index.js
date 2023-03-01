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
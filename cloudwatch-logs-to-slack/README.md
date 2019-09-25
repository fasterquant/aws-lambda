# cloudwatch-logs-to-slack

An [AWS Lambda](https://aws.amazon.com/lambda/) function for posting [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) log events to
[Slack](https://slack.com/).

## Setup

### Function configuration

Add the function code to AWS Lambda with the following configuration options:

| Key     | Value                       |
| ------- | --------------------------- |
| Runtime | Node.js 10.x                |
| Handler | index.handler               |
| Role    | AWSLambdaBasicExecutionRole |
| Memory  | 128 (MB)                    |
| Timeout | 3 sec                       |
| KMS key | aws/lambda                  |

### Environment variables

Set the following required environment variable for the Lambda function:

| Key     | Value                                                               |
| ------- | ------------------------------------------------------------------- |
| webhook | [AWS KMS](https://aws.amazon.com/kms/) encrypted Slack WebHook URL. |

Set the following optional environment variables for the Lambda function:

| Key        | Value                                       |
| ---------- | ------------------------------------------- |
| channel    | Slack channel to send the notifications to. |
| eventType  | The type of event (i.e. Application Log, Strategy Execution Log, etc.) |
| parseLogEvent  | Set to **true** if the log event is expected to be a JSON object which you want to be parsed to create a formatted Slack message. Set to **false** for the log event to be sent to Slack without any formatting.  |
| username   | Bot username used for the slack messages.   |

### Trigger configuration

Add the desired [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) log stream and filter as the trigger for
the Lambda function.

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

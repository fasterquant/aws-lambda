# sns-to-slack

An [AWS Lambda](https://aws.amazon.com/lambda/) function for posting SNS messages to
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
| username   | Bot username used for the slack messages.   |

### Trigger configuration

Add the desired [SNS](https://aws.amazon.com/sns) topic as the trigger for
the Lambda function.

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

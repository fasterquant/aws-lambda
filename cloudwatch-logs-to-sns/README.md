# cloudwatch-logs-to-sns

An [AWS Lambda](https://aws.amazon.com/lambda/) function for publishing [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) log events to
[SNS](https://aws.amazon.com/sns/).

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

The environment variables for this Lambda function are used to map live trading log events to SNS topics.  Below are some example properties.

| Key     | Value (SNS Arn)                                                              |
| ------- | ------------------------------------------------------------------- |
| strategyId_228393 | arn:aws:sns:region-2334342:strategyXYZ |
| strategyId_7788393 | arn:aws:sns:region-2334342:strategyABC |


### Trigger configuration

Add the desired [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) log stream and filter as the trigger for
the Lambda function.

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

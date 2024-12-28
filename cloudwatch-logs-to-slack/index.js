'use strict'
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms"; // ES Modules import
import https from 'https';
import zlib from 'zlib';
import url from 'url';

const env = process.env;
const client = new KMSClient({region: 'us-east-1'});

const unzipLogData = async (logData) => {
   return new Promise((resolve, reject) => {
        zlib.gunzip(logData, (error, result) => {
            if (error) {
                console.log('error is ' + JSON.stringify(error));
                reject(error);
            } 
            else 
            {
                const logData = JSON.parse(result.toString('ascii'));
                resolve(logData.logEvents);
            }
        });
     });
};

const decryptWebhook = async () => {
    console.log('Decrypt ' + env.webhook);
    
    const req = {
        CiphertextBlob: Buffer.from(env.webhook, 'base64'),
        EncryptionContext: { LambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME },
      };
      
    const command = new DecryptCommand(req);
    const response = await client.send(command);
    const decrypted = new TextDecoder().decode(response.Plaintext);

    return decrypted;
};

const buildPostRequests = (logEvents, webhook) => {   
    return logEvents.reduce((result, event) =>  {
        const postData = event.message; //buildSlackMessage(event.message);
        result.push( () => {
            post(webhook, null);
        });
        return result;
    }, []);
}


const buildSlackMessage = (logEvents) => {
    const attachments = buildAttachments(logEvents);
    return {
        channel: env.channel,
        username: env.userName,
        icon_emoji: null,
        icon_url: null,
        attachments
  }
}

const buildAttachments = (logEvents) => {
  return logEvents.reduce((result, event) =>
    {
        const logEventMessage = event.message;
        const messageObject = env.parseLogEvent != null && env.parseLogEvent.toLowerCase() == 'true' ? parseLogEventMessage(logEventMessage) : { text: logEventMessage} ;
        const attachment = {
            fallback: env.eventType,
            title: env.eventType,
            text: messageObject.text, 
            color: null,
            fields: messageObject.fieldProperties
          }
          
        result.push(attachment);
        
        return result;
        
    },[]);
};

const parseLogEventMessage = (message) => {
  let messageObject = {
      text: message,
      fieldProperties: null
  }
  
  const pos = message.indexOf("{");
  
  if (pos == -1)
  {
      return messageObject;
  }
  
  let eventObject;
  try {
       eventObject = JSON.parse(message.substring(pos));
  } catch (e) {
      return messageObject;
  }
  
  messageObject.text = message.substring(0, pos) + "\n\n\n";
 
  const keys = Object.keys(eventObject);
  messageObject.fieldProperties = keys.reduce((result, key) => 
    {
      result.push( {
        title: key,
        value: JSON.stringify(eventObject[key]),
        short: true
      });
      
      return result;
    
    }, []);
    
  return messageObject;

}

const post = async (requestUrl, data) => {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data)
          const options = url.parse(requestUrl)
          options.method = 'POST'
          options.headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
      
        return https
        .request(options, res => {
            res.on('data', (d) => {
                resolve({statusCode: res.statusCode});
            });
        }).on('error', err => {
            console.log(err);
            reject(err);
        })
        .end(body);
    });
}

export const handler = async (event) => {
    const logData = new Buffer.from(event.awslogs.data, 'base64');
    
    const webhook = await decryptWebhook();
    console.log('webhook: ' + webhook);
    const logEvents = await unzipLogData(logData);
    const slackMessage = buildSlackMessage(logEvents);
    
    const res = await post(webhook, slackMessage);
    console.log('post respose: ' + JSON.stringify(res));
};
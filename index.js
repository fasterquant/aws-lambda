'use strict'

const aws = require('aws-sdk');
const https = require('https');
const zlib = require('zlib');
const url = require('url');

const env = process.env;

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
    return new Promise((resolve, reject) => {
        console.log('Decrypt ' + env.webhook);
        const kms = new aws.KMS();
        const enc = { CiphertextBlob: Buffer.from(env.webhook, 'base64') };
        kms.decrypt(enc, (err, data) => {
            if (err) return reject(err);
            resolve(data.Plaintext.toString('ascii'));
        });
    });
};

const buildPostRequests = (logEvents, webhook) =>
{   
    return logEvents.reduce((result, event) =>  {
        const postData = event.message; //buildSlackMessage(event.message);
        result.push( () => {
            post(webhook, null);
        });
        return result;
    }, []);
}


const buildSlackMessages = (logEvents) => {
    return logEvents.reduce((result, event) =>
    {
        result.push(buildSlackMessage(event.message));
        return result;
        
    },[]);
}

const buildSlackMessage = (logEventMessage) => {
  
  const messageObject = env.parseLogEvent != null && env.parseLogEvent.toLowerCase() == 'true' ? parseLogEventMessage(logEventMessage) : { text: logEventMessage} ;
  
  return {
    channel: env.channel,
    username: env.userName,
    icon_emoji: null,
    icon_url: null,
    attachments: [
      {
        fallback: env.eventType,
        title: env.eventType,
        text: messageObject.text, 
        color: null,
        fields: messageObject.fieldProperties
      }
    ]
  }
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


exports.handler = async (event) => {
    const logData = new Buffer.from(event.awslogs.data, 'base64');
    
    const webhook = await decryptWebhook();
    const logEvents = await unzipLogData(logData);
    const slackMessages = buildSlackMessages(logEvents);
    
    for(const slackMsg of slackMessages) {
        const res = await post(webhook, slackMsg);
        console.log('post respose: ' + JSON.stringify(res));
    }
};
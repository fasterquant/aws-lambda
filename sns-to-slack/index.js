'use strict'

const aws = require('aws-sdk');
const https = require('https');
const url = require('url');

const env = process.env;

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
        const messageObject = parseLogEventMessage(logEventMessage);
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

exports.handler = async (event) => {
    const webhook = await decryptWebhook();
    const logEvents = JSON.parse(event.Records[0].Sns.Message);
    const slackMessage = buildSlackMessage(logEvents);
    
    const res = await post(webhook, slackMessage);
    console.log('post respose: ' + JSON.stringify(res));
};


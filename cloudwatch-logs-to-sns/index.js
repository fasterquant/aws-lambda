'use strict'

const aws = require('aws-sdk');
const zlib = require('zlib');
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

const zipLogEvents = async (logEvents) => {
   return new Promise((resolve, reject) => {
        zlib.gzip(logEvents, (error, result) => {
            if (error) {
                console.log('error is ' + JSON.stringify(error));
                reject(error);
            } 
            else 
            {
                resolve(result);
            }
        });
     });
};

const getSnsCollection = () => {
    const envVars = Object.keys(env);
    return envVars.reduce((result, ev) =>  {
        if (ev.indexOf('strategyId') > -1) {
           const evParts = ev.split('_');
           result[evParts[1]] = {
               arn: env[ev],
               events: []
           }
        }
       
        return result;
    }, {});
};

const populateSnsCollectionWithEvents = (snsCollection, logEvents) => {
     return logEvents.reduce((result, le) =>  {
         const pos = le.message.indexOf("{");
         const event = JSON.parse(le.message.substring(pos));
         const strategyIdStr = event.StrategyId.toString();
         console.log("here ya " + JSON.stringify(result[strategyIdStr]));
         if (result[strategyIdStr]) {
             result[strategyIdStr].events.push(le);
         }
       
        return result;
    }, snsCollection);
};

const getSnsPublishPromises = (snsCollection) => {
    const snsCollectionKeys = Object.keys(snsCollection);
    
    return snsCollectionKeys.reduce((result, key) =>  {
        if (snsCollection[key].events.length == 0) {
            return result;
        }
        const params = {
          Message: JSON.stringify(snsCollection[key].events),
          TopicArn: snsCollection[key].arn
        };
        
        const publishTextPromise = new aws.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
        result.push(publishTextPromise);
       
        return result;
    }, []);
}


exports.handler = async (event) => {
    const logData = new Buffer.from(event.awslogs.data, 'base64');
    const logEvents = await unzipLogData(logData);
    const snsCollection = populateSnsCollectionWithEvents(getSnsCollection(), logEvents);
    const snsPublishPromises = getSnsPublishPromises(snsCollection);

    const res = await Promise.all(snsPublishPromises);
    console.log('SNS publish completion response: ' + JSON.stringify(res));
};

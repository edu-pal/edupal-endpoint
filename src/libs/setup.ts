import AWS from 'aws-sdk';
import Mixpanel from 'mixpanel';
import 'source-map-support/register';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
});

const isProd = process.env.STAGE === 'prod';
const mixpanel = Mixpanel.init(
  isProd
    ? 'bb91258d531fa5d286e2367a1bf873bc'
    : '163ddda22a51cddd2fcce948b3d8406d',
  {
    protocol: 'https',
  }
);

export { docClient, mixpanel };

export default {};

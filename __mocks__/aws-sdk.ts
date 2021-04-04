// eslint-disable-next-line unicorn/filename-case
import AWS from 'aws-sdk';

AWS.config.credentials = new AWS.SharedIniFileCredentials();

export default AWS;

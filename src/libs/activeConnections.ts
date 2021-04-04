import { DynamoDB } from 'aws-sdk';
/**
 * Query all active connections students or teachers in meeting
 */
const activeConnections = async (
  meetingId: string,
  docClient: DynamoDB.DocumentClient
): Promise<DynamoDB.DocumentClient.AttributeMap | undefined> =>
  (
    await docClient
      .get({
        TableName: process.env.REALTIME_TABLE_NAME!,
        Key: {
          pk: `MEETING#${meetingId}`,
          sk: 'META',
        },
        ProjectionExpression: 'activeConnections',
      })
      .promise()
  ).Item;

export default activeConnections;

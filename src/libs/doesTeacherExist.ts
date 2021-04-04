import { DynamoDB } from 'aws-sdk';
import { ItemList } from 'aws-sdk/clients/dynamodb';
/**
 * Queries DB to check whether any teachers exist
 * @param {String} meetingId
 * @returns The items to the query
 */
const doesTeacherExist = async (
  meetingId: string,
  docClient: DynamoDB.DocumentClient
): Promise<ItemList | undefined> =>
  (
    await docClient
      .query({
        TableName: process.env.REALTIME_TABLE_NAME!,
        ExpressionAttributeValues: {
          ':pk': `MEETING#${meetingId}`,
          ':sk': `USER#TEACHER#${meetingId}#`,
        },
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        ProjectionExpression: '#name, sk',
      })
      .promise()
  ).Items;

export default doesTeacherExist;

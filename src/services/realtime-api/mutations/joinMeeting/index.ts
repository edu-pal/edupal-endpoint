import { AppSyncResolverEvent } from 'aws-lambda';

import { ID, UserInput, Role } from '@type/index';
import { docClient, mixpanel } from '@libs/setup';
import allSettled from '@libs/allSettled';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<NewParticipantInfo> => {
  const {
    meetingId,
    user, // NOTE: role is a throwaway, not used
  } = event.arguments;

  const { id } = user;

  const connectionDateTime = new Date().toISOString();
  const pk = `MEETING#${meetingId}`;

  let role: Role;
  let classId: string;
  // Coerce to STUDENT if a TEACHER already exists and it's not them
  try {
    const item = (
      await docClient
        .get({
          TableName: process.env.REALTIME_TABLE_NAME!,
          Key: {
            pk,
            sk: 'META',
          },
          ProjectionExpression: 'classId',
        })
        .promise()
    ).Item;
    if (item === undefined) {
      // If it's first person in meeting, coerce role to TEACHER
      classId = 'null';
      role = 'TEACHER';
    } else {
      // If META exists, then not first person and coerce to STUDENT
      classId = item!.classId;
      role = 'STUDENT';
    }
  } catch (error) {
    throw new Error(`Uncaught error at get META: ${error}`);
  }

  /**
   * TransactWrite not used because user info may exist if user drops off from call
   * If info exists, AWS will throw ConditionalCheckFailed Exception, but this is expected
   * Thus ConditionExpression acts as internal if statement
   */
  const batchConditionalPut = [
    docClient
      .put({
        // User Information
        TableName: process.env.REALTIME_TABLE_NAME!,
        ConditionExpression: 'attribute_not_exists(sk)',
        Item: {
          pk,
          sk: `USER#${role}#${meetingId}#${id}`,
          classId: 'null', // NOTE: classId effectively disabled because feature not available yet
          user,
          ...(role === 'STUDENT'
            ? {
                coinTotal: 0,
                game: { correctStreak: 0, coinChange: 0 },
              }
            : {}),
        },
      })
      .promise(),
    docClient
      .put({
        // If it's first person in meeting. Class global META field setup.
        TableName: process.env.REALTIME_TABLE_NAME!,
        ConditionExpression: 'attribute_not_exists(sk)',
        Item: {
          pk,
          sk: 'META',
          time: { start: connectionDateTime, end: null },
          // Value for GSI keys must be non-empty string, strongly typed
          classId: 'null',
          activeConnections: { STUDENT: 0, TEACHER: 1 },
        },
      })
      .promise(),
    docClient
      .update({
        // If not first person, then increment
        TableName: process.env.REALTIME_TABLE_NAME!,
        ConditionExpression: 'attribute_exists(sk)',
        Key: { pk, sk: 'META' },
        ExpressionAttributeValues: { ':one': 1 },
        UpdateExpression: 'ADD activeConnections.STUDENT :one',
      })
      .promise(),
  ];

  try {
    await allSettled(batchConditionalPut!);
  } catch (error) {
    // Conditional request expected to fail when not init
    if (error.code !== 'ConditionalCheckFailedException') {
      throw new Error(`Uncaught error at batchConditionalPut: ${error}`);
    }
  }

  mixpanel.track('Join Meeting', {
    distinct_id: id,
    $ip: event.identity?.sourceIp,
    meetingId,
    role,
  });

  return {
    role,
    classId,
  };
};

export type Arguments = { meetingId: ID; user: UserInput };
export type NewParticipantInfo = {
  role: Role;
  classId: ID;
};

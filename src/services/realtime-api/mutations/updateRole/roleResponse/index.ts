import { AppSyncResolverEvent } from 'aws-lambda';
import { docClient } from '@libs/setup';
import { ID, UserInput, User, Role, ManualPromise } from '@type/index';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<RoleResponse> => {
  const {
    meetingId,
    newRole,
    requestee,
    status,
    judge,
  } = event.arguments.input;
  const pk = `MEETING#${meetingId}`;

  const roleResponse: RoleResponse = {
    meetingId,
    newRole,
    requestee,
    status: 'PENDING',
    judge,
  };

  if (status === 'APPROVED') {
    roleResponse.status = 'APPROVED';
    return roleResponse;
  }

  if (status === 'REJECTED') {
    roleResponse.status = 'REJECTED';
    return roleResponse;
  }

  await docClient
    .update({
      TableName: process.env.REALTIME_TABLE_NAME!,
      ConditionExpression: 'attribute_exists(sk)',
      Key: { pk, sk: 'META' },
      ExpressionAttributeValues: { ':one': 1, ':minusone': -1 },
      UpdateExpression:
        newRole === 'TEACHER'
          ? 'ADD activeConnections.STUDENT :minusone, activeConnections.TEACHER :one'
          : 'ADD activeConnections.STUDENT :one, activeConnections.TEACHER :minusone',
    })
    .promise();

  roleResponse.status = 'APPROVED';
  return roleResponse;
};

export type RoleResponseInput = {
  meetingId: ID;
  newRole: Role;
  requestee: UserInput;
  status: ManualPromise;
  judge: UserInput;
};

export type RoleResponse = {
  meetingId: ID;
  newRole: Role;
  requestee: User;
  status: ManualPromise;
  judge: User;
};

export type Arguments = { input: RoleResponseInput };

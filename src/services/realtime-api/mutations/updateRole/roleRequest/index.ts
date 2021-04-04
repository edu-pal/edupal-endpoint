import { AppSyncResolverEvent } from 'aws-lambda';
import { docClient } from '@libs/setup';
import { ID, UserInput, User, Role, ManualPromise } from '@type/index';
import doesTeacherExist from '@libs/doesTeacherExist';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<RoleRequest> => {
  const { meetingId, newRole, requestee } = event.arguments.input;
  const pk = `MEETING#${meetingId}`;

  const roleRequest: RoleRequest = {
    meetingId,
    newRole,
    requestee,
    status: 'PENDING',
  };

  if (newRole === 'TEACHER') {
    const teacherQuery = (await doesTeacherExist(meetingId, docClient))!;

    if (teacherQuery.length > 0) {
      const skArr = (teacherQuery[0].sk as string).split('#');
      const teacherId = skArr[skArr.length - 1];

      if (teacherId !== requestee.id) roleRequest.status = 'PENDING';
      return roleRequest;
    }
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

  roleRequest.status = 'APPROVED';
  return roleRequest;
};

export type RoleRequestInput = {
  meetingId: ID;
  newRole: Role;
  requestee: UserInput;
};

export type RoleRequest = {
  meetingId: ID;
  newRole: Role;
  requestee: User;
  status: ManualPromise;
};

export type Arguments = { input: RoleRequestInput };

import { studentBarry, teacherSwift, transform, uuid } from '@libs/jest';
import { handler, Arguments, RoleResponse } from '.';
import {
  handler as joinMeetingHandler,
  Arguments as JoinMeetingArguments,
} from '../../joinMeeting/index';

let meetingId: string;
beforeAll(async () => {
  meetingId = uuid();
  await joinMeetingHandler(
    transform<JoinMeetingArguments>({ meetingId, user: teacherSwift })
  );
  await joinMeetingHandler(
    transform<JoinMeetingArguments>({ meetingId, user: studentBarry })
  );
});

describe('respondChangeRole handler', () => {
  it('should allow teacher to approve the students request', async () => {
    const params = transform<Arguments>({
      input: {
        meetingId,
        newRole: 'TEACHER',
        requestee: studentBarry,
        status: 'APPROVED',
        judge: teacherSwift,
      },
    });
    const response: RoleResponse = await handler(params);
    expect(response.meetingId).toBe(meetingId);
    expect(response.newRole).toBe('TEACHER');
    expect(response.requestee).toBe(studentBarry);
    expect(response.status).toBe('APPROVED');
  });
  it('should allow teacher to reject the students request', async () => {
    const params = transform<Arguments>({
      input: {
        meetingId,
        newRole: 'TEACHER',
        requestee: studentBarry,
        status: 'REJECTED',
        judge: teacherSwift,
      },
    });
    const response: RoleResponse = await handler(params);
    expect(response.meetingId).toBe(meetingId);
    expect(response.newRole).toBe('TEACHER');
    expect(response.requestee).toBe(studentBarry);
    expect(response.judge).toBe(teacherSwift);
    expect(response.status).toBe('REJECTED');
  });
});

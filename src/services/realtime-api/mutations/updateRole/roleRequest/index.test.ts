import { studentBarry, teacherSwift, transform, uuid } from '@libs/jest';
import { handler, Arguments } from '.';
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

describe('requestChangeRole handler', () => {
  it('allows request to change role', async () => {
    const params = transform<Arguments>({
      input: {
        meetingId,
        newRole: 'TEACHER',
        requestee: studentBarry,
      },
    });
    const response = await handler(params);
    expect(response.meetingId).toBe(meetingId);
    expect(response.newRole).toBe('TEACHER');
    expect(response.requestee).toBe(studentBarry);
    expect(response.status).toBe('PENDING');
  });
});

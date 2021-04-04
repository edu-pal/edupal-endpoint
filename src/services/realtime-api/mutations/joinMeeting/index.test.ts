import { transform, uuid, teacherMalala, teacherSwift } from '@libs/jest';
import { handler, Arguments } from '.';

let meetingId: string;
beforeEach(() => {
  meetingId = uuid();
});

describe('joinMeeting handler', () => {
  it('adds participant to meeting', async () => {
    const params = transform<Arguments>({
      meetingId,
      user: teacherMalala,
    });
    const response = await handler(params);
    expect(response).toMatchObject({
      role: 'TEACHER',
      classId: 'null',
    });
  });

  it('makes participant a teacher if first in meeting', async () => {
    const params = transform<Arguments>({
      meetingId,
      user: teacherSwift,
    });
    const response = await handler(params);
    expect(response).toMatchObject({
      role: 'TEACHER',
      classId: 'null',
    });
  });

  it('makes participant a student if someone else is already in meeting', async () => {
    const params = transform<Arguments>({
      meetingId,
      user: teacherSwift,
    });
    await handler(params);
    const secondParticipantParams = transform<Arguments>({
      meetingId,
      user: teacherMalala,
    });
    const response = await handler(secondParticipantParams);
    expect(response).toMatchObject({
      role: 'STUDENT',
      classId: 'null',
    });
  });
});

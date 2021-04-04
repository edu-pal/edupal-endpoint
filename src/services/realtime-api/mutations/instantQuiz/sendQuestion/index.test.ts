import { transform, uuid, teacherMalala } from '@libs/jest';
import { handler, Arguments, Question } from '.';

let meetingId: string;
beforeAll(() => {
  meetingId = uuid();
});

describe('sendQuestion handler', () => {
  it('should let teacher not join meeting and ask a question', async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        user: teacherMalala,
        type: 'MCQ',
        image: null,
        text: 'What is 2+2?',
        options: {
          MCQ: ['4', '19', '-i', 'No Solution'],
        },
        answer: {
          MCQ: [true, false, false, false],
        },
      },
    });
    const response: Question = await handler(params);
    expect(response.numStudents).toBe(0);
    expect(response.classId).toBe('null');
    expect(response.meetingId).toBe(meetingId);
    expect(response.image).toBe(null);
    expect(response.text).toBe('What is 2+2?');
    expect(response.options).toStrictEqual({
      MCQ: ['4', '19', '-i', 'No Solution'],
    });
    expect(response.answer).toStrictEqual({ MCQ: [true, false, false, false] });
  });

  it('should accept ShortAnswer question with answer', async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        user: teacherMalala,
        type: 'ShortAnswer',
        image: null,
        text: 'What is the powerhouse of the cell?',
        options: {
          ShortAnswer: null,
        },
        answer: {
          ShortAnswer: 'mitochondria',
        },
      },
    });
    const response: Question = await handler(params);
    expect(response.options).toStrictEqual({
      ShortAnswer: null,
    });
    expect(response.answer).toStrictEqual({ ShortAnswer: 'mitochondria' });
  });
});

import {
  studentBarry,
  studentSoy,
  teacherSwift,
  transform,
  uuid,
} from '@libs/jest';
import { handler, Arguments, Response } from '.';
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
    transform<JoinMeetingArguments>({ meetingId, user: studentSoy })
  );
});

describe('sendResponse handler', () => {
  it("should error when student doesn't join meeting", async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        questionId: uuid(),
        questionDateTime: new Date().toISOString(),
        answerer: studentBarry,
        type: 'ShortAnswer',
        answer: null,
        theirAnswer: { ShortAnswer: 'Yes but actually no' },
      },
    });

    await expect(handler(params)).rejects.toThrow(
      'Uncaught DynamoDB transactWrite error: TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None, None, None]'
    );
  });

  it('should error when theirAnswer not passed', async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        questionId: uuid(),
        questionDateTime: new Date().toISOString(),
        answerer: studentSoy,
        type: 'MCQ',
        answer: { MCQ: null },
        theirAnswer: {},
      },
    });

    await expect(handler(params)).rejects.toThrow(
      'Expected theirAnswer[type] to be non-null. Please supply response.'
    );
  });

  it('should ignore punctuation when grading ShortAnswer', async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        questionId: uuid(),
        questionDateTime: new Date().toISOString(),
        answerer: studentSoy,
        type: 'ShortAnswer',
        answer: {
          ShortAnswer: 'mitochondria...?',
        },
        theirAnswer: {
          ShortAnswer: '--->mitochondria!! ',
        },
      },
    });
    const response: Response = await handler(params);

    expect(response.theirAnswer).toStrictEqual({
      ShortAnswer: '--->mitochondria!! ',
    });
    expect(response.coinsEarned).toBe(1);
    expect(response.isCorrect).toBe(true);
  });

  it('should allow only one response attempt', async () => {
    const params = transform<Arguments>({
      input: {
        classId: 'null',
        meetingId,
        questionId: uuid(),
        questionDateTime: new Date().toISOString(),
        answerer: studentSoy,
        type: 'MCQ',
        answer: {
          MCQ: [true, false, false, false],
        },
        theirAnswer: {
          MCQ: [false, true, false, false],
        },
      },
    });
    await handler(params); // First attempt
    // Second attempt
    await expect(handler(params)).rejects.toThrow(
      'Uncaught DynamoDB transactWrite error: TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed, ConditionalCheckFailed, ConditionalCheckFailed]'
    );
  });
});

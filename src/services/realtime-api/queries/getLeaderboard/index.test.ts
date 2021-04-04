import {
  transform,
  studentBarry,
  studentSoy,
  uuid,
  teacherSwift,
} from '@libs/jest';
import { docClient } from '@libs/setup';
import { handler, Arguments, Leaderboard } from '.';
import {
  handler as joinMeetingHandler,
  Arguments as JoinMeetingArguments,
} from '../../mutations/joinMeeting/index';

let meetingId: string;
beforeEach(async () => {
  meetingId = uuid();
  await joinMeetingHandler(
    // Dummy throwaway teacher. First user joining meeting always TEACHER
    transform<JoinMeetingArguments>({ meetingId, user: teacherSwift })
  );
  await joinMeetingHandler(
    transform<JoinMeetingArguments>({ meetingId, user: studentSoy })
  );
  await joinMeetingHandler(
    transform<JoinMeetingArguments>({ meetingId, user: studentBarry })
  );
  await docClient
    .transactWrite({
      TransactItems: [
        {
          Update: {
            TableName: process.env.REALTIME_TABLE_NAME!,
            Key: {
              pk: `MEETING#${meetingId}`,
              sk: `USER#STUDENT#${meetingId}#${studentBarry.id}`,
            },
            ExpressionAttributeValues: {
              ':change': 1,
              ':streak': 3,
              ':total': 5,
            },
            UpdateExpression: `SET game.correctStreak = :streak, game.coinChange = :change, coinTotal = :total`,
            ConditionExpression: 'attribute_exists(sk)',
          },
        },
        {
          Update: {
            TableName: process.env.REALTIME_TABLE_NAME!,
            Key: {
              pk: `MEETING#${meetingId}`,
              sk: `USER#STUDENT#${meetingId}#${studentSoy.id}`,
            },
            ExpressionAttributeValues: {
              ':change': 0,
              ':streak': 4,
              ':total': 7,
            },
            UpdateExpression: `SET game.correctStreak = :streak, game.coinChange = :change, coinTotal = :total`,
            ConditionExpression: 'attribute_exists(sk)',
          },
        },
      ],
    })
    .promise();
});

describe('getLeaderboard handler', () => {
  it('returns array of ranked students in the meeting', async () => {
    const params = transform<Arguments>({
      meetingId,
      user: studentBarry, // Doesn't matter teacher or student, or even which user you give. Purely for analytics.
    });
    const data: Leaderboard = await handler(params);
    expect(data).toStrictEqual([
      {
        user: studentSoy,
        coinTotal: 7,
        correctStreak: 4,
        coinChange: 0,
        leaderboardPosition: 1,
      },
      {
        user: studentBarry,
        coinTotal: 5,
        correctStreak: 3,
        coinChange: 1,
        leaderboardPosition: 2,
      },
    ]);
  });
});

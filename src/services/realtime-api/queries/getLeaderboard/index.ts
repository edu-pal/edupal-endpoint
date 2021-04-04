import { AppSyncResolverEvent } from 'aws-lambda';
import { ID, User, UserInput } from '@type/index';
import { docClient } from '@libs/setup';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<Leaderboard> => {
  const { meetingId } = event.arguments;

  let queryResponse;
  try {
    queryResponse = (await docClient
      .query({
        TableName: process.env.REALTIME_TABLE_NAME!,
        IndexName: 'LeaderboardIndex',
        ExpressionAttributeValues: {
          ':pk': `MEETING#${meetingId}`,
        },
        ExpressionAttributeNames: {
          '#user': 'user',
        },
        KeyConditionExpression: 'pk = :pk',
        ScanIndexForward: false, // Descending order by coinTotal
        ProjectionExpression: 'sk, coinTotal, game, #user',
      })
      .promise())!.Items;
  } catch (error) {
    throw new Error(`Uncaught error at query LeaderboardIndex: ${error}`);
  }

  return queryResponse!.map(({ coinTotal, game, user }, i) => ({
    user,
    coinTotal,
    correctStreak: game.correctStreak,
    coinChange: game.coinChange,
    leaderboardPosition: i + 1, // 1-indexed cause displayed to end user
  }));
};

export type Leaderboard = {
  user: User;
  coinTotal: number;
  correctStreak: number;
  coinChange: number;
  leaderboardPosition: number;
}[];

export type Arguments = { meetingId: ID; user: UserInput };

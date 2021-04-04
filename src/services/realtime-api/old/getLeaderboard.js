const { docClient } = require('../util');
const mixpanel = require('./mixpanel');

/**
 * HTTP-like action of getting leaderboard info for given meeting
 * @param {*} data
 * @param {*} socket
 */
const getLeaderboard = async ({ meetingId, userId }, socket) => {
  const leaderboardParams = {
    IndexName: 'LeaderboardIndex',
    ExpressionAttributeValues: {
      ':pk': `MEETING#${meetingId}`,
    },
    ExpressionAttributeNames: {
      '#name': 'name',
    },
    KeyConditionExpression: 'pk = :pk',
    ScanIndexForward: false,

    ProjectionExpression:
      '#name, sk, avatar, coinTotal, gamification, coinChange',
  };

  const mixpanelPromise = mixpanel(
    {
      action: 'track',
      id: 'Get Leaderboard',
      properties: {
        distinct_id: userId,
      },
    },
    socket
  );

  let queryResponse;
  try {
    [queryResponse] = await Promise.all([
      docClient.query(leaderboardParams).promise(),
      userId && mixpanelPromise, // 2021-02-12 Migration to new frontend implementation
    ]);
    queryResponse = queryResponse.Items;
  } catch (error) {
    return {
      statusCode: 404,
      reason: 'Error at get ClassId',
      error,
    };
  }

  const data = queryResponse.map(
    ({ sk, gamification, coinChange, name, avatar, coinTotal }) => ({
      name,
      id: sk.split('#')[sk.split('#').length - 1],
      avatar,
      points: coinTotal,
      streak: gamification.correctStreak,
      change: coinChange,
    })
  );

  return {
    statusCode: 200,
    action: 'receiveLeaderboard',
    data,
  };
};

module.exports = getLeaderboard;

const { docClient } = require('../util');
const mixpanel = require('../mutations/mixpanel');

const disconnect = async (data, socket) => {
  if (data === undefined) {
    // eslint-disable-next-line no-console
    console.log(`Connection ${socket.id} has disconnected forcefully`);
    return {
      statusCode: 200,
      message: 'You have forcefully disconnected. This is not recommended.',
    };
  }
  const { meetingId, role, userId } = data;
  const now = new Date().toISOString();
  // TODO: Query with reverse index and delete each
  const transactParams = [
    {
      Delete: {
        TableName: process.env.db,
        Key: {
          pk: `MEETING#${meetingId}`,
          sk: `CONN#${role.toUpperCase()}#${socket.id}`,
        },
      },
    },
    {
      Update: {
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk: 'META' },
        ExpressionAttributeValues: {
          ':decr': -1,
        },
        UpdateExpression: 'ADD activeConnections :decr',
      },
    },
  ];

  const mixpanelPromise = mixpanel(
    {
      action: 'track',
      id: 'Leave Meeting',
      properties: { distinct_id: userId },
    },
    socket
  );

  await Promise.all([
    docClient.transactWrite({ TransactItems: transactParams }).promise(),
    mixpanelPromise,
  ]);

  // TODO: Stream-like logic to funnel meeting data and update to class
  // TODO: Actual stream on activeConnections 0 trigger (with ReturnValue) for attendance

  return {
    message: `You have disconnected gracefully at ${now}`,
    statusCode: 200,
  };
};

module.exports = disconnect;

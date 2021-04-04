const {
  RealtimeTable,
} = require('./src/services/realtime-api/database/stack.dev.json');
process.env.REALTIME_TABLE_NAME = RealtimeTable;
process.env.AWS_REGION = 'ap-southeast-1';
process.env.STAGE = 'dev';

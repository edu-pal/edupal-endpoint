const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const getFile = (filepath) =>
  fs.readFileSync(path.join(__dirname, filepath), {
    encoding: 'utf8',
    flag: 'r',
  });

const getStack = (stage) => {
  let id;
  try {
    id = require('../../../../resources/shared-appsync/stack.dev.json')
      .GraphQlApiId;
  } catch {
    // File may not exist
    id = '';
  }
  return id;
};

module.exports = {
  requestMappingTemplate:
    console.log(__dirname) ||
    getFile('../../../template/lambdaDefault.request.vtl'),
  responseMappingTemplate: getFile(
    '../../../template/lambdaDefault.response.vtl'
  ),
  appSyncIddev: getStack('dev'),
  appSyncIdprod: getStack('prod'),
};

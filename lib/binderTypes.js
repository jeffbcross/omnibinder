angular.module('SyncResource')
  .factory('$binderTypes', function () {
    return {
      COLLECTION: 'collection',
      OBJECT: 'object',
      BOOLEAN: 'boolean',
      STRING: 'string',
      NUMBER: 'number',
      BINARY: 'binary',
      BINARY_STREAM: 'binaryStream'
    };
  });
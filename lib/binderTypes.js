angular.module('OmniBinder')
  .factory('obBinderTypes', [function () {
    return {
      COLLECTION: 'collection',
      OBJECT: 'object',
      BOOLEAN: 'boolean',
      STRING: 'string',
      NUMBER: 'number',
      BINARY: 'binary',
      BINARY_STREAM: 'binaryStream'
    };
  }]);

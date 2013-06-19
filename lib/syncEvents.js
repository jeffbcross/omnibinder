angular.module('SyncResource')
  .factory('syncEvents', function () {
    return {
      GET: 'read',
      MOVE: 'move',
      ADD: 'add',
      REMOVE: 'remove',
      CREATE: 'create',
      UPDATE: 'update',
      NONE: 'none',
      INIT: 'init'
    };
  });
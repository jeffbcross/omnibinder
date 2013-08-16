angular.module('Binder')
  .value('syncEvents', {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'remove',
    PUSH: 'push',
    MOVE: 'move',
    NONE: 'none',
    INIT: 'init',
    UNKNOWN: 'unknown'
  });

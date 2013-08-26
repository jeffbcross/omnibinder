angular.module('OmniBinder')
  .value('obSyncEvents', {
    //Standard Object.observe change events
    NEW: 'new',
    UPDATED: 'update',
    DELETED: 'deleted',
    RECONFIGURED: 'reconfigured',
    //End standard Object.observe change events.
    //Used for initial synchronization of data from protocol.
    READ: 'read',
    MOVE: 'move',
    NONE: 'none',
    INIT: 'init',
    UNKNOWN: 'unknown'
  });

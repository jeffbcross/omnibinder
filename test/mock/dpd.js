angular.module('SyncDeployd', [])
  .factory('dpd', function ($timeout) {
    return {
      documents: {
        get: function (id, callback) {
          if (typeof id === 'function') {
            callback = id;  
          }
          callback('doc!');
        },
        put: function (id, obj, callback) {
          callback('updated');
        },
        post: function (data, callback) {
          callback({id: 'A456'});
        },
        on: function (ev, callback) {
          this.listeners = this.listeners || [];
          this.listeners[ev] = callback;
          callback('event!');
        },
        off: function (ev) {
          this.listeners[ev] = null;
        },
        del: function (id, callback) {
          callback('', null);
        }
      }
    }
  });
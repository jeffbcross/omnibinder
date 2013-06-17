angular.module('SyncDeployd', [])
  .factory('dpd', function ($timeout) {
    return {
      documents: {
        get: function (id, callback) {
          callback('doc!');
        },
        put: function (id, obj, callback) {
          callback('updated');
        },
        on: function (ev, callback) {
          callback('event!');
        }
      }
    }
  });
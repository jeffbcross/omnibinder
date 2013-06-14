angular.module('SyncDeployd')
  .factory('dpd', function () {
    return {
      documents: {
        get: function (id, callback) {
          callback('doc!');
        },
        on: function (ev, callback) {
          callback('event!');
        }
      }
    }
  });
'use strict';

angular.module('SyncDeployd', [])
  .factory('syncDeployd', function ($q, dpd) {
    function DeploydTransport (options) {
      this.options = options;
    };

    DeploydTransport.prototype.get = function (query) {
      var deferred = $q.defer();

      dpd[query.path].get(query.id, function (data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    }

    DeploydTransport.prototype.subscribe = function (query, callback) {
      dpd[query.path].on('create', function (data) {
        callback.call(this, 'create', data);
      });

      dpd[query.path].on('delete', function (data) {
        callback.call(this, 'delete', data);
      });

      dpd[query.path].on('update', function (data) {
        callback.call(this, 'update', data);
      });
    };

    DeploydTransport.prototype.getCollection = function (callback) {
      dpd[this.options.path].get(callback);
    };

    DeploydTransport.prototype.getObject = function (id, callback) {
      dpd[this.options.path].get(id, callback);
    };

    DeploydTransport.prototype.subscribeToCollection = function (callback) {
      dpd[this.options.path].on('create', function (doc) {
        callback.call(this, 'create', doc);
      });

      dpd[this.options.path].on('delete', function (doc) {
        callback.call(this, 'delete', doc);
      });

      dpd[this.options.path].on('update', function (doc) {
        callback.call(this, 'update', doc);
      });
    };

    DeploydTransport.prototype.subscribeToObject = function (id, callback) {
      dpd[this.options.path].on('update:' + id, callback);
    };

    DeploydTransport.prototype.unsubscribeFromObject = function () {

    };

    DeploydTransport.prototype.updateObject = function (id, value) {
      dpd[this.options.path].put(id, value);
    };

    return DeploydTransport;
  });
'use strict';

angular.module('SyncDeployd', [])
  .factory('syncDeployd', function ($q, $rootScope, dpd) {
    function DeploydTransport (options) {
      this.options = options;
    };

    DeploydTransport.prototype.create = function (query, data) {
      if (!query || !query.path || typeof data === 'undefined') throw new Error("Create requires query.path and data");
      var deferred = $q.defer();

      dpd[query.path].post(data, function (data) {
        deferred.resolve(data);
      });

      return deferred.promise;
    };

    DeploydTransport.prototype.read = function (query) {
      if (!query || !query.path) throw new Error('Read requires query.path and query.id');
      var deferred = $q.defer();

      if (query.id) {
        dpd[query.path].get(query.id, function (data) {
          deferred.resolve(data);
        });
      }
      else {
        dpd[query.path].get(function (data) {
          
          deferred.resolve(data);
          $rootScope.$digest();
        });
      }

      return deferred.promise;
    };

    DeploydTransport.prototype.update = function (syncer, query, obj) {
      if (!query.path) throw new Error("Update requires query.path");
      var deferred = $q.defer();

      if (query.id) {
        dpd[query.path].put(query.id, obj, function (res) {
          deferred.resolve(res);
        });  
      }
      else {
        //TODO: Determine how to sync changes to a collection. Get the delta?
      }

      return deferred.promise;
    };

    DeploydTransport.prototype.delete = function (query) {
      if (!query || !query.path || !query.id) throw new Error("Delete requires query.id and query.path");
      var deferred = $q.defer();

      dpd[query.path].del(query.id, function (res, err) {
        deferred.resolve(err);
      });

      return deferred.promise;
    };

    DeploydTransport.prototype.pluck = function (list, item) {
      var found;
      angular.forEach(list, function (li, i) {
        if (found) return;
        if (item.id === li.id) {
          list.splice(i, 1);
          found = true;
        }
      })
    };

    DeploydTransport.prototype.updateItem = function (list, item) {
      var found;
      angular.forEach(list, function (li, i) {
        if (found) return;
        if (item.id === li.id) {
          list[i] = item;
          found = true;
        }
      });
    }

    DeploydTransport.prototype.subscribe = function (syncer, query, callback) {
      if (!query || !query.path) throw new Error("Subscribe requires query.path");

      var self = this
        , single = query.id ? ':' + query.id: '';

      this.read(query).then(function (data) {
        syncer.data = data;
        callback('read', data);
      });

      dpd[query.path].on('create' + single, function (data) {
        if (!single && Array.isArray(syncer.data)) {
          syncer.data.push(data);
        }
        else {
          syncer.data = data;
        }

        callback && callback.call(this, 'create', syncer.data);
      });

      dpd[query.path].on('delete' + single, function (data) {
        if (!single && Array.isArray(syncer.data)) {
          self.pluck(syncer.data, data);
        }
        else {
          syncer.data = data;
        }

        callback && callback.call(this, 'delete', syncer.data);
      });

      dpd[query.path].on('update' + single, function (data) {
        if (!single && Array.isArray(syncer.data)) {
          self.updateItem(syncer.data, data);
        }
        else {

          syncer.data = data;
        }

        callback && callback.call(this, 'update', syncer.data);
      });
    };

    /*
    *  TODO: 
    *   Q: Should unsub support a callback?
    *   A: Probably should; no reason to handcuff a protocol. A promise doesn't seem to make sense for something that isn't intended to return data. 
    */
    DeploydTransport.prototype.unsubscribe = function (query) {
      if (!query || !query.path) throw new Error("Unsubscribe requires query.path");
      
      var single = query.id ? ':' + query.id: '';

      dpd[query.path].off('create' + single);
      dpd[query.path].off('delete' + single);
      dpd[query.path].off('update' + single);
    };

    return function (config) {
      var protocol = Object.create(DeploydTransport.prototype);
      DeploydTransport.call(protocol, config);
      return protocol;
    };
  });
'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q) {
    function Synchronizer (config) {
      var self = this;
      this.config = config;
    }

    Synchronizer.prototype.events = {
      GET: 'read',
      MOVE: 'move',
      ADD: 'add',
      REMOVE: 'remove',
      CREATE: 'create',
      UPDATE: 'update',
      NONE: 'none',
      INIT: 'init'
    };

    Synchronizer.prototype.unHash = function (array) {
      if (Array.isArray(array)) {
        angular.forEach(array, function (item) {
          if (item.$$hashKey) delete item.$$hashKey;
        });
      }
      else if (typeof array == 'object') {
        delete array.$$hashKey;
      }
      
      return array;
    };

    Synchronizer.prototype.findRemovedItem = function findRemovedItem (newVal, oldVal) {
      var old = {}, i;

      //First get the ids of the items that were there.
      for (i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = true;
        
      }

      //Then iterate through the items in the new array.
      for (i = 0; i < newVal.length; i++) {
        delete old[JSON.stringify(newVal[i])];
      }

      if (Object.keys(old).length !== 1) throw new Error("Could not find removed item.");

      return JSON.parse(Object.keys(old)[0]);
    };

    Synchronizer.prototype.findAddedItem = function (newVal, oldVal) {
      var ids = {}, i;

      //Make a dictionary of hash keys that were already there.
      for (i = 0; i < oldVal.length; i++) {
        ids[JSON.stringify(oldVal[i])] = true;
      }

      for (i = 0; i < newVal.length; i++) {
        if (!ids[JSON.stringify(newVal[i])]) return {
          data: newVal[i],
          position: i
        };
      }
    };

    Synchronizer.prototype.determineDelta = function (newVal, oldVal) {
      var item = {}, type;

      if ((!newVal && !oldVal) || (angular.equals(newVal, oldVal) && angular.equals(newVal, self.lastUpdate))) {
        type = this.events.NONE;
      }
      else if (oldVal && Array.isArray(oldVal) && Array.isArray(newVal)) {
        // Something has changed in an existing array.
        if (newVal.length > oldVal.length) {
          // Something has been added to the array.
          item = this.findAddedItem(newVal, oldVal);
          type = this.events.CREATE;
        }
        else if (newVal.length < oldVal.length) {
          // Something has been removed from the array.
          item = this.findRemovedItem(newVal, oldVal);
          type = this.events.REMOVE;
        }
        else {
          // An object changed within the array.
          item = this.findUpdatedItem(newVal, oldVal);
          type = this.events.UPDATE;
        }
      }

      return {
        type: type,
        position: item.position,
        data: item.data
      }
    };

    Synchronizer.prototype.bind = function (query, model) {
      var self = this
        , deferred = $q.defer()
        , binder = { events: this.events };
      
      //Listen for changes
      this.config.protocol.subscribe(binder, query, function (ev, message) {
        self.lastUpdate = angular.copy(message);
        
        if (ev === self.events.READ) {
          deferred.resolve(message);
        }
        else if (ev === self.events.ADD) {
          if (angular.equals(message, self.lastDelta)) return;
          if (Array.isArray(self.config.scope[model])) {
            self.config.scope[model].push(message);
          }
          else if (typeof self.config.scope[model] === 'string') {
            //TODO: Assumes append, instead of specific positioning.
            self.config.scope[model] += message;
          }
        }
        else {
          self.config.scope[model] = message;

          //TODO: Get rid of this.
          if (!self.config.scope.$$phase) {
            self.config.scope.$apply();
          }
        }
      });
      
      //Push changes
      this.config.scope.$watch(model, function (newVal, oldVal) {
        var delta = self.determineDelta(newVal, oldVal);
        switch (delta.type) {
          case self.events.UPDATE:
            self.config.protocol.update(self, query, self.unHash(newVal));
            break;
          case self.events.NONE:
            break;
          case self.events.CREATE:
            self.lastDelta = angular.copy(delta.data);
            self.config.protocol.create(query, self.unHash(delta.data));
            break;
        }
      }, true);

      return deferred.promise;
    };

    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    }
  });

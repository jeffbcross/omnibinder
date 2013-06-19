'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q) {
    function Synchronizer (config) {
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
        old[JSON.stringify(oldVal[i])] = i;
      }

      //Then iterate through the items in the new array.
      for (i = 0; i < newVal.length; i++) {
        delete old[JSON.stringify(newVal[i])];
      }

      if (Object.keys(old).length !== 1) throw new Error("Could not find removed item.");

      return {
        position: old[Object.keys(old)[0]],
        data: JSON.parse(Object.keys(old)[0])
      };
    };

    Synchronizer.prototype.findAddedItem = function (newVal, oldVal) {
      var old = {}, i;

      //Make a dictionary of hash keys that were already there.
      for (i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = true;
      }

      for (i = 0; i < newVal.length; i++) {
        if (!old[JSON.stringify(newVal[i])]) return {
          data: newVal[i],
          position: i
        };
      }
    };

    Synchronizer.prototype.findUpdatedItem = function (newVal, oldVal) {
      var old = {}, i;

      for(i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = i;
      }
      
      for(i = 0; i < newVal.length; i++) {
        if (typeof old[JSON.stringify(newVal[i])] === 'undefined') return {
          data: newVal[i],
          position: i
        }
      }
    };

    //TODO: This can only find one diff right now, can't find multiple diffs at different positions.
    Synchronizer.prototype.findAddedString = function (newVal, oldVal) {
      var position, i;

      for(i = 0; i < newVal.length; i++) {
        if (newVal[i] !== oldVal[i]) {
          position = i;
          break;
        }
      }

      return {
        position: position,
        data: newVal.substr(position, newVal.length - oldVal.length)
      }
    };

    Synchronizer.prototype.findChangedString = function (newVal, oldVal) {
      var start, end, i;

      for (i = 0; i < newVal.length; i++) {
        if (typeof start === 'undefined' && newVal[i] !== oldVal[i]) {
          start = i;
          end = i;
        }
        else if (typeof start !== 'undefined' && newVal[i] !== oldVal[i]) {
          end = i + 1;
        }
      }
      
      return {
        data: newVal.substr(start, end - start),
        position: start
      };
    };

    Synchronizer.prototype.findRemovedString = function (newVal, oldVal) {
      var start, end, i, lDiff = oldVal.length - newVal.length, data, removed;

      for (i = 0; i < newVal.length; i++) {
        if (typeof start === 'undefined' && oldVal[i] !== newVal[i]) {
          start = i;
          end = i + lDiff;
        }
        else if (typeof start !== 'undefined' && oldVal[i + lDiff] !== newVal[i]) {
          end = i + lDiff + 1;
        }
      } 
      
      if (end - start > oldVal.length - newVal.length) {
        removed = oldVal.substr(start, end - start);
        //This wasn't a simple removal...it was an UPDATE!
        end = start;
        for (var j = start; j < newVal.length; j++) {
          if (newVal[j] !== oldVal[j + lDiff]) {
            end = j;
          }
        }
        
        data = newVal.substr(start, end - start + 1);
      }
      else {
        data = oldVal.substr(start, end - start);
      }

      return {
        position: start,
        data: data,
        removed: removed
      };
    };

    Synchronizer.prototype.compareStrings = function (newVal, oldVal) {
      var item, type;
      if (newVal.length > oldVal.length) {
        item = this.findAddedString(newVal, oldVal);
        type = this.events.ADD;
      }
      else if (newVal.length < oldVal.length) {
        item = this.findRemovedString(newVal, oldVal);
        type = item.removed && item.removed.length !== (oldVal.length - newVal.length) ? this.events.UPDATE : this.events.REMOVE;
      }
      else {
        type = this.events.UPDATE;
        item = this.findChangedString(newVal, oldVal);
      }

      return {
        type: type,
        data: item.data,
        position: item.position
      };
    };

    Synchronizer.prototype.compareArrays = function (newVal, oldVal) {
      var type, item;
      // Something has changed in an existing array.
      if (newVal.length > oldVal.length) {
        // Something has been added to the array.
        item = this.findAddedItem(newVal, oldVal);
        type = this.events.ADD;
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

      return {
        type: type,
        data: item.data,
        position: item.position
      }
    };

    Synchronizer.prototype.determineDelta = function (newVal, oldVal) {
      var item = {}, type;

      if (!oldVal && newVal) {
        return {
          type: this.events.CREATE,
          data: newVal,
          position: 0
        }
      }
      else if ((!newVal && !oldVal) || (angular.equals(newVal, oldVal) && angular.equals(newVal, self.lastUpdate))) {
        return {
          type: this.events.NONE
        };
      }
      else if (oldVal && Array.isArray(oldVal) && Array.isArray(newVal)) {
        return this.compareArrays(newVal, oldVal);
      }
      else if (typeof newVal === 'string' && typeof oldVal === 'string') {
        return this.compareStrings(newVal, oldVal);
      }
    };

    Synchronizer.prototype.onModelChange = function (newVal, oldVal, query) {
      var delta = this.determineDelta(newVal, oldVal);
      switch (delta.type) {
        case this.events.UPDATE:
          this.config.protocol.update(query, this.unHash(delta.data));
          break;

        case this.events.NONE:
          break;

        case this.events.REMOVE:
          this.lastDelta = angular.copy(delta.data);
          this.config.protocol.remove(query, this.unHash(delta.data));
          break;

        case this.events.ADD:
          this.lastDelta = angular.copy(delta.data);
          this.config.protocol.create(query, this.unHash(delta.data));
          break;
      }
    };

    Synchronizer.prototype.addedFromProtocol = function (model, message) {
      if (Array.isArray(model)) {
        model.push(message);
      }
      else if (typeof model === 'string') {
        //TODO: Assumes append, instead of specific positioning or replacement.
        model += message;
      }
    };

    Synchronizer.prototype.removedFromProtocol = function (model, message) {
      var found;

      if (Array.isArray(model)) {
        angular.forEach(model, function (item, i) {
          if (found) return;
          if (angular.equals(item, message)) {
            model.splice(i, 1);
            found = true;
          };
        });
      }
    };

    Synchronizer.prototype.onProtocolChange = function (ev, message, model, deferred) {
      var found, self = this;
      this.lastUpdate = angular.copy(message);
        
      switch(ev) {
        case this.events.READ:
          deferred.resolve(message);
          break;

        case this.events.ADD:
          if (angular.equals(message, this.lastDelta)) return;
          this.addedFromProtocol(this.config.scope[model], message);
          break;

        case this.events.REMOVE:
          this.removedFromProtocol(this.config.scope[model], message);
          
          break;
        default:
          this.config.scope[model] = message;

          //TODO: Get rid of this.
          if (!this.config.scope.$$phase) {
            this.config.scope.$apply();
          }
      }
    };

    Synchronizer.prototype.bind = function (query, model) {
      var self = this
        , deferred = $q.defer()
        , binder = { events: this.events };
      
      //Listen for changes
      this.config.protocol.subscribe(binder, query, function () {
        var args = this.arguments;
        args.push(model);
        args.push(deferred);
        this.onProtocolChange.apply(self, args);
      });
      
      //Push changes
      this.onModelChange.bind(this);
      this.onProtocolChange.bind(this);
      
      this.config.scope.$watch(model, function () {
        self.onModelChange.call(self, newVal, oldVal, query)
      }, true);

      return deferred.promise;
    };

    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    };
  });

'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q, differ, syncEvents) {
    function Synchronizer (config) {
      this.config = config;
    }

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

    Synchronizer.prototype.onModelChange = function (newVal, oldVal, query) {
      newVal = this.unHash(newVal);
      oldVal = this.unHash(oldVal);
      var delta = differ.determineDelta(newVal, oldVal, this.lastUpdate);

      switch (delta.type) {
        case syncEvents.UPDATE:
          this.config.protocol.update(query, this.unHash(delta.data));
          break;

        case syncEvents.NONE:
          break;

        case syncEvents.UNKNOWN:
          break;

        case syncEvents.REMOVE:
          this.lastDelta = angular.copy(delta.data);
          this.config.protocol.remove(query, this.unHash(delta.data));
          break;

        case syncEvents.ADD:
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

    Synchronizer.prototype.onProtocolChange = function (ev, message, model) {
      var found, self = this;
      this.lastUpdate = angular.copy(message);
        
      switch(ev) {
        case syncEvents.READ:
          // deferred.resolve(message); Do something else.
          break;

        case syncEvents.ADD:
          if (angular.equals(message, this.lastDelta)) return;
          this.addedFromProtocol(this.config.scope[model], message);
          break;

        case syncEvents.REMOVE:
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
        , binder = {};
      
      binder.query = query;
      //Listen for changes
      this.config.protocol.subscribe(binder, query, function () {
        var args = Array.prototype.slice.call(arguments, 0);;

        args.push(model);
        self.onProtocolChange.apply(self, args);
      });
      
      //Push changes
      this.onModelChange.bind(this);
      this.onProtocolChange.bind(this);
      
      this.config.scope.$watch(model, function (newVal, oldVal) {
        self.onModelChange.call(self, newVal, oldVal, query)
      }, true);

      return binder;
    };

    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    };
  });

'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q, $binder, $differ, syncEvents) {
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
      var delta = $differ.determineDelta(newVal, oldVal, this.lastUpdate);
      delta.data = this.unHash(delta.data);

      switch (delta.type) {
        case syncEvents.UPDATE:
          this.config.protocol.update(query, delta.data);
          break;

        case syncEvents.NONE:
          break;

        case syncEvents.UNKNOWN:
          break;

        case syncEvents.REMOVE:
          this.lastDelta = angular.copy(delta.data);
          this.config.protocol.remove(query, delta);
          break;

        case syncEvents.ADD:
          this.lastDelta = angular.copy(delta.data);
          this.config.protocol.create(query, delta.data);
          break;
      }
    };

    Synchronizer.prototype.addedFromProtocol = function (scope, modelName, message) {
      if (!scope[modelName]) {
        scope[modelName] = [message];
      }
      if (Array.isArray(scope[modelName])) {
        scope[modelName].push(message);
      }
      else if (typeof model === 'string') {
        //TODO: Assumes append, instead of specific positioning or replacement.
        scope[modelName] += message;
      }

      if (!scope.$$phase) {
        scope.$apply();  
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

    Synchronizer.prototype.updatedFromProtocol = function (scope, modelName, message) {
      scope[modelName] = message;
      scope.$apply();
    };

    Synchronizer.prototype.onProtocolChange = function (ev, message, model) {
      var found, self = this;
      this.lastUpdate = angular.copy(message);
      
      switch(ev) {
        case syncEvents.GET:
          this.updatedFromProtocol(this.config.scope, model, message);
          break;

        case syncEvents.ADD:
          if (angular.equals(message, this.lastDelta)) return;
          this.addedFromProtocol(this.config.scope, model, message);
          break;

        case syncEvents.REMOVE:
          this.removedFromProtocol(this.config.scope[model], message);
          break;

        default:
          this.updatedFromProtocol(this.config.scope, model, message);
      }
    };

    Synchronizer.prototype.bind = function (scope, modelName, query, transform) {
      var self = this
        , binder = $binder(scope, modelName, query, transform);

      //Listen for changes
      this.config.protocol.subscribe(binder, query, function () {
        var args = Array.prototype.slice.call(arguments, 0);;

        args.push(modelName);
        self.onProtocolChange.apply(self, args);
      });
      
      //Push changes
      this.onModelChange.bind(this);
      this.onProtocolChange.bind(this);
      
      this.config.scope.$watch(modelName, function (newVal, oldVal) {
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

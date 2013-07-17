'use strict';

angular.module('SyncResource', [])
  .factory('$syncResource', function ($rootScope, $q, $binder, $differ, $modelWriter, syncEvents) {
    function Synchronizer (config) {
      this.config = config;
    }

    Synchronizer.prototype.unHash = function (array) {
      if (Array.isArray(array)) {
        angular.forEach(array, function (item, i) {
          if (item.$$hashKey) {
            delete array[i].$$hashKey;
          }
        });
      }
      else if (typeof array == 'object') {
        delete array.$$hashKey;
      }
      
      return array;
    };

    /*
      After a delta has been processed,
      hand it off to the protocol to persist it.
    */
    Synchronizer.prototype.sendToProtocol = function (binder, delta) {
      var promise;
      switch (delta.type) {
        case syncEvents.UPDATE:
          promise = this.config.protocol.update(binder, delta);
          break;

        case syncEvents.REMOVE:
          promise = this.config.protocol.remove(binder, delta);
          break;

        case syncEvents.ADD:
          promise = this.config.protocol.create(binder, delta);
          break;
        default:
          promise = this.config.protocol.change(binder, delta);
      }
    };

    /*
      Respond to local changes to the model
      1. Create a delta object to go through the change pipeline
      2. Remove extraneous data from the model
      3. Call onModelChange on the binder if available
      4. Send the change to the protocol to finish the cycle
    */
    Synchronizer.prototype.onModelChange = function (newVal, oldVal, binder) {
      if (binder.updating) return binder.updating = !binder.updating;
      var delta = {
          newVal: this.unHash(newVal),
          oldVal: this.unHash(oldVal),
          data: this.unHash(angular.copy(newVal))
        }
        , self = this;

      binder.onModelChange(binder, delta).then(function (delta) {
        self.sendToProtocol(binder, delta);
      });
    };

    Synchronizer.prototype.sendToModel = function (binder, delta) {
      switch(delta.type) {
        case syncEvents.GET:
          $modelWriter.updatedFromProtocol(binder, delta);
          break;

        case syncEvents.ADD:
          $modelWriter.addedFromProtocol(binder, delta);
          break;

        case syncEvents.REMOVE:
          $modelWriter.removedFromProtocol(binder, delta);
          break;

        case syncEvents.UPDATE:
          $modelWriter.updatedFromProtocol(binder, delta);
          break;
        default:
          $modelWriter.updatedFromProtocol(binder, delta);
      }
    };

    Synchronizer.prototype.onProtocolChange = function (binder, delta) {
      var self = this;

      binder.onProtocolChange(binder, delta).then(function (delta) {
        binder.updating = true;
        self.sendToModel(binder, delta);
      });      
    };

    Synchronizer.prototype.bind = function (options) {
      var self = this
        , binder = $binder(options);

      //Listen for changes
      this.config.protocol.subscribe(binder, function (delta) {
        self.onProtocolChange.call(self, binder, delta);
      });
      
      binder.scope.$watch(binder.model, function (newVal, oldVal) {
        self.onModelChange.call(self, newVal, oldVal, binder);
      }, true);

      return binder;
    };

    return function (config) {
      var syncer = Object.create(Synchronizer.prototype);
      Synchronizer.call(syncer, config);
      return syncer;
    };
  });

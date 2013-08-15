angular.module('SyncResource')
  .factory('$binder', function ($timeout, $q, unHash, syncEvents, $modelWriter) {
    function Binder(options) {
      var self = this;

      if (!options.scope) throw new Error('scope is required');
      if (!options.model) throw new Error('model is required');
      if (options.onProtocolChange && typeof options.onProtocolChange !== 'function' && !Array.isArray(options.onProtocolChange)) throw new Error('onProtocolChange must be a function or array');
      if (options.onModelChange && typeof options.onModelChange !== 'function') throw new Error('onModelChange must be a function');

      if(options.key && typeof options.key !== 'string') throw new Error('key must be a string');

      this.scope = options.scope;
      this.model = options.model;
      this.query = options.query;
      this.type = options.type;
      // this.onModelChange = options.onModelChange || this.onModelChange;;
      this.onProtocolChange = options.onProtocolChange || this.onProtocolChange;
      this.key = options.key || null;
      this.protocol = options.protocol;
    }

    Binder.prototype.sendToModel = function (delta) {
      switch(delta.type) {
        case syncEvents.GET:
          $modelWriter.updatedFromProtocol(this, delta);
          break;

        case syncEvents.ADD:
          $modelWriter.addedFromProtocol(this, delta);
          break;

        case syncEvents.REMOVE:
          $modelWriter.removedFromProtocol(this, delta);
          break;

        case syncEvents.UPDATE:
          $modelWriter.updatedFromProtocol(this, delta);
          break;
        default:
          $modelWriter.updatedFromProtocol(this, delta);
      }
    };

    /*
      After a delta has been processed,
      hand it off to the protocol to persist it.
    */
    Binder.prototype.sendToProtocol = function (delta) {
      var promise;
      switch (delta.type) {
        case syncEvents.UPDATE:
          promise = this.protocol.update(this, delta);
          break;

        case syncEvents.REMOVE:
          promise = this.protocol.remove(this, delta);
          break;

        case syncEvents.ADD:
          promise = this.protocol.create(this, delta);
          break;
        default:
          promise = this.protocol.change(this, delta);
      }
    };

    Binder.prototype.change = function (delta) {
      this.sendToProtocol(delta);
    }

    // Binder.prototype.onChange = function (binder, delta) {
    //   var deferred = $q.defer();
    //   $timeout(function () {
    //     deferred.resolve(delta);
    //   }, 0);
    //   return deferred.promise;
    // }

    /*
      Respond to local changes to the model
      1. Create a delta object to go through the change pipeline
      2. Remove extraneous data from the model
      3. Call onModelChange on the binder if available
      4. Send the change to the protocol to finish the cycle
    */
    Binder.prototype.onModelChange = function (newVal, oldVal) {
      var delta = {
          newVal: unHash(newVal),
          oldVal: unHash(oldVal),
          data: unHash(angular.copy(newVal))
        };

      this.sendToProtocol(delta);
    };

    Binder.prototype.onProtocolChange = function (delta) {
      this.sendToModel(delta);
    };

    Binder.prototype.val = function () {
      return this.scope[this.model];
    };

    return function (config) {
      return new Binder(config);
    };
  });
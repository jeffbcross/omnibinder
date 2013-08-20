angular.module('Binder', [])
  .factory('binder', ['$timeout', '$q', 'unHash', 'syncEvents', 'binderTypes', 'modelWriter',
    function ($timeout, $q, unHash, syncEvents, binderTypes, modelWriter) {
      function Binder(options) {
        if (!options.protocol) throw new Error('protocol is required');
        if (!options.scope) throw new Error('scope is required');
        if (!options.model) throw new Error('model is required');
        if(options.key && typeof options.key !== 'string') throw new Error('key must be a string');

        this.protocol = options.protocol;

        this.scope = options.scope;
        this.model = options.model;
        this.query = options.query;
        this.type = options.type;
        this.key = options.key || null;
      }

      Binder.prototype.addToUnsyncedChanges = function (delta) {
        this.unsyncedChanges = this.unsyncedChanges || [];
        this.unsyncedChanges.push(delta);
      };

      Binder.prototype.push = function (newVal) {
        if (!this.type || this.type !== binderTypes.COLLECTION) {
          throw new Error('Cannot call push on non-collection binder. Binder must be instantiated with type: binderTypes.COLLECTION');
        }

        var delta = {data: newVal, type: syncEvents.NEW};
        delta.position = modelWriter.push(this, delta);
        this.addToUnsyncedChanges(delta);
        this.sendToProtocol(delta);
      };

      Binder.prototype.pop = function () {
        if (!this.type || this.type !== binderTypes.COLLECTION) throw new Error('Cannot call pop on a non-collection binder.');

        this.sendToProtocol({type: syncEvents.DELETED, data: null})
      }

      Binder.prototype.sendToModel = function (delta) {
        switch(delta.type) {
          case syncEvents.NEW:
            modelWriter.createdFromProtocol(this, delta);
            break;

          case syncEvents.READ:
            modelWriter.updatedFromProtocol(this, delta);
            break;

          case syncEvents.UPDATED:
            modelWriter.updatedFromProtocol(this, delta);
            break;

          case syncEvents.DELETED:
            modelWriter.removedFromProtocol(this, delta);
            break;

          default:
            modelWriter.updatedFromProtocol(this, delta);
        }
      };

      /*
        After a delta has been processed,
        hand it off to the protocol to persist it.
      */
      Binder.prototype.sendToProtocol = function (delta) {
        switch (delta.type) {
          case syncEvents.NEW:
            this.protocol[this.protocol.create ? 'create' : 'change'](this, delta);
            break;

          case syncEvents.UPDATED:
            this.protocol[this.protocol.update ? 'update' : 'change'](this, delta);
            break;

          case syncEvents.DELETED:
            this.protocol[this.protocol.remove ? 'remove' : 'change'](this, delta);
            break;

          default:
            this.protocol.change(this, delta);
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

      return function (options) {
        var binder = Object.create(Binder.prototype);
        Binder.call(binder, options);
        return binder;
      };
    }]);
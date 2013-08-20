angular.module('Binder', [])
  .factory('binder', ['$timeout', '$q', 'unHash', 'syncEvents', 'binderTypes', 'modelWriter', 'deltaFactory',
    function ($timeout, $q, unHash, syncEvents, binderTypes, modelWriter, deltaFactory) {
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
        delta.changes.forEach(function (change) {
          this.unsyncedChanges.push(change);
        }, this);
      };

      Binder.prototype.push = function (newVal) {
        var delta, change;

        if (!this.type || this.type !== binderTypes.COLLECTION) {
          throw new Error('Cannot call push on non-collection binder. Binder must be instantiated with type: binderTypes.COLLECTION');
        }

        change = {
          object: [newVal],
          type: syncEvents.NEW,
          name: String(modelWriter.length(this))
        };
        delta = deltaFactory(change);

        modelWriter.push(this, delta);

        // The delta.object should reflect the full model, not the naive representation
        // of the change with which the delta was originally created.
        change.object = modelWriter.val(this);

        this.addToUnsyncedChanges(delta);
        this.protocol.processChanges(this, delta);
      };

      Binder.prototype.pop = function () {
        var change, delta;

        if (!this.type || this.type !== binderTypes.COLLECTION) throw new Error('Cannot call pop on a non-collection binder.');

        //TODO: Make this actually update the model
        change = {
          type: syncEvents.DELETED,
          object: modelWriter.val(this)
        };
        delta = deltaFactory(change);

        this.protocol.processChanges(this, delta);
      };

      Binder.prototype.change = function (delta) {
        this.protocol.processChanges(delta);
      }

      /*
        Respond to local changes to the model
        1. Create a delta object to go through the change pipeline
        2. Remove extraneous data from the model
        3. Call onModelChange on the binder if available
        4. Send the change to the protocol to finish the cycle
      */
      Binder.prototype.onModelChange = function (newVal, oldVal) {
        var delta = deltaFactory({
              type: syncEvents.UNKNOWN,
              object: angular.copy(newVal),
              oldValue: angular.copy(oldVal)
            });

        this.protocol.processChanges(delta);
      };

      Binder.prototype.onProtocolChange = function (delta) {
        modelWriter.processChanges(this, delta);
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
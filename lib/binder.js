angular.module('OmniBinder', [])
  .factory('obBinder', ['$timeout', '$q', 'obSyncEvents', 'obBinderTypes', 'modelWriter', 'obDelta', 'rtObserver',
    function ($timeout, $q, obSyncEvents, obBinderTypes, modelWriter, obDelta, rtObserver) {
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


        this.bindModel(this.type, this.scope, this.model);
        this.protocol.subscribe(this);
      }

      Binder.prototype.addToUnsyncedChanges = function (delta) {
        this.unsyncedChanges = this.unsyncedChanges || [];
        delta.changes.forEach(function (change) {
          this.unsyncedChanges.push(change);
        }, this);
      };


      Binder.prototype.bindModel = function (type, scope, model) {
        switch(type) {
          case obBinderTypes.COLLECTION:
            rtObserver.observeCollection(type, scope, model, this.onModelChange.bind(this));
            break;
        }
      };

      Binder.prototype.push = function (newVal) {
        var delta, change;

        if (!this.type || this.type !== obBinderTypes.COLLECTION) {
          throw new Error('Cannot call push on non-collection binder. Binder must be instantiated with type: obBinderTypes.COLLECTION');
        }

        change = {
          object: [newVal],
          type: obSyncEvents.NEW,
          name: String(modelWriter.length(this))
        };
        delta = obDelta(change);

        modelWriter.push(this, delta);

        // The delta.object should reflect the full model, not the naive representation
        // of the change with which the delta was originally created.
        delta.updateObject(modelWriter.val(this));

        this.addToUnsyncedChanges(delta);
        this.protocol.processChanges(this, delta);
      };

      Binder.prototype.pop = function () {
        var change, delta;

        if (!this.type || this.type !== obBinderTypes.COLLECTION) throw new Error('Cannot call pop on a non-collection binder.');

        change = {
          type: obSyncEvents.DELETED,
          object: modelWriter.val(this),
          name: String(modelWriter.length(this) - 1)
        };
        delta = obDelta(change);

        modelWriter.processChanges(this, delta);

        // Update the delta with the true model representation.
        delta.updateObject(modelWriter.val(this));

        this.protocol.processChanges(this, delta);
      };

      /*
        This deviates from Object.observe's treatment of splice,
        which always treats the array as if items were deleted
        from the end, and otherwise says items were updated, when
        in fact the original items were deleted and their space
        taken over by items after them.

        Instead, this method will set the type to DELETED, but will
        still process each element's deletion as a separate change.
      */
      Binder.prototype.splice = function (index, howMany, items) {
        var delta = obDelta();
        index = parseInt(index, 10);
        howMany = parseInt(howMany, 10);

        for (var i = index; i < index + howMany; i++) {
          delta.addChange({
            type: obSyncEvents.DELETED,
            object: modelWriter.val(this),
            name: String(i)
          });
        }

        modelWriter.processChanges(this, delta);
        delta.updateObject(modelWriter.val(this));

        this.protocol.processChanges(this, delta);

      };

      /*
        Assumes caller has already constructed a valid delta.
      */
      Binder.prototype.change = function (delta) {
        this.protocol.processChanges(delta);
      };

      /*
        Respond to local changes to the model
        1. Create a delta object to go through the change pipeline
        2. Remove extraneous data from the model
        3. Call onModelChange on the binder if available
        4. Send the change to the protocol to finish the cycle
      */
      Binder.prototype.onModelChange = function (newVal, oldVal) {
        var delta = {
              changes: newVal
            };

        this.protocol.processChanges(this, delta);
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
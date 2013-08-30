angular.module('OmniBinder', [])
  .factory('obBinder', ['$timeout', '$q', '$parse', '$window', 'obSyncEvents', 'obBinderTypes', 'obModelWriter', 'obDelta', 'obObserver',
    function ($timeout, $q, $parse, $window, obSyncEvents, obBinderTypes, obModelWriter, obDelta, obObserver) {
      function Binder(options) {
        if (!options.protocol) throw new Error('protocol is required');
        if (!options.scope) throw new Error('scope is required');
        if (!options.model) throw new Error('model is required');
        if (options.key && typeof options.key !== 'string') throw new Error('key must be a string');

        this.protocol = options.protocol;

        this.scope = options.scope;
        this.model = options.model;
        this.query = options.query;
        this.type = options.type;
        this.key = options.key || null;

        this.unsyncedChanges = {
          model: [],
          protocol: []
        };

        this.bindModel(this.type, this.scope, this.model);
        this.protocol.subscribe(this);
      }

      Binder.prototype.addToUnsyncedChanges = function (dest, changes) {
        angular.forEach(changes, function (change) {
          this.unsyncedChanges[dest].push(change);
        }, this);
      };

      /*
        TODO: This method should only check for existence of change.
        Right now this method does two things, check for existence of change, then remove change.
      */
      Binder.prototype.checkUnsyncedChanges = function (source, changes) {
        var isQueued = false,
            self = this;

        angular.forEach(this.unsyncedChanges[source], function (change, i) {
          delete change.added; //HACK since we're breaking spec and addedin added[] to changes.
          angular.forEach(changes, function (newChange, j) {
            delete newChange.added; //HACK since we're breaking spec and addedin added[] to changes.
            if (angular.equals(change, newChange)) {
              self.unsyncedChanges[source].splice(i, 1);
              changes.splice(j, 1);
            }
          })
        })

        return changes;
      }

      Binder.prototype.bindModel = function (type, scope, model) {
        switch(type) {
          case obBinderTypes.COLLECTION:
            this.observer = obObserver.observeCollection(type, scope, model, this.onModelChange.bind(this));
            break;
        }
      };

      /*
        Respond to local changes to the model
        1. Create a delta object to go through the change pipeline
        2. Send the change to the protocol to finish the cycle
      */
      Binder.prototype.onModelChange = function (changes) {
        console.log('onModelChange', changes, this.unsyncedChanges);
        var delta = {
              changes: this.checkUnsyncedChanges('model', changes)
            };

        if (!delta.changes.length) return;



        this.addToUnsyncedChanges('protocol', delta.changes);
        this.protocol.processChanges(this, delta);
      };

      Binder.prototype.onProtocolChange = function (changes) {
        console.log('onProtocolChange', changes, this.unsyncedChanges);
        delta = {
          changes: this.checkUnsyncedChanges('protocol', changes)
        };

        if (!changes.length) return;

        this.addToUnsyncedChanges('model', changes);
        obModelWriter.processChanges(this, delta);
      };

      Binder.prototype.val = function () {
        var getter = $parse(this.model);
        return getter(this.scope);
      };

      return function (options) {
        var binder = Object.create(Binder.prototype);
        Binder.call(binder, options);
        return binder;
      };
    }]);
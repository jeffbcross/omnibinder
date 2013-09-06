angular.module('OmniBinder', [])
  .service('obUnsyncedChanges', function () {
    this.add = function (binder, dest, changes) {
      binder.unsyncedChanges = binder.unsyncedChanges || {model: [], protocol: []};
      angular.forEach(changes, function (change) {
        binder.unsyncedChanges[dest].push(change);
      });
    };

    /*
      TODO: This method should only check for existence of change.
      Right now this method does two things, check for existence of change, then remove change.
    */
    this.check = function (binder, source, changes) {
      var isQueued = false,
          self = this;

      angular.forEach(binder.unsyncedChanges[source], function (change, i) {
        delete change.added; //HACK since we're breaking spec and added in added[] to changes.
        angular.forEach(changes, function (newChange, j) {
          delete newChange.added; //HACK since we're breaking spec and added in added[] to changes.
          if (angular.equals(change, newChange)) {
            binder.unsyncedChanges[source].splice(i, 1);
            changes.splice(j, 1);
          }
        });
      });

      return changes;
    }
  })
  .factory('obBinder', ['$timeout', '$q', '$parse', '$window', 'obSyncEvents', 'obBinderTypes', 'obModelWriter', 'obObserver', 'obUnsyncedChanges',
    function ($timeout, $q, $parse, $window, obSyncEvents, obBinderTypes, obModelWriter, obObserver, obUnsyncedChanges) {
      function Binder(scope, model, protocol, options) {
        options = options || {};
        if (!protocol) throw new Error('protocol is required');
        if (!scope) throw new Error('scope is required');
        if (!model) throw new Error('model is required');
        if (options.key && typeof options.key !== 'string') throw new Error('key must be a string');

        this.protocol = protocol;

        this.scope = scope;
        this.model = model;
        this.query = options.query;
        this.type = options.type;
        this.key = options.key;

        this.bindModel(this.type, scope, model);
        this.protocol.subscribe(this);
      }


      Binder.prototype.bindModel = function (type, scope, model) {
        switch(type) {
          case obBinderTypes.COLLECTION:
            this.observer = obObserver.observeCollection(this, scope[model], this.onModelChange);
            break;
        }
      };

      /*
        Respond to local changes to the model
        1. Create a delta object to go through the change pipeline
        2. Send the change to the protocol to finish the cycle
      */
      Binder.prototype.onModelChange = function (changes) {
        var delta = {
          changes: changes
        };

        if (!delta.changes.length) return;

        obUnsyncedChanges.add(this, 'protocol', delta.changes);
        this.protocol.processChanges(this, delta);
      };

      Binder.prototype.onProtocolChange = function (changes) {
        delta = {
          changes: obUnsyncedChanges.check(this, 'protocol', changes)
        };

        if (!changes.length) return;

        obUnsyncedChanges.add(this, 'model', changes);
        obModelWriter.processChanges(this, delta);
        this.watchObjects(delta.changes);
      };

      Binder.prototype.val = function () {
        var getter = $parse(this.model);
        return getter(this.scope);
      };

      return function () {
        var binder = Object.create(Binder.prototype);
        Binder.apply(binder, arguments);
        return binder;
      };
    }]);

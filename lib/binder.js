angular.module('OmniBinder', [])
  /**
    @ngdoc service
    @name obUnsyncedChanges

  **/
  .service('obUnsyncedChanges', function () {
    /**
     * @function add
     * @param {obBinder} binder A binder with which unsynced changes should be associated.
     * @param {string} dest The destination for the change to be applied.
     * @description Adds list of changes to list of yet-to-be synced changes for
     *              a given destination.
    **/
    this.add = function (binder, dest, changes) {
      binder.unsyncedChanges = binder.unsyncedChanges || {model: [], protocol: []};

      angular.forEach(changes, addChange);

      /**
       * @function addChange
       * @private
       * @param {object} change Change to be added.
       * @description Adds a change object to the list of unsynced
       *              changes for the provided destination.
      **/
      function addChange (change) {
        binder.unsyncedChanges[dest].push(change);
      }
    };

    /*
      TODO: This method should only check for existence of change.
      Right now this method does two things, check for existence of change, then remove change.
    */
    this.check = function (binder, source, changes) {
      var isQueued = false;

      binder.unsyncedChanges = binder.unsyncedChanges || {model: [], protocol: []};

      angular.forEach(binder.unsyncedChanges[source], checkUnsyncedChange);

      return changes;

      /**
       * @function checkUnsyncedChange
       * @private
       * @param {object} change An unsynced change to compare against new changes.
       * @param {number} i Index of the unsynced change in its unsynced changes list.
       *
       * @description Check a change from the unsyncedChanges list to see if it is
       *              equal to any change in the new changes array.
      **/
      function checkUnsyncedChange (change, i) {
        angular.forEach(changes, function checkNewChange (newChange, j) {
          if (angular.equals(change, newChange)) {
            binder.unsyncedChanges[source].splice(i, 1);
            changes.splice(j, 1);
          }
        });
      }
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
        console.log('onProtocolChange', changes);
        delta = {
          changes: obUnsyncedChanges.check(this, 'protocol', changes)
        };

        console.log('delta', delta);

        if (!changes.length) return;

        obUnsyncedChanges.add(this, 'model', changes);
        obModelWriter.processChanges(this, delta);
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

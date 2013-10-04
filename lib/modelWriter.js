angular.module('OmniBinder')
  .service('obModelWriter', ['$parse', 'obBinderTypes', 'obSyncEvents', function ($parse, obBinderTypes, obSyncEvents) {
    //Useful to shorten code, but should only be used for non-scalar models.
    this.applyArrayChange = function (binder, change) {
      var model = $parse(binder.model)(binder.scope);
      if (change.added) {
        var firstChange = change.added.shift();

        model.splice(change.index, change.removed? change.removed.length : 0, firstChange);
        while (next = change.added.shift()) {
          change.index++;
          model.splice(change.index, 0, next);
        }
      }
      else {
        model.splice(change.index, change.removed ? change.removed.length : 0);
      }

      binder.ignoreNModelChanges += (change.removed && change.removed.length || 0) + change.addedCount;
      $parse(binder.model).assign(binder.scope, model);
      if (!binder.scope.$$phase) binder.scope.$apply();
    };

    this.applyObjectChange = function (binder, change) {
      if (binder.key) {
        function findObject (keyName, key) {
          var obj;
          var collection = binder.scope[binder.model];

          angular.forEach(collection, function (item, i) {
            if (obj) return;
            if (item[keyName] === key) {
              obj = item;
            }
            else if (typeof item[keyName] === 'undefined') {
              //Object does not yet have a key, let's hope the update is trying to assign the key
              obj = item;
            }
          });

          return obj;
        }

        var obj = findObject(binder.key, change.object[binder.key]);

        if (!obj) throw new Error('Could not find object with key' + change.object[binder.key])


        switch (change.type) {
          case "update":
            if (obj[change.name] !== change.object[change.name]) binder.ignoreNModelChanges++;
            obj[change.name] = change.object[change.name];
            break;
          case "delete":
            binder.ignoreNModelChanges++;
            delete obj[change.name];
            break;
          case "new":
            if (obj[change.name] !== change.object[change.name]) binder.ignoreNModelChanges++;
            obj[change.name] = change.object[change.name];
            break;
        }


        if (!binder.scope.$$phase) binder.scope.$apply();
      }

    };

    this.processChanges = function (binder, delta) {
      angular.forEach(delta.changes, function (change) {
        switch (binder.type) {
          case obBinderTypes.COLLECTION:
            if (typeof change.index === 'number') {
              this.applyArrayChange(binder, change);
            }
            else if (typeof change.name === 'string') {
              this.applyObjectChange(binder, change);
            }

            break;
        }
      }, this);
    };
  }]);

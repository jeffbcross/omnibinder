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

      $parse(binder.model).assign(binder.scope, model);
      if (!binder.scope.$$phase) binder.scope.$apply();
    };

    this.processChanges = function (binder, delta) {
      angular.forEach(delta.changes, function (change) {
        switch (binder.type) {
          case obBinderTypes.COLLECTION:
            this.applyArrayChange(binder, change);
            break;
        }
      }, this);
    };
  }]);

angular.module('OmniBinder')
  .service('obModelWriter', ['$parse', 'obBinderTypes', 'obSyncEvents', function ($parse, obBinderTypes, obSyncEvents) {
    this.blindWrite = function (binder, delta) {
      delta.silent && (binder.updatingFromProtocol = true);
      binder.scope[binder.model] = binder.data = delta.data;
    };

    this.push = function (binder, delta) {
      if (binder.scope[binder.model] && !angular.isArray(binder.scope[binder.model])) {
        throw new Error("Cannot call 'push' on a model that is not array or undefined.")
      }
      else if (binder.scope[binder.model]) {
        binder.scope[binder.model].push(delta.changes[0].object[delta.changes[0].name]);
      }
      else {
        binder.scope[binder.model] = delta.changes[0].object;
      }

      return binder.scope[binder.model].length - 1;
    };

    this.length = function (binder) {
      if (!binder.type || !(binder.type === obBinderTypes.COLLECTION || binder.type === obBinderTypes.STRING)) {
        throw new Error('Binder must be a string or collection to call .length()');
      }
      return Array.isArray(binder.scope[binder.model]) ? binder.scope[binder.model].length : undefined;
    };

    this.pop = function (binder, delta) {
      if (!binder.scope[binder.model]) throw new Error("Cannot call 'pop' on an undefined model.");
      if (!angular.isArray(binder.scope[binder.model])) throw new Error("Cannot call 'pop' on a non-array object.");
      if (!binder.type || binder.type !== obBinderTypes.COLLECTION) throw new Error('Cannot call pop on a non-collection binder type.');

      return binder.scope[binder.model].pop();
    };

    this.createdFromProtocol = function (binder, delta) {
      delta.silent && (binder.updatingFromProtocol = true);
      switch (binder.type) {
        case obBinderTypes.COLLECTION:
          if (!Array.isArray(binder.scope[binder.model])) binder.scope[binder.model] = [];
          binder.scope[binder.model].push(delta.data);
          break;
        case obBinderTypes.OBJECT:
          if (typeof binder.scope[binder.model] === 'object') {
            angular.extend(binder.scope[binder.model], delta.data);
          }
          else {
            this.blindWrite(binder, delta);
          }
          break;
        default:
          this.blindWrite(binder, delta);
      }

      if (!binder.scope.$$phase) {
        binder.scope.$apply();
      }

      binder.data = binder.scope[binder.model];
    };

    //Useful to shorten code, but should only be used for non-scalar models.
    this.getModel = function (binder) {
      return binder.scope[binder.model];
    }

    this.deletedFromProtocol = function (binder, change) {
      switch (binder.type) {
        case obBinderTypes.COLLECTION:

          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder).splice(changeIndex, 1);
          break;
      }
    };

    this.newFromProtocol = function (binder, change) {
      switch (binder.type) {
        case obBinderTypes.COLLECTION:
          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder).splice(changeIndex, 0, change.object[changeIndex]);
          break;
      }
    };

    this.applyArrayChange = function (binder, change) {
      var model = $parse(binder.model)(binder.scope);
      if (change.added) {
        model.splice(change.index, change.removed.length, change.added.shift());
        while (next = change.added.shift()) {
          change.index++;
          model.splice(change.index, 0, next);
        }
      }
      else {
        model.splice(change.index, change.removed.length);
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

    this.removedFromProtocol = function (binder, delta) {
      var found
        , model = binder.scope[binder.model];

      delta.silent && (binder.updatingFromProtocol = true);

      if (Array.isArray(model)) {
        angular.forEach(model, function (item, i) {
          if (found) return;

          if (angular.equals(item, delta.data)) {
            model.splice(i, 1);
            found = true;
          };
        });
      }

      binder.data = binder.scope[binder.model];
    };

    this.updatedFromProtocol = function (binder, change) {
      if ((binder.type === obBinderTypes.COLLECTION || binder.type === obBinderTypes.OBJECT) && !change.name) {
        throw new Error("Change object must contain a name");
      }
      // Commenting out to revisit silent updating of models later.
      // delta.silent && (binder.updatingFromProtocol = true);
      switch(binder.type) {
        case obBinderTypes.COLLECTION:
          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder)[changeIndex] = change.object[changeIndex];
          break;
        case obBinderTypes.OBJECT:
          this.getModel(binder)[change.name] = change.object[change.name];
          break;
      }
    };

    this.val = function (binder) {
      return angular.copy(binder.scope[binder.model]);
    };
  }]);

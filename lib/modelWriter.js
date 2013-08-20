angular.module('Binder')
  .factory('modelWriter', ['binderTypes', 'syncEvents', function (binderTypes, syncEvents) {
    function ModelWriter () {};

    ModelWriter.prototype.blindWrite = function (binder, delta) {
      delta.silent && (binder.updatingFromProtocol = true);
      binder.scope[binder.model] = binder.data = delta.data;
    };

    ModelWriter.prototype.push = function (binder, delta) {
      if (binder.scope[binder.model] && !angular.isArray(binder.scope[binder.model])) {
        throw new Error("Cannot call 'push' on a model that is not array or undefined.")
      }
      else if (binder.scope[binder.model]) {
        binder.scope[binder.model].push(delta.data);
      }
      else {
        binder.scope[binder.model] = [delta.data];
      }

      return binder.scope[binder.model].length - 1;
    };

    ModelWriter.prototype.pop = function (binder, delta) {
      if (!binder.scope[binder.model]) throw new Error("Cannot call 'pop' on an undefined model.");
      if (!angular.isArray(binder.scope[binder.model])) throw new Error("Cannot call 'pop' on a non-array object.");
      if (!binder.type || binder.type !== binderTypes.COLLECTION) throw new Error('Cannot call pop on a non-collection binder type.');

      return binder.scope[binder.model].pop();
    };

    ModelWriter.prototype.createdFromProtocol = function (binder, delta) {
      delta.silent && (binder.updatingFromProtocol = true);
      switch (binder.type) {
        case binderTypes.COLLECTION:
          if (!Array.isArray(binder.scope[binder.model])) binder.scope[binder.model] = [];
          binder.scope[binder.model].push(delta.data);
          break;
        case binderTypes.OBJECT:
          if (typeof binder.scope[binder.model] === 'object') {
            angular.extend(binder.scope[binder.model], delta.data);
          }
          else {
            ModelWriter.prototype.blindWrite(binder, delta);
          }
          break;
        default:
          ModelWriter.prototype.blindWrite(binder, delta);
      }

      if (!binder.scope.$$phase) {
        binder.scope.$apply();
      }

      binder.data = binder.scope[binder.model];
    };

    //Useful to shorten code, but should only be used for non-scalar models.
    ModelWriter.prototype.getModel = function (binder) {
      return binder.scope[binder.model];
    }

    ModelWriter.prototype.deletedFromProtocol = function (binder, change) {
      switch (binder.type) {
        case binderTypes.COLLECTION:
          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder).splice(changeIndex, 1);
          break;
      }
    };

    ModelWriter.prototype.newFromProtocol = function (binder, change) {
      switch (binder.type) {
        case binderTypes.COLLECTION:
          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder).splice(changeIndex, 0, change.object[changeIndex]);
          break;
      }
    };

    ModelWriter.prototype.processChanges = function (binder, changes) {
      angular.forEach(changes, function (change) {
        switch (change.type) {
          case syncEvents.NEW:
            this.newFromProtocol(binder, change);
            break;
          case syncEvents.DELETED:
            this.deletedFromProtocol(binder, change);
            break;
          case syncEvents.UPDATED:
            this.updatedFromProtocol(binder, change);
            break;
        }
      }, this);
    };

    ModelWriter.prototype.removedFromProtocol = function (binder, delta) {
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

    ModelWriter.prototype.updatedFromProtocol = function (binder, change) {
      if ((binder.type === binderTypes.COLLECTION || binder.type === binderTypes.OBJECT) && !change.name) {
        throw new Error("Change object must contain a name");
      }
      // Commenting out to revisit silent updating of models later.
      // delta.silent && (binder.updatingFromProtocol = true);
      switch(binder.type) {
        case binderTypes.COLLECTION:
          var changeIndex = parseInt(change.name, 10);
          this.getModel(binder)[changeIndex] = change.object[changeIndex];
          break;
        case binderTypes.OBJECT:
          this.getModel(binder)[change.name] = change.object[change.name];
          break;
      }
    };

    var modelWriter = Object.create(ModelWriter.prototype);
    ModelWriter.call(modelWriter);
    return modelWriter;
  }]);

angular.module('Binder')
  .factory('modelWriter', ['binderTypes', function (binderTypes) {
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

    ModelWriter.prototype.addedFromProtocol = function (binder, delta) {
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

    ModelWriter.prototype.updatedFromProtocol = function (binder, delta) {
      delta.silent && (binder.updatingFromProtocol = true);
      switch(binder.type) {
        case binderTypes.COLLECTION:
          if(typeof delta.position === 'number') {
            angular.extend(binder.scope[binder.model][delta.position], delta.data);
          }
          else {
            this.blindWrite(binder, delta);
          }
          break;
        default:
          if (typeof binder.scope[binder.model] === 'object' && !Array.isArray(binder.scope[binder.model]) && typeof delta.data === 'object') {
            angular.extend(binder.scope[binder.model], delta.data);
          }
          else {
            this.blindWrite(binder, delta);
          }
      }

      if (!binder.scope.$$phase) {
        binder.scope.$apply();
      }

      binder.data = angular.copy(binder.scope[binder.model]);
    };

    var modelWriter = Object.create(ModelWriter.prototype);
    ModelWriter.call(modelWriter);
    return modelWriter;
  }]);

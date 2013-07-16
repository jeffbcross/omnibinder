angular.module('SyncResource')
  .factory('$modelWriter', function ($binderTypes) {
    function ModelWriter () {};

    ModelWriter.prototype.blindWrite = function (binder, delta) {
      binder.scope[binder.model] = binder.data = delta.data;
    };

    ModelWriter.prototype.addedFromProtocol = function (binder, delta) {
      switch (binder.type) {
        case $binderTypes.COLLECTION:
          if (!Array.isArray(binder.scope[binder.model])) binder.scope[binder.model] = [];
          binder.scope[binder.model].push(delta.data);
          break;
        case $binderTypes.OBJECT:
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
      binder.scope[binder.model] = delta.data;
      if (!binder.scope.$$phase) {
        binder.scope.$apply();  
      }

      binder.data = binder.scope[binder.model];
    };
    
    var modelWriter = Object.create(ModelWriter.prototype);
    ModelWriter.call(modelWriter);
    return modelWriter;
  });

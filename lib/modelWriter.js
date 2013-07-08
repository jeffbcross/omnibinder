angular.module('SyncResource')
  .factory('$modelWriter', function ($binderTypes) {
    function ModelWriter () {};

    ModelWriter.prototype.addedFromProtocol = function (binder, delta) {
      if (binder.type === $binderTypes.COLLECTION) {
        if (!Array.isArray(binder.scope[binder.model])) binder.scope[binder.model] = [];
        binder.scope[binder.model].push(delta.data);
      }
      // else if (Array.isArray(binder.scope[binder.model])) {
      //   binder.scope[binder.model].push(delta.data);
      // }
      // else if (typeof binder.scope[binder.model] === 'string') {
      //   binder.scope[binder.model] += delta.data;
      // }
      else if (binder.type === $binderTypes.OBJECT && typeof binder.scope[binder.model] === 'object') {
        angular.extend(binder.scope[binder.model], delta.data);
      }
      else {
        binder.scope[binder.model] = delta.data;
      }

      if (!binder.scope.$$phase) {
        binder.scope.$apply();  
      }
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
    };

    ModelWriter.prototype.updatedFromProtocol = function (binder, delta) {
      binder.scope[binder.model] = delta.data;
      binder.scope.$apply();
    };

    
    var modelWriter = Object.create(ModelWriter.prototype);
    ModelWriter.call(modelWriter);
    return modelWriter;
    
  });
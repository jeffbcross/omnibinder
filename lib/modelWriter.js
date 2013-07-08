angular.module('SyncResource')
  .factory('$modelWriter', function () {
    function ModelWriter () {};

    ModelWriter.prototype.addedFromProtocol = function (binder, delta) {
      if (binder.type === 'collection') {
        if (!Array.isArray(binder.scope[binder.model])) binder.scope[binder.model] = [];
        binder.scope[binder.model].push(delta.data);
      }
      // else if (Array.isArray(binder.scope[binder.model])) {
      //   console.log('Array.isArray(binder.scope[binder.model])');
      //   binder.scope[binder.model].push(delta.data);
      // }
      // else if (typeof binder.scope[binder.model] === 'string') {
      //   console.log('typeof binder.scope[binder.model] === string')
      //   //TODO: Assumes append, instead of specific positioning or replacement.
      //   binder.scope[binder.model] += delta.data;
      // }
      // else if (typeof binder.scope[binder.model] === 'object') {
      //   angular.extend(binder.scope[binder.model])
      // }

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
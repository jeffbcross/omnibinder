angular.module('SyncResource')
  .factory('$checkArrayForDupe', function () {
    return function (binder, delta, next) {
      var found;

      if (Array.isArray(binder.data)) {
        angular.forEach(binder.data, function (item) {
          if (found) return;
          if (angular.equals(item, delta.data)) {
            delta.duplicate = true;
            found = true;
          }
        });
      }
      
      next();
    }
  });
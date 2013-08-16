angular.module('Binder')
  .factory('unHash', [function () {
    return function (array) {
      if (Array.isArray(array)) {
        angular.forEach(array, function (item, i) {
          if (item.$$hashKey) {
            delete array[i].$$hashKey;
          }
        });
      }
      else if (typeof array == 'object') {
        delete array.$$hashKey;
      }

      return array;
    }
  }]);

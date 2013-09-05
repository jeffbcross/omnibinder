angular.module('OmniBinder')
  //Returns an Array.observe style change based on provided information
  .factory('obArrayChange', function () {
    return function (addedCount, removed, index) {
      return {
        addedCount: addedCount,
        removed: removed,
        index: index
      };
    };
  })
  //Returns a copy of the complete old object based on an Object.observe-style change.
  .factory('obOldObject', function () {
    return function (change) {
      var oldObject = angular.copy(change.object);
      oldObject[change.name] = change.oldValue;
      return oldObject;
    };
  })
  .service('obObserver', ['obArrayChange', 'obOldObject', function (obArrayChange, obOldObject) {
    this.observeObjectInCollection = function (collection, object, callback) {
      function onObjectObserved (changes) {
        var trueChanges = [];

        angular.forEach(changes, function (change) {
          var oldObject = obOldObject(change);
          var change = obArrayChange(1, [oldObject], collection.indexOf(change.object));
          trueChanges.push(change);
        });

        callback(trueChanges);
      }

      this.observers[object] = onObjectObserved;
      Object.observe(object, onObjectObserved);
    };

    this.observers = {};

    this.observeCollection = function (collection, callback) {
      var self = this,
          observer;

      angular.forEach(collection, function (obj) {
        self.observeObjectInCollection(collection, obj, callback);
      });

      observer = new ArrayObserver(collection, function (changes) {
        angular.forEach(changes, function (change) {
          var i = change.index;
          var lastIndex = change.addedCount + change.index;

          while (i < lastIndex) {
            self.observeObjectInCollection(collection, collection[i], callback);
            i++;
          }

          if (change.removed.length) {
            //Unobserve each item
            angular.forEach(change.removed, function (obj) {
              Object.unobserve(obj, self.observers[obj]);
            });
          }
        });

        callback(changes);
      });
      return observer;
    };
  }]);

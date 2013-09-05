angular.module('OmniBinder')
  .service('obObserver', function () {
    this.observeObjectInCollection = function (collection, object, callback) {
      Object.observe(object, function (changes) {
        var trueChanges = [];
        angular.forEach(changes, function (change) {
          var oldObject = angular.copy(change.object);
          oldObject[change.name] = change.oldValue;
          trueChanges.push({
            addedCount: 1,
            removed: [oldObject],
            index: collection.indexOf(change.object)
          });
        });

        callback(trueChanges);
      });
    };

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
          }
        });

        callback(changes);
      });
      return observer;
    };
  });

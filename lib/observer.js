angular.module('OmniBinder')
  /**
   * @ngdoc factory
   * @name obArrayChange
   * @function
   *
   * @description Creates consistently-formatted change object.
   *
   * @param {number} addedCount How many items were added
   *                 as part of this change.
   * @param {array}  removed Array of items that were removed
   *                 as part of this change.
   * @param {number} index Index at which this change began.
   *
   * @returns {object} change An Array.observe style change.
  */
  .factory('obArrayChange', function () {
    return function (addedCount, removed, index) {
      return {
        addedCount: addedCount,
        removed: removed,
        index: index
      };
    };
  })


  /**
   * @ngdoc factory
   * @name obOldObject
   * @function
   *
   * @description Takes in an Object.observe-style change and
   *              returns a copy of the complete old object based on
   *              properties of the change.
   * @param {object} change An Object-observe style change.
   *
   * @returns {object} A representation of the previous state of
   *                   the changed object.
  */
  .factory('obOldObject', function () {
    return function (change) {
      var oldObject = angular.copy(change.object);
      oldObject[change.name] = change.oldValue;
      return oldObject;
    };
  })

  /**
   * @ngdoc service
   * @name obObserver
   * @function
   *
   * @description Provides methods to observe models and notify
   *              of changes.
  */
  .service('obObserver', ['obArrayChange', 'obOldObject', function (obArrayChange, obOldObject) {
    /*
     * @function observeObjectInCollection
     * @param {object} context Context with which to call the callback.
     * @param {array} collection The collection in which the object is being
     *                           observed. This is useful for determining the
     *                           index of the object after it has changed.
     * @param {object} object The object to observe.
     * @param {function} callback The callback to be called after an object change.
     *
     * @description Observe a single object.
     *              When Object.observe notifies that this object has changed,
     *              the callback will be called with the proper context,
     *              and will prepare an Array.observe-like changeset instead
     *              of the Object.observe style of changes.
     *
     *              The assumption is that when observing a collection, the preferred
     *              format of changes will operations that can be applied to a collection
     *              to easily keep multiple copies of a collection in sync.
     *
     *              A member outside the scope of this service would need to compare the
     *              new item with the removed item to determine if the change was actually
     *              an update to an object, rather than a removal/addition that is typically
     *              represented by an Array.observe change set. For example, the collection
     *              has a unique key constraint, the values of that key could be compared in
     *              the removed and added objects.
    */
    this.observeObjectInCollection = function (context, collection, object, callback) {
      function onObjectObserved (changes) {
        /*
          An empty array to hold splice objects that will be created.
          Splices will look like splices generated natively from Array.observe().
        */
        var splices = [];
        function pushSplice (change) {
          var oldObject = obOldObject(change),
              index = collection.indexOf(change.object),
              change = obArrayChange(1, [oldObject], index);

          splices.push(change);
        }

        /*
          Convert each change registered by Object.observe to
          an Array.observe-like splice.
        */
        if (!context.key) {
          angular.forEach(changes, pushSplice);
          callback.call(context, splices);
        }
        else {
          callback.call(context, changes);
        }
      }

      this.observers[object] = onObjectObserved;

      observer = new ObjectObserver(object, onObjectObserved);
      return observer;
    };

    /*
      Map of references to Object observer functions with objects as keys.
      Used only for unobserving objects as they're removed from a collection.
    */
    this.observers = {};

    /**
     * @function observeCollection
     * @description Observe an array and its child objects, then notify callback on any change.
     * @param {object} context The context with which to call the callback.
     * @param {function} callback The callback to call on an array change.
     * @param {array} collection The collection to be observed.
    **/
    this.observeCollection = function (context, collection, callback) {
      var self = this,
          observer;

      /*
        Iterate through the collection and start
        watching the objects that are already
        a part of it.
      */
      angular.forEach(collection, observeOne);

      /*
        Start watching the collection and register onArrayChange
        callback to process changes.
      */
      observer = new ArrayObserver(collection, onArrayChange);
      return observer;


      /*
        Delegates to observeObjectInCollection method, passing in
        necessary params.
      */
      function observeOne (obj) {
        self.observeObjectInCollection(context, collection, obj, callback);
      }

      /*
        Respond to changes delivered by Array.observe().
        Delegates to watchNewObjects to observe objects within the collection.
      */
      function onArrayChange (changes) {
        angular.forEach(changes, watchNewObjects);

        callback.call(context, changes);
      }

      /*
        Look at a change to see what new objects were added,
        and then watch them.
        This method will also look at the objects that were
        removed, and will unobserve them.
      */
      function watchNewObjects (change) {
        var i = change.index;
        var lastIndex = change.addedCount + change.index;

        while (i < lastIndex) {
          observeOne(collection[i]);
          i++;
        }

        if (change.removed.length) {
          //Unobserve each item
          angular.forEach(change.removed, function unObserve (obj) {
            Object.unobserve(obj, self.observers[obj]);
          });
        }
      }
    };
  }]);

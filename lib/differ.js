angular.module('SyncResource')
  .factory('$differ', function (syncEvents) {
    function Differ () {}

    Differ.prototype.findRemovedItem = function findRemovedItem (binder, delta) {
      var old = {}, i;

      //First get the ids of the items that were there.
      for (i = 0; i < delta.oldVal.length; i++) {
        delete delta.oldVal[i].$$hashKey;
        old[JSON.stringify(delta.oldVal[i])] = i;
      }

      //Then iterate through the items in the new array.
      for (i = 0; i < delta.newVal.length; i++) {
        delete delta.newVal[i].$$hashKey;
        delete old[JSON.stringify(delta.newVal[i])];
      }

      // if (Object.keys(old).length !== 1) throw new Error("Could not find removed item.");
      delta.position = old[Object.keys(old)[0]];
      delta.data = JSON.parse(Object.keys(old)[0]);
      delta.type = syncEvents.REMOVE;
      return delta;
    };

    Differ.prototype.findAddedItem = function (binder, delta) {
      var old = {}, i;

      //Make a dictionary of hash keys that were already there.
      for (i = 0; i < delta.oldVal.length; i++) {
        delete delta.oldVal[i].$$hashKey;
        old[JSON.stringify(delta.oldVal[i])] = true;
      }

      for (i = 0; i < delta.newVal.length; i++) {
        delete delta.newVal[i].$$hashKey;
        if (!old[JSON.stringify(delta.newVal[i])]) {
          delta.data = delta.newVal[i];
          delta.position = i;
          delta.type = syncEvents.ADD;
          return delta;
        }
      }

      return delta;
    };

    Differ.prototype.findUpdatedItem = function (binder, delta) {
      var old = {}, i;

      for(i = 0; i < delta.oldVal.length; i++) {
        delete delta.oldVal[i].$$hashKey;
        old[JSON.stringify(delta.oldVal[i])] = i;
      }
      
      for(i = 0; i < delta.newVal.length; i++) {
        delete delta.newVal[i].$$hashKey;
        if (typeof old[JSON.stringify(delta.newVal[i])] === 'undefined') {
          delta.data = delta.newVal[i];
          delta.position = i;
          delta.type = syncEvents.UPDATE;
          return delta;
        }
      }

      return delta;
    };

    //TODO: This can only find one diff right now, can't find multiple diffs at different positions.
    Differ.prototype.findAddedString = function (binder, delta) {
      var position, i;

      for(i = 0; i < delta.newVal.length; i++) {
        if (delta.newVal[i] !== delta.oldVal[i]) {
          position = i;
          break;
        }
      }

      delta.position = position;
      delta.data = delta.newVal.substr(position, delta.newVal.length - delta.oldVal.length);
      delta.type = syncEvents.ADD;

      return delta;
    };

    Differ.prototype.findRemovedString = function (binder, delta) {
      var start, end, i, lDiff = delta.oldVal.length - delta.newVal.length, data, removed;

      for (i = 0; i < delta.newVal.length; i++) {
        if (typeof start === 'undefined' && delta.oldVal[i] !== delta.newVal[i]) {
          start = i;
          end = i + lDiff;
        }
        else if (typeof start !== 'undefined' && delta.oldVal[i + lDiff] !== delta.newVal[i]) {
          end = i + lDiff + 1;
        }
      } 
      
      if (end - start > delta.oldVal.length - delta.newVal.length) {
        removed = delta.oldVal.substr(start, end - start);
        //This wasn't a simple removal...it was an UPDATE!
        end = start;
        for (var j = start; j < delta.newVal.length; j++) {
          if (delta.newVal[j] !== delta.oldVal[j + lDiff]) {
            end = j;
          }
        }
        
        data = delta.newVal.substr(start, end - start + 1);
      }
      else {
        data = delta.oldVal.substr(start, end - start);
      }

      delta.position = start;
      delta.data = data;
      delta.removed = removed;
      delta.type = syncEvents.REMOVE;
      delta.type = removed && removed.length !== (delta.oldVal.length - delta.newVal.length) ? syncEvents.UPDATE : syncEvents.REMOVE

      return delta;
    };

    Differ.prototype.findChangedString = function (binder, delta) {
      var start, end, i;

      for (i = 0; i < delta.newVal.length; i++) {
        if (typeof start === 'undefined' && delta.newVal[i] !== delta.oldVal[i]) {
          start = i;
          end = i;
        }
        else if (typeof start !== 'undefined' && delta.newVal[i] !== delta.oldVal[i]) {
          end = i + 1;
        }
      }
      
      delta.data = delta.newVal.substr(start, end - start);
      delta.position = start;
      delta.type = angular.equals(delta.newVal, delta.oldVal, true) ? syncEvents.NONE : syncEvents.UPDATE;
      
      return delta;
    };

    Differ.prototype.compareStrings = function (binder, delta) {
      var item, type;
      if (delta.newVal.length > delta.oldVal.length) {
        return Differ.prototype.findAddedString(binder, delta);
      }
      else if (delta.newVal.length < delta.oldVal.length) {
        return Differ.prototype.findRemovedString(binder, delta);
      }
      else {
        return Differ.prototype.findChangedString(binder, delta);
      }
    };

    Differ.prototype.compareArrays = function (binder, delta) {
      if (!delta.newVal && !delta.oldVal) {
        return delta;
      }
      else if (delta.newVal && !delta.oldVal) {
        delta.type = syncEvents.ADD;

        if (Array.isArray(delta.newVal)) {
          delta.data = delta.newVal[0];
        }
        else {
          delta.data = delta.newVal;
        }
        
        delta.position = 0;
        return delta;
      }
      else if (delta.newVal.length > delta.oldVal.length) {
        // Something has been added to the array.
        return Differ.prototype.findAddedItem(binder, delta);
      }
      else if (delta.newVal.length < delta.oldVal.length) {
        // Something has been removed from the array.
        return Differ.prototype.findRemovedItem(binder, delta);
      }
      else {
        // An object changed within the array.
        return Differ.prototype.findUpdatedItem(binder, delta);
      }
    };

    Differ.prototype.checkArrayForDupe = function (binder, delta) {
      var found;

      if (Array.isArray(binder.data)) {
        angular.forEach(binder.data, function (item) {
          if (found) return;
          if (binder.key &&
            angular.isDefined(delta.data) &&
            angular.isDefined(delta.data[binder.key]) &&
            angular.isDefined(item[binder.key]) &&
            item[binder.key] === delta.data[binder.key]) {

            delta.duplicate = true;
            found = true;
          }
          else if (angular.equals(item, delta.data)) {
            delta.duplicate = true;
            found = true;
          }
        });
      }
      
      return delta;
    };

    Differ.prototype.determineDelta = function (binder, delta) {
      var item = {}, type;

      if (!delta.oldVal && delta.newVal) {
        delta.type = syncEvents.CREATE;
        delta.data = delta.newVal;
      }
      else if ((!delta.newVal && !delta.oldVal) || (angular.equals(delta.newVal, delta.oldVal) && angular.equals(delta.newVal, binder.lastUpdate))) {
        delta.type = syncEvents.NONE;
      }
      else if (delta.oldVal && Array.isArray(delta.oldVal) && Array.isArray(delta.newVal)) {
        return Differ.prototype.compareArrays(binder, delta);
      }
      else if (typeof delta.newVal === 'string' && typeof delta.oldVal === 'string') {
        return Differ.prototype.compareStrings(binder, delta);
      }
      else {
        delta.type = syncEvents.UNKNOWN;
      }

      return delta;
    };

    return new Differ();
  })

angular.module('SyncResource')
  .factory('differ', function (syncEvents) {
    function Differ () {}

    Differ.prototype.findRemovedItem = function findRemovedItem (newVal, oldVal) {
      var old = {}, i;

      //First get the ids of the items that were there.
      for (i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = i;
      }

      //Then iterate through the items in the new array.
      for (i = 0; i < newVal.length; i++) {
        delete old[JSON.stringify(newVal[i])];
      }

      if (Object.keys(old).length !== 1) throw new Error("Could not find removed item.");

      return {
        position: old[Object.keys(old)[0]],
        data: JSON.parse(Object.keys(old)[0])
      };
    };

    Differ.prototype.findAddedItem = function (newVal, oldVal) {
      var old = {}, i;

      //Make a dictionary of hash keys that were already there.
      for (i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = true;
      }

      for (i = 0; i < newVal.length; i++) {
        if (!old[JSON.stringify(newVal[i])]) return {
          data: newVal[i],
          position: i
        };
      }
    };

    Differ.prototype.findUpdatedItem = function (newVal, oldVal) {
      var old = {}, i;

      for(i = 0; i < oldVal.length; i++) {
        old[JSON.stringify(oldVal[i])] = i;
      }
      
      for(i = 0; i < newVal.length; i++) {
        if (typeof old[JSON.stringify(newVal[i])] === 'undefined') return {
          data: newVal[i],
          position: i
        }
      }
    };

    //TODO: This can only find one diff right now, can't find multiple diffs at different positions.
    Differ.prototype.findAddedString = function (newVal, oldVal) {
      var position, i;

      for(i = 0; i < newVal.length; i++) {
        if (newVal[i] !== oldVal[i]) {
          position = i;
          break;
        }
      }

      return {
        position: position,
        data: newVal.substr(position, newVal.length - oldVal.length)
      }
    };

    Differ.prototype.findRemovedString = function (newVal, oldVal) {
      var start, end, i, lDiff = oldVal.length - newVal.length, data, removed;

      for (i = 0; i < newVal.length; i++) {
        if (typeof start === 'undefined' && oldVal[i] !== newVal[i]) {
          start = i;
          end = i + lDiff;
        }
        else if (typeof start !== 'undefined' && oldVal[i + lDiff] !== newVal[i]) {
          end = i + lDiff + 1;
        }
      } 
      
      if (end - start > oldVal.length - newVal.length) {
        removed = oldVal.substr(start, end - start);
        //This wasn't a simple removal...it was an UPDATE!
        end = start;
        for (var j = start; j < newVal.length; j++) {
          if (newVal[j] !== oldVal[j + lDiff]) {
            end = j;
          }
        }
        
        data = newVal.substr(start, end - start + 1);
      }
      else {
        data = oldVal.substr(start, end - start);
      }

      return {
        position: start,
        data: data,
        removed: removed
      };
    };

    Differ.prototype.findChangedString = function (newVal, oldVal) {
      var start, end, i;

      for (i = 0; i < newVal.length; i++) {
        if (typeof start === 'undefined' && newVal[i] !== oldVal[i]) {
          start = i;
          end = i;
        }
        else if (typeof start !== 'undefined' && newVal[i] !== oldVal[i]) {
          end = i + 1;
        }
      }
      
      return {
        data: newVal.substr(start, end - start),
        position: start
      };
    };

    Differ.prototype.compareStrings = function (newVal, oldVal) {
      var item, type;
      if (newVal.length > oldVal.length) {
        item = this.findAddedString(newVal, oldVal);
        type = syncEvents.ADD;
      }
      else if (newVal.length < oldVal.length) {
        item = this.findRemovedString(newVal, oldVal);
        type = item.removed && item.removed.length !== (oldVal.length - newVal.length) ? syncEvents.UPDATE : syncEvents.REMOVE;
      }
      else {
        type = syncEvents.UPDATE;
        item = this.findChangedString(newVal, oldVal);
      }

      return {
        type: type,
        data: item.data,
        position: item.position
      };
    };

    Differ.prototype.compareArrays = function (newVal, oldVal) {
      var type, item;
      // Something has changed in an existing array.
      if (newVal.length > oldVal.length) {
        // Something has been added to the array.
        item = this.findAddedItem(newVal, oldVal);
        type = syncEvents.ADD;
      }
      else if (newVal.length < oldVal.length) {
        // Something has been removed from the array.
        item = this.findRemovedItem(newVal, oldVal);
        type = syncEvents.REMOVE;
      }
      else {
        // An object changed within the array.
        item = this.findUpdatedItem(newVal, oldVal);
        type = syncEvents.UPDATE;
      }

      return {
        type: type,
        data: item.data,
        position: item.position
      }
    };

    Differ.prototype.determineDelta = function (newVal, oldVal, lastUpdate) {
      var item = {}, type;

      if (!oldVal && newVal) {
        return {
          type: syncEvents.CREATE,
          data: newVal,
          position: 0
        }
      }
      else if ((!newVal && !oldVal) || (angular.equals(newVal, oldVal) && angular.equals(newVal, lastUpdate))) {
        return {
          type: syncEvents.NONE
        };
      }
      else if (oldVal && Array.isArray(oldVal) && Array.isArray(newVal)) {
        return this.compareArrays(newVal, oldVal);
      }
      else if (typeof newVal === 'string' && typeof oldVal === 'string') {
        return this.compareStrings(newVal, oldVal);
      }
      else {
        return {
          type: syncEvents.UNKNOWN
        };
      }
    };

    return new Differ();
  })

angular.module('SyncResource')
  .factory('$differ', function (syncEvents) {
    function Differ () {}

    Differ.prototype.findRemovedItem = function findRemovedItem (binder, delta, next) {
      var old = {}, i;

      //First get the ids of the items that were there.
      for (i = 0; i < delta.oldVal.length; i++) {
        old[JSON.stringify(delta.oldVal[i])] = i;
      }

      //Then iterate through the items in the new array.
      for (i = 0; i < delta.newVal.length; i++) {
        delete old[JSON.stringify(delta.newVal[i])];
      }

      // if (Object.keys(old).length !== 1) throw new Error("Could not find removed item.");
      delta.position = old[Object.keys(old)[0]];
      delta.data = JSON.parse(Object.keys(old)[0]);
      delta.type = syncEvents.REMOVE;
      next();
    };

    Differ.prototype.findAddedItem = function (binder, delta, next) {
      var old = {}, i;

      //Make a dictionary of hash keys that were already there.
      for (i = 0; i < delta.oldVal.length; i++) {
        old[JSON.stringify(delta.oldVal[i])] = true;
      }

      for (i = 0; i < delta.newVal.length; i++) {
        if (!old[JSON.stringify(delta.newVal[i])]) {
          delta.data = delta.newVal[i];
          delta.position = i;
          delta.type = syncEvents.ADD;
          return next();
        }
      }
    };

    Differ.prototype.findUpdatedItem = function (binder, delta, next) {
      var old = {}, i;

      for(i = 0; i < delta.oldVal.length; i++) {
        old[JSON.stringify(delta.oldVal[i])] = i;
      }
      
      for(i = 0; i < delta.newVal.length; i++) {
        if (typeof old[JSON.stringify(delta.newVal[i])] === 'undefined') {
          delta.data = delta.newVal[i];
          delta.position = i;
          delta.type = syncEvents.UPDATE;
          return next();
        }
      }
    };

    //TODO: This can only find one diff right now, can't find multiple diffs at different positions.
    Differ.prototype.findAddedString = function (binder, delta, next) {
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
      next();
    };

    Differ.prototype.findRemovedString = function (binder, delta, next) {
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

      next();
    };

    Differ.prototype.findChangedString = function (binder, delta, next) {
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
      
      next();
    };

    Differ.prototype.compareStrings = function (binder, delta, next) {
      var item, type;
      if (delta.newVal.length > delta.oldVal.length) {
        this.findAddedString(binder, delta, next);
      }
      else if (delta.newVal.length < delta.oldVal.length) {
        this.findRemovedString(binder, delta, next);
      }
      else {
        // type = syncEvents.UPDATE;
        // item = this.findChangedString(delta.newVal, delta.oldVal);
        this.findChangedString(binder, delta, next);
        // delta.type = type;
        // delta.data = item.data;
        // delta.position = item.position;
        // next();
      }
    };

    Differ.prototype.compareArrays = function (binder, delta, next) {
      // Something has changed in an existing array.
      if (delta.newVal.length > delta.oldVal.length) {
        // Something has been added to the array.
        this.findAddedItem(binder, delta, next);
      }
      else if (delta.newVal.length < delta.oldVal.length) {
        // Something has been removed from the array.
        this.findRemovedItem(binder, delta, next);
      }
      else {
        // An object changed within the array.
        this.findUpdatedItem(binder, delta, next);
      }
    };

    Differ.prototype.determineDelta = function (binder, delta, next) {
      var item = {}, type;

      if (!delta.oldVal && delta.newVal) {
        delta.type = syncEvents.CREATE;
        delta.data = delta.newVal;
        next();
      }
      else if ((!delta.newVal && !delta.oldVal) || (angular.equals(delta.newVal, delta.oldVal) && angular.equals(delta.newVal, binder.lastUpdate))) {
        delta.type = syncEvents.NONE;
        next();
      }
      else if (delta.oldVal && Array.isArray(delta.oldVal) && Array.isArray(delta.newVal)) {
        this.compareArrays(binder, delta, next);
      }
      else if (typeof delta.newVal === 'string' && typeof delta.oldVal === 'string') {
        this.compareStrings(binder, delta, next);
      }
      else {
        delta.type = syncEvents.UNKNOWN;
        next();
      }
    };

    return new Differ();
  })

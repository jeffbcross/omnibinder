var app = angular.module('todo', ['OmniBinder']);

app.service('firebase', function (obBinderTypes, $parse) {
  var isLocal = false;

  this.subscribe = function (binder) {
    binder.fbRef = new Firebase(binder.query.url);

    binder.index = [];

    if (binder.type === obBinderTypes.COLLECTION) {
      binder.fbRef.on('child_added', function (snapshot, prev) {
        var index, snap = snapshot.val();
        console.log('child_added', snap);

        var key = snapshot.name();
        var currIndex = binder.index.indexOf(key)
        if (currIndex !== -1) {
          binder.index.splice(currIndex, 1);
        }

        if (prev) {
          var prevIndex = binder.index.indexOf(prev);
          binder.index.splice(prevIndex + 1, 0, key);
        }
        else {
          binder.index.unshift(key);
        }

        if (binder.key) snap[binder.key] = snapshot.name();

        if (isWaitingForId(binder, snap)) {

          binder.onProtocolChange.call(binder, [{
            name: binder.key,
            object: snap,
            type: 'new',
            force: true
          }]);

          return;
        }

        index = getIndexOfItem(binder.scope[binder.model], snapshot.name(), binder.key);
        index = typeof index === 'number' ? index : binder.scope[binder.model].length;

        binder.onProtocolChange.call(binder, [{
          addedCount: 1,
          added: [snap],
          index: index,
          removed: []
        }]);
      });

      binder.fbRef.on('child_removed', function (snapshot, prev) {
        var index = getIndexOfItem(binder.scope[binder.model], snapshot.name(), binder.key);

        if (typeof index !== 'number') return;

        var change = {
          removed: [snapshot.val()],
          addedCount: 0,
          index: index
        };

        binder.onProtocolChange.call(binder, [change]);
      });

      binder.fbRef.on('child_changed', function (snapshot) {
        var index, removed, snap = snapshot.val();

        if (binder.key) snap[binder.key] = snapshot.name();

        index = getIndexOfItem(binder.scope[binder.model], snapshot.name(), binder.key);
        index = typeof index === 'number' ? index : binder.scope[binder.model].length;

        removed = angular.copy(binder.scope[binder.model][index]);

        binder.onProtocolChange.call(binder, [{
          index: index,
          addedCount: 1,
          removed: [removed],
          added: [snap]
        }]);
      });

      //TODO: Finish the move implementation
      binder.fbRef.on('child_moved', function (snapshot, prev) {
        var snap = snapshot.val(),
            originalIndex = getIndexOfItem(binder.scope[binder.model], snapshot.name(), binder.key),
            newIndex;

        console.log('child_moved', snap, originalIndex);

        if (typeof originalIndex !== 'number') return;

        newIndex = getIndexOfItem(binder.scope[binder.model], prev, binder.key);
        newIndex = newIndex ? newIndex - 1 : 0;

        console.log('newIndex', newIndex);

        binder.onProtocolChange.call(binder, [{
          index: originalIndex,
          addedCount: 0,
          removed: [snap],
          added: []
        }, {
          index: newIndex,
          addedCount: 1,
          removed: [],
          added: [snap]
        }]);
      });
    }

    //TODO: Figure this out.
    function isWaitingForId (binder, object) {
      // var copy = angular.copy(object),
      //     isWaiting = false;

      return false;
    }
  };

  this.processChanges = function (binder, delta) {
    var change,
        getter = $parse(binder.model);

    for (var i = 0; i < delta.changes.length; i++) {
      change = delta.changes[i];

      if (change.addedCount) {
        for (var j = change.index; j < change.addedCount + change.index; j++) {
          binder.ignoreNProtocolChanges++;
          processAddedItem(angular.copy(getter(binder.scope)[j]));
        }
      }
    }

    function processAddedItem (model) {
      isLocal = true;
      binder.fbRef.push(model);
    }
  };

  function getIndexOfItem (list, id, key) {
    var itemIndex;

    angular.forEach(list, function (it, i) {
      if (itemIndex) return;
      if (it && it[key] === id) itemIndex = i;
    });

    return itemIndex;
  }
});

app.controller('App', function ($scope, obBinderTypes, obBinder, firebase) {
  $scope.items = [];

  var myBinder = obBinder($scope, 'items', firebase, {
    key: 'id',
    query: {
      url: 'http://superheroic.firebaseio.com/items'
    },
    type: obBinderTypes.COLLECTION
  });

  $scope.add = function() {
    $scope.items.push({text: $scope.newText, done: false});
    $scope.newText = '';
  };

  $scope.remaining = function() {
    return $scope.items.reduce(function(count, item) {
      return item.done ? count : count + 1;
    }, 0);
  };

  $scope.archive = function() {
    var item;
    for (var i = 0; i < $scope.items.length; i++) {
      item = $scope.items[i];
      if (item.done) {
        $scope.items.splice(i, 1);
        i--;
      }
    }

  };
});

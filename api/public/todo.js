var app = angular.module('todo', ['OmniBinder']);

app.service('deployd', function () {
  function getIndexOfItem (list, id) {
    var itemIndex;

    angular.forEach(list, function (it, i) {
      if (itemIndex) return;
      if (it && it.id === id) itemIndex = i;
    });

    return itemIndex;
  }

  this.subscribe = function (binder) {
    dpd[binder.query.collection].get(function (items) {
      if (!items.length) return;

      binder.onProtocolChange.call(binder, [{
        added: items,
        removed: [],
        addedCount: items.length,
        index: 0
      }]);
    });

    dpd[binder.query.collection].on('updated', function (newItem) {
      var modelCopy = angular.copy(binder.scope[binder.model]);
      var itemIndex = getIndexOfItem(modelCopy, newItem.id);
      if (typeof itemIndex !== 'number') return;

      binder.onProtocolChange.call(binder, [{
        index: itemIndex,
        addedCount: 1,
        added: [newItem],
        removed: [modelCopy[itemIndex]]
      }]);
    });

    dpd[binder.query.collection].on('created', function (change) {
      change.index = binder.scope[binder.model].length;
      binder.onProtocolChange.call(binder, [change]);
    });

    dpd[binder.query.collection].on('deleted', function (removedItem) {
      var modelCopy = angular.copy(binder.scope[binder.model]);
      var itemIndex = getIndexOfItem(modelCopy, removedItem.id);
      if (typeof itemIndex !== 'number') return;

      var change = {
        removed: [removedItem],
        addedCount: 0,
        index: itemIndex
      };

      binder.onProtocolChange.call(binder, [change]);
    })
  };

  this.processChanges = function (binder, delta) {
    function removeItem (item) {
      console.log('remove item', item);
      //Make sure the item wasn't actually just updated.
      var modelCopy = angular.copy(binder.scope[binder.model]);
      var itemIndex = getIndexOfItem(modelCopy, item.id);
      if (typeof itemIndex === 'number') return;
      console.log('looks like the item really is gone', item);
      dpd[binder.query.collection].del(item.id);
    }

    delta.changes.forEach(function (change) {
      if (change.removed) {
        change.removed.forEach(removeItem);
      }

      if (change.addedCount) {
        for (var i = change.index; i < change.addedCount + change.index; i++) {
          // dpd[binder.query.collection].post(binder.scope[binder.model][i], function (item) {
          //   console.log('object created in deployd', item);
          //   // binder.onProtocolChange() hold off until recursion is prevented
          // })
        }
      }
    });
  };
});

app.controller('App', function ($scope, obBinderTypes, obBinder, deployd) {
  $scope.items = [];

  var myBinder = obBinder($scope, 'items', deployd, {
    deep: true,
    key: 'id',
    query: {
      collection: 'todos'
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
    angular.forEach($scope.items, function (item, i) {
      if (item.done) $scope.items.splice(i, 1);
    });
  };
});

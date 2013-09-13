var app = angular.module('todo', ['OmniBinder']);

// angular.module('exceptionOverride', []).factory('$exceptionHandler', function () {
//   return function (exception, cause) {
//     exception.message += ' (caused by "' + cause + '")';
//     throw exception;
//   };
// });

app.service('deployd', function () {
  this.subscribe = function (binder) {
    dpd[binder.query.collection].get(function (items) {
      console.log('fetched', arguments);
      if (!items.length) return;

      binder.onProtocolChange.call(binder, [{
        added: items,
        removed: [],
        addedCount: items.length,
        index: 0
      }]);
    });

    dpd.todos.on('updated', function (change) {
      change.index = binder.scope[binder.model].length

      binder.onProtocolChange.call(binder, [change]);
    });
  };

  this.processChanges = function (binder, delta) {
    function removeItem (item) {
      console.log('remove item', item);
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
    $scope.items = $scope.items.filter(function(item) {
      return !item.done;
    });
  };
});

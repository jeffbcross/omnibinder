var app = angular.module('todo', ['OmniBinder']);

// angular.module('exceptionOverride', []).factory('$exceptionHandler', function () {
//   return function (exception, cause) {
//     exception.message += ' (caused by "' + cause + '")';
//     throw exception;
//   };
// });

app.service('firebase', function ($parse) {
  this.subscribe = function (myBinder) {
    this.ref = new Firebase(myBinder.query.url);
    // myBinder.query

    this.ref.child(myBinder.query.path).on('value', function (childSnapshot) {
      // console.log('value', childSnapshot.val());
    });

    this.ref.child(myBinder.query.path).on('child_added', function (childSnapshot, prevChildName) {
      // console.log('child_added', childSnapshot.val(), prevChildName);
      myBinder.onProtocolChange([{
        added: [childSnapshot.val()],
        addedCount: 1,
        index: $parse(myBinder.model)(myBinder.scope).length,
        removed: []
      }])
    });

    this.ref.child(myBinder.query.path).on('child_removed', function (oldChildSnapshot) {
      // console.log('child_removed', oldChildSnapshot.val());
    });

    this.ref.child(myBinder.query.path).on('child_changed', function (childSnapshot, prevChildName) {
      // console.log('child_changed', childSnapshot.val(), prevChildName);
    });

    this.ref.child(myBinder.query.path).on('child_moved', function (childSnapshot, prevChildName) {
      var index;
      // console.log('child_moved', childSnapshot.val(), prevChildName);
      if ((index = this.ignoredMoves.indexOf(childSnapshot.name())) > -1) {
        delete this.ignoredMoves[index];
        return console.log('child did not really move');
      }
      // console.log('index', index);
    }.bind(this));
  };

  this.ignoredMoves = [];
  this.ignoreMove = function (name) {
    // console.log('ignoreMove', name);
    this.ignoredMoves.push(name);
  };

  this.processChanges = function (binder, delta) {
    if (delta.changes && delta.changes.length) {
      angular.forEach(delta.changes, function (change) {
        if (change.addedCount && typeof change.index === 'number') {
          var ref = this.ref.child(binder.query.path).push(angular.copy(binder.scope[binder.model])[change.index]);
          ref.setPriority(change.index);
          this.ignoreMove(ref.name());
        }
      }, this);
    }
  };
});

app.controller('App', function ($scope, obBinderTypes, obBinder, firebase) {
  $scope.items = [];

  var myBinder = obBinder({
    scope: $scope,
    model: 'items',
    deep: true,
    protocol: firebase,
    query: {
      url: 'https://superheroic.firebaseio.com/',
      path: 'items'
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

# SyncResource

__Simple, persistent data-binding for AngularJS.__

_Status: Experimental, In-Development._

## Overview

The SyncResource module is a toolkit to enable realtime data synchronization between AngularJS apps and various protocols & persistence layers.

The module is built to be flexible enough to support arbitrary protocols to react to in-memory model changes. Building a re-usable protocol is a matter of implementing the interface expected by $syncResource, then managing the details of reading, subscribing to, and writing to the persistence layer underneath. For example, a protocol could be written for HTML5 LocalStorage, a REST API, an API using WebSockets, or any combination of arbitrary technologies underneath.

SyncResource provides the following tools to make two-way data binding simple:

 * Bind scope models directly to a protocol, based on an optional protocol-specific query.
 * Change Pipelining: Bi-directional change pipelining supports writing of middleware-like methods to operate on a _delta_ object in order after a change is registered from a local model or a protocol.
 * Small libraries with utility methods to add common processing to change pipelines, such as throttling, delta analysis, change batching (not yet implemented).

Currently, the SyncResource toolchain is focused on supporting synchronization of strings, arrays, and objects, but should eventually have a good story for binary data.


## Getting Started

_Simple Example_
    
    var app = angular.module('myApp', ['SyncResource']);
    app.controller('MyCtrl', function ($scope, $syncResource, someJSONAPI) {
      var myProtocol = someJSONAPI({url: 'http://myhost'});
      var mySyncResource = $syncResource({protocol: myProtocol});
      $scope.myProducts = [{title: 'Widget'}, {title: 'Doodad'}];
      var binder = mySyncResource.bind({
        scope: $scope,
        model: 'myProducts'
      });
    });

_Robust Example_
    
    var app = angular.module('myApp', ['SyncResource']);
    app.controller('MyCtrl', function ($scope, $syncResource, $differ, $throttler, someJSONAPI) {
      var myProtocol = someJSONAPI({url: 'http://myhost'});
      var mySyncer = $syncResource({protocol: myProtocol});
      var myQuery = {
        path: '/path/to/stuff'
      };
      $scope.myProducts = [{title: 'Widget'}, {title: 'Doodad'}];
      var binder = mySyncer.bind({
        scope: $scope,
        model: 'myProducts',
        query: myQuery,
        key: 'id',
        type: 'collection',
        onModelChange: [$throttler(250), $differ.compareArrays],
        onProtocolChange: [function (binder, delta, next) {
          delta.random = Math.random();
          next();
        }]
      });
    });
    

## Services

### $syncResource

$syncResource is a factory whose instances can be used in any scope to bind any of the scope's models to a protocol. A $syncResource instance has a 1:1 relationship with a protocol, but can be used to bind multiple models in multiple scopes. As a best practice, $syncResource instances should be configured in a service.

Example using one $syncResource instance in multiple scopes.

```javascript
var myApp = angular.module('myApp', ['SyncResource']);
myApp.factory('mySyncResource', function ($syncResource, someJSONAPI) {
  var myProtocol = someJSONAPI({url: 'http://myprotocol'});
  var mySyncResource = $syncResource({protocol: myProtocol});
  return mySyncResource;
});

myApp.controller('ProfileCtrl', function ($scope, mySyncResource) {
  $scope.me = {name: "Jeff", likes: ['cats']};
  var query = { //Protocol-specific query
    path: '/users/me'
  }
  var binder1 = mySyncResource.bind({
    scope: $scope,
    model: 'me',
    query: query
  });
});

myApp.controller('FriendCtrl', function ($scope, mySyncResource) {
  $scope.myFriends = [];
  $scope.me = {username: "jeffbcross"};
  var binder = mySyncResource.bind({
    scope: $scope,
    model: 'myFriends',
    type: 'collection',
    key: 'username',
    query: { //Protocol-specific query
      path: '/users',
      filter: {
        friends: { $in: [$scope.me.username] }
      }
    }
  });
})
```

### $differ

The `$differ` service provides simple utility methods to do simple diffing between the newVal and oldVal of a `delta` object. Its purpose is to support common needs for analyzing changes, in order to send _only_ changes to protocols that can support this, unlike protocols that require sending full model representations with updates.

Each public method of differ implements the proper signature for middleware chaining in the Change Pipeline `function (binder, delta, next) {}`.

Currently this utility is in a very basic state, with limited usefulness. For example, it is only able to find one change in any type of object, instead of multiple changes or batches of changes. It presently only implements methods for arrays and strings.

#### Methods

 * __compareArrays__ - A convenience method that determines what changed about an array, then delegates to a more specialized method. This method sets a `type` property on the delta, based on a common syncEvents dictionary. Once this method determines the type of change, it delegates to one of `findAddedItem`, `findRemovedItem`, `findUpdatedItem`.
 * __findAddedItem__ - Iterates through delta.newVal and delta.oldVal arrays to determine what item was added, and at what position. Assigns new object to `data` property of delta, and assigns the index of the new object to the delta's `position` property.
 * __findRemovedItem__ - Iterates through delta.newVal and delta.oldVal arrays to determine what item was removed, and at what position. Adds `position` property to delta, as well as a `data` property which contains the entire removed object.
 * __findUpdatedItem__ - Iterates through delta.newVal and delta.oldVal arrays to determine what item was updated, and its position.
 * __compareStrings__ - A convenience method that _tries_ to determine what changed about a string, adds a `type` property to the delta, and then delegates to a more specialized method to find the change. It delegates to one of `findAddedString`, `findRemovedString`, `findChangedString`.
 * __findAddedString__ - Similar to `findAddedItem`, but finds where a string was added within another string, and assigns the different part of the string to delta.data. 
 * __findRemovedString__ - Similar to `findRemovedItem`, but finds where a string was removed, and what the removed contents are. 
 * __findChangedString__ - Similar to `findChangedItem`, but finds where a change begins in a string, and sets the entire changed portion to delta.data.

The example below shows how the $differ.compareArrays method would be implemented in the onModelChange pipeline. The result of this would be that the change pipeline would fire after pushing the new post, with the delta being given to the protocol with the `type`, `data`, and `position` properties being set to "add", {title: 'How to Email'}, and 1 respectively.

```javascript
var myApp = angular.module('myApp', ['SyncResource']);
myApp.factory('mySyncResource', function ($syncResource, someJSONAPI) {
  var myProtocol = someJSONAPI({url: 'http://myprotocol'});
  var mySyncResource = $syncResource({protocol: myProtocol});
  return mySyncResource;
});

myApp.controller('ProfileCtrl', function ($scope, $differ, mySyncResource) {
  $scope.posts = [{title: 'How to Search the Web'}];
  var binder = mySyncResource.bind({
    scope: $scope,
    model: 'posts',
    onModelChange: [$differ.compareArrays]
  });
  $scope.posts.push({title: 'How to Email'});
});
```

### $throttler

$throttler is a simple factory that returns a middleware function to delay a change pipeline by 

## IProtocol

## Entities

### binder

### delta



## Change Pipeline
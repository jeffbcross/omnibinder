# OmniBinder

__One binder to bind AngularJS models to everything.__

__Status__: _Experimental, In-Development._

Currently, the only supported use case is binding arrays of objects to a protocol.

<a id="overview"></a>

## Overview

The `OmniBinder` module is a framework to enable realtime data synchronization between AngularJS apps and various [protocols & persistence layers](docs/protocol.md#protocol).

The module is built to be flexible enough to support arbitrary protocols to react to in-memory model changes.
Building a re-usable protocol is a matter of implementing the [interface](docs/protocol.md#iprotocol) expected by the `obBinder` service, then managing the details of reading, subscribing to, and writing to the persistence layer underneath. For example, a protocol could be written for HTML5 LocalStorage, a REST API, an API using WebSockets, or any combination of arbitrary technologies underneath.

`OmniBinder` provides the following tools to make two-way data binding simple:

 * Bind scope models directly to a protocol, based on an optional protocol-specific [query](#binder).
 * [Change Pipelining](docs/change-pipeline.md): Bi-directional change pipelining supports writing of middleware-like functions to operate on a [`delta`](#delta) object in order after a change is registered from a local model or a protocol.
 * Small libraries with utility methods to add common processing to [Change Pipelines](docs/change-pipeline.md), such as [throttling](#throttler) and change batching (not yet implemented).

Currently, the `OmniBinder` toolchain is focused on supporting synchronization of strings, arrays, and objects, but should eventually have a good story for binary data.

## Problems to Solve with this framework.

 * Marshalling data changes between models and protocols.
 * Implementing a robust, bi-directional change intercept API.
 * Standardizing a realtime data sync & caching strategy.
 * Represent binary streams in Angular.
 * Allowing interaction with large sets of remote data without loading all data into memory.


## Getting Started

_Simple Example_

```javascript
var app = angular.module('myApp', ['OmniBinder']);
app.controller('MyCtrl', function ($scope, obBinder, someJSONAPI) {
  var myProtocol = someJSONAPI({url: 'http://myhost'});
  $scope.myProducts = [{title: 'Widget'}, {title: 'Doodad'}];

  // Starts binding the model to the protocol
  var myBinder = obBinder($scope, 'myProducts', myProtocol);
});
```

## Concepts



<a id="binder"></a>
### binder

`obBinder` calls the private `obBinder` factory when calling `myBinder.bind()`. The `obBinder` factory takes an object map as its only argument, which contains the following properties:

 * __scope__ (scope instance: required) - The scope in which to watch the model.
 * __model__ (string: required) - Name of the model to watch on the provided scope.
 * __query__ (*: optional) - A query, if necessary. This is available as `binder.query` in any [Change Pipeline](docs/change-pipeline.md) functions, but is otherwise only used by some protocols.
 * __type__ (string: optional) - Should be one of constants available in [`binderTypes`](#binderTypes) service. This is useful to help protocols know how to analyze changes, but should be used as a best practice to take advantage of future enhancements to the `OmniBinder` module.
 * __onModelChange__ (function or array of functions: optional) - Function(s) to be executed in order after a model change has occurred. Should implement signature `function (binder, delta, next) {}` and should call `next()` when complete.
 * __onProtocolChange__ (function or array of functions: optional) - Same as `onModelChange` but reverse direction.
 * __key__ (string: optional) - If the model is a collection of objects, the key helps methods in the [Change Pipeline](docs/change-pipeline.md) by confirming which property in the collection should be unique.

Each `obBinder` instance is associated with one model in one scope. The `obBinder` should generally be treated as a static object, as far as the [Change Pipeline](docs/change-pipeline.md) is concerned. But it's useful to occasionally store temporary metadata or temporary data on a binder. For example, when model updates are being throttled, it would be appropriate to store a temporary queue of changes on the `binder` to be batched in a later call to a protocol.

The `binder` is accessible in every part of the [Change Pipeline](docs/change-pipeline.md).

<a id="delta"></a>
### delta

A new `delta` object is created each time a change is registered from a local model or protocol. The `delta` is passed to every method in the [Change Pipeline](docs/change-pipeline.md). There are no rules on what properties it can contain, but the currently-supported properties include:

 * __data__ (*: required) - This property should be set when the `delta` object is created. `OmniBinder` doesn't care about its type or contents, as long as it is present. It's up to [Change Pipeline](docs/change-pipeline.md) and protocol methods to update the data (and other properties) as the `delta` progresses through the chain.
 * __newVal__ (*: optional) - If the change originates from a local model, the `obBinder` will assign `newVal` and `oldVal` directly from the `scope.$watch` callback.
 * __oldVal__ (*: optional) - See `newVal`.
 * __type__ (string: optional) - Represents the type of change, such as add/remove/update. Should be a constant from the `syncEvents` service, unless there's some newfangled event that isn't part of that dictionary, which the protocol would know how to support.
 * __silent__ (boolean: optional) - Can be set from the [protocol](docs/protocol.md#protocol) at the beginning of the [onProtocolChange pipeline](docs/change-pipeline.md) to prevent the onModelChange pipeline from immediately responding to the updated model. This will only prevent a single occurence of the `onModelChange` pipeline, and will not stop the model change from propagating elsewhere in the Angular application.

## Services

### obBinder

`obBinder` is a factory whose instances can be used in any scope to bind any of the scope's models to a protocol. A `obBinder` instance has a 1:1 relationship with a protocol, but can be used to bind multiple models in multiple scopes. As a best practice, `obBinder` instances should be configured in a service.

Example using one `obBinder` instance in multiple scopes.

```javascript
var myApp = angular.module('myApp', ['OmniBinder']);
myApp.factory('myBinder', function (obBinder, someJSONAPI) {
  var myProtocol = someJSONAPI({url: 'http://myprotocol'});
  var myBinder = obBinder({protocol: myProtocol});
  return myBinder;
});

myApp.controller('ProfileCtrl', function ($scope, myBinder) {
  $scope.me = {name: "Jeff", likes: ['cats']};
  var query = { //Protocol-specific query
    path: '/users/me'
  }
  var binder1 = myBinder.bind({
    scope: $scope,
    model: 'me',
    query: query
  });
});

myApp.controller('FriendCtrl', function ($scope, myBinder) {
  $scope.myFriends = [];
  $scope.me = {username: "jeffbcross"};
  var binder = myBinder.bind({
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

<a id="differ"></a>
### differ

The `differ` service provides simple utility methods to do simple diff analysis between the newVal and oldVal of a `delta` object. Its purpose is to support common needs for analyzing changes, in order to send _only_ changes to protocols that can support this, unlike protocols that require sending full model representations with updates.

Each public method of `differ` implements the proper signature for middleware chaining in the [Change Pipeline](docs/change-pipeline.md): `function (binder, delta, next) {}`.

Currently this utility is in a very basic state, with limited usefulness. For example, it is only able to find one change in any type of object, instead of multiple changes or batches of changes. It presently only implements methods for arrays and strings.

#### Methods

 * __compareArrays__ - A convenience method that determines what changed about an array, then delegates to a more specialized method. This method sets a `type` property on the delta, based on a common [`syncEvents`](#sync-events) dictionary. Once this method determines the type of change, it delegates to one of `findAddedItem`, `findRemovedItem`, `findUpdatedItem`.
 * __findAddedItem__ - Iterates through `delta.newVal` and `delta.oldVal` arrays to determine what item was added, and at what position. Assigns new object to `delta.data`, and assigns the index of the new object to `delta.position`.
 * __findRemovedItem__ - Iterates through `delta.newVal` and `delta.oldVal` arrays to determine what item was removed, and at what position. Adds `position` property to `delta`, as well as a `data` property which contains the entire removed object.
 * __findUpdatedItem__ - Iterates through `delta.newVal` and `delta.oldVal` arrays to determine what item was updated, and its position.
 * __compareStrings__ - A convenience method that _tries_ to determine what changed about a string, adds a `type` property to the `delta`, and then delegates to a more specialized method to find the change. It delegates to one of `findAddedString`, `findRemovedString`, `findChangedString`.
 * __findAddedString__ - Similar to `findAddedItem`, but finds where a string was added within another string, and assigns the different part of the string to `delta.data`.
 * __findRemovedString__ - Similar to `findRemovedItem`, but finds where a string was removed, and what the removed contents are.
 * __findChangedString__ - Similar to `findChangedItem`, but finds where a change begins in a string, and sets the entire changed portion to `delta.data`.

The example below shows how the `differ.compareArrays` method would be implemented in the `onModelChange` [Change Pipeline](docs/change-pipeline.md). The result of this would be that the [Change Pipeline](docs/change-pipeline.md) would commence after pushing the new post to `$scope.posts`, with the `delta` being given to the protocol with the `type`, `data`, and `position` properties being set to "add", {title: 'How to Email'}, and 1 respectively.

```javascript
var myApp = angular.module('myApp', ['OmniBinder']);
myApp.factory('myBinder', function (obBinder, someJSONAPI) {
  var myProtocol = someJSONAPI({url: 'http://myprotocol'});
  var myBinder = obBinder({protocol: myProtocol});
  return myBinder;
});

myApp.controller('ProfileCtrl', function ($scope, differ, myBinder) {
  $scope.posts = [{title: 'How to Search the Web'}];
  var binder = myBinder.bind({
    scope: $scope,
    model: 'posts',
    onModelChange: [differ.compareArrays]
  });
  $scope.posts.push({title: 'How to Email'});
});
```

<a id="throttler"></a>
### throttler

The `throttler` service provides a simple factory that accepts one argument, a number of milliseconds by which to delay the [Change Pipeline](docs/change-pipeline.md), and returns a middleware function to be added to the [Change Pipeline](docs/change-pipeline.md), usually at the first step. If another change is fired before the `throttler` has executed, the previous [Change Pipeline](docs/change-pipeline.md) will be cancelled.

```javascript
...
app.controller('MyCtrl', function ($scope, throttler, myBinder) {
  var binder = myBinder.bind({
    scope: $scope,
    model: 'myModel',
    onModelChange: [throttler(250)]
  });
});
```

Currently, the service is very limited in that when the [Change Pipeline](docs/change-pipeline.md) continues, the `delta` will only contain `newVal` and `oldVal` from the most recent change.

### syncEvents

A static dictionary service of event constants to be applied to `deltas` as they progress through a [Change Pipeline](docs/change-pipeline.md). Presently contains these constants, but this list will probably double in length:

 * __GET__ - Simple read operation, typically only initiated by a protocol, and typically the intent is to blindly write data to the local model.
 * __MOVE__ - An item in a collection has changed position.
 * __ADD__ - A new item has been created in a collection.
 * __REMOVE__ - An item has been removed, probably from a collection, but not necessarily.
 * __CREATE__ - An item has been created. Similar to `ADD`, but not necessarily in the context of a collection.
 * __UPDATE__ - An existing item has changed one or more values.
 * __NONE__ - Nothing to see here.
 * __UNKNOWN__ - Something has happened, but it's not clear what.

```javascript
...
var binder = myBinder.bind({
  scope: $scope,
  model: 'myModel',
  type: binderTypes.COLLECTION,
  onModelChange: [function (binder, delta, next) {
    if (delta.newVal.length > delta.oldVal.length) {
      delta.type = syncEvents.NEW;
    }
    next();
  }]
})
```

<a id="binderTypes"></a>
### binderTypes

A static dictionary of model types which can be optionally be added to the config object passed into [`binder`](#binder) in order to provide an opportunity to reduce ambiguity in [Change Pipeline](docs/change-pipeline.md) methods, and potentially the protocol. This value can help Binder know how to create or update models in ambiguous circumstances. The service currently contains the following constants:

 * __COLLECTION__ - For lists of any type of data.
 * __OBJECT__ - For plain old objects.
 * __BOOLEAN__
 * __STRING__
 * __NUMBER__
 * __BINARY__ - For binary data such as an image, video, audio clip.
 * __BINARY_STREAM__ - For streaming binary data such as video chat or audio call.

```javascript
...
var binder = myBinder.bind({
  scope: $scope,
  model: 'myModel',
  type: binderTypes.COLLECTION
})
```
## Factories

<a id="binder"></a>
### obBinder

`obBinder` is a factory whose instances can be used
in any scope to bind any of the scope's models to a protocol.

Using the `obBinder` factory creates a new binding instance. The factory takes the following arguments:

 * __scope__ (scope instance: required) - The scope in which to watch the model.
 * __model__ (string: required) - Name of the model to watch on the provided scope.
 * __options__ (object: optional) -
    * __query__ (*: optional) - A query, if necessary. This is available as `binder.query` in any [Change Pipeline](docs/change-pipeline.md) functions, but is otherwise only used by some protocols.
    * __type__ (string: optional) - Should be one of constants available in [`binderTypes`](#binderTypes) service. This is useful to help protocols know how to analyze changes, but should be used as a best practice to take advantage of future enhancements to the `OmniBinder` module.
    * __key__ (string: optional) - If the model is a collection of objects, the key helps methods in the [Change Pipeline](docs/change-pipeline.md) by confirming which property in the collection should be unique.

Each `obBinder` instance is associated with one model in one scope.
The `obBinder` should generally be treated as a static object,
as far as the [Change Pipeline](docs/change-pipeline.md) is concerned.
But it's useful to occasionally store temporary metadata
or temporary data on a binder.
For example, when model updates are being throttled,
it would be appropriate to store a temporary queue of
changes on the `binder` to be batched in a later call to a protocol.

The `binder` is accessible in every part of the [Change Pipeline](docs/change-pipeline.md).

## Interfaces

### Protocol

<a id="iprotocol"></a>
## IProtocol

A protocol is the guts of the `OmniBinder` module,
and manages the low-level synchronization of a local model to a remote data store.

A protocol only needs to expose these methods to be used by `obBinder` instances.

 * __processChanges (binder, delta) {}__ - Takes a delta with an array of `Object.observe` or `Array.observe` type changes,
   and applies them to the protocol's version of the model.
 * __subscribe (binder, callback) {}__ -
   This method is called as soon as `obBinder.bind` is called,
   in order to get an initial value for the model and to
   automatically update the model upon further changes in the
   persistence layer.
   Calls `callback` each time a relevant update occurs. Ideally, the protocol will be able to provide some initial data on the `delta`, such as the type of change, and of course, some representation of the changed data.
 * __unsubscribe(binder, callback)__ - Called when a bound scope is destroyed or when `obBinder.unbind()` is called.

Protocols must implement this interface when passed into the `obBinder` factory.
Protocols may require a configuration step prior to being passed in,
but obBinder is not concerned with _how_ a protocol prepares itself.

For example, both of the following examples are okay.

Example 1: Generate protocol from a factory

```javascript
myApp.factory('myProtocolFactory', function () {
  return function (url) {
    return {
      processChanges: function (binder, delta) {
        // Evaluate changes and sync at the provided URL
      },
      subscribe: function (binder, callback) {
        // Subscribe to protocol at the provided URL
      }
    }
  }
});
myApp.controller('UserCtrl', function ($scope, obBinder, myProtocolFactory) {
  $scope.users = [];
  var protocol = myProtocolFactory('http://path.to.api');
  var binder = obBinder($scope, 'users', protocol);
});
```

Example 2: Protocol is a ready-to-go service

```
myApp.service('myProtocolService', function () {
  this.subscribe = function (binder, callback) {
    if (!binder.query.url) throw new Error('Binder query must contain a url');
    // Subscribe to provided url
  };
});
myApp.controller('UserCtrl', function ($scope, obBinder, myProtocolService) {
  $scope.users = [];
  var binder = obBinder($scope, 'users', myProtocolService, {
    query: {
      url: 'http://path.to.api'
    }
  });
});
```


Protocols make use of the `query` object attached to a `binder` to ensure that the data is being persisted properly. Queries may contain a URL path to a resource on a server, an id of a particular object, or filters to restrict changes to certain items. `obBinder` has no policy on what type of object a query is, or what properties it contains. The extent of the policy is that if different models should be treated differently by a protocol, the place to store the instructions is on `binder.query`.

The protocol interface is still being actively developed, and will change.


## Types

<a id="arrayChange"></a>
### ArrayChange

<a id="objectChange"></a>
### ObjectChange

<a id="delta"></a>
### Delta

A new `delta` object is created each time a change is registered from a local model or protocol.
The `delta` is passed to every method in the [Change Pipeline](docs/change-pipeline.md). The only required property of a delta is `changes`, which is an array of `Object.observe` or `Array.observe` changes to be processed by a model or protocol.


## Services

<a id="binderTypes"></a>
### obBinderTypes

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
var binder = obBinder($scope, 'myModel', {
  type: binderTypes.COLLECTION
});
```

### obObserver

This library is used by `obBinder` to observe models for changes.
`obObserver` uses the [observe-js](https://github.com/Polymer/observe-js) library from the [Polymer](http://www.polymer-project.org/) project,
which is a layer on top of natively-implemented Object.observe and Array.observe APIs.



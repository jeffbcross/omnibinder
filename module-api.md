# OmniBinder Module API

 * [Factories](#factories)
    * [obBinder](#obBinder)
    * [obArrayChange](#obArrayChange)
    * [obOldObject](#obOldObject)
    * [obObjectChange](#obObjectChange)
 * [Services](#services)
    * [obObserver](#obObserver)
    * [obBinderTypes](#obBinderTypes)
 * [Interfaces](#interfaces)
    * [IProtocol](#iprotocol)
 * [Types](#types)
    * [Binder](#typeBinder)
    * [Delta](#typeDelta)
    * [ArrayChange](#typeArrayChange)
    * [ObjectChange](#typeObjectChange)


<a id="factories"></a>
## Factories


<a id="obBinder"></a>
### obBinder

The `obBinder` factory provides the main public API for
the `OmniBinder` module.

`obBinder` is a factory whose instances can be used
in any scope to bind any of the scope's models to a protocol.

Each `obBinder` instance is associated with one model in one scope.
The `obBinder` should generally be treated as a static object,
as far as the [Change Pipeline](docs/change-pipeline.md) is concerned.
But it's useful to occasionally store temporary metadata
or temporary data on a binder.
For example, when model updates are being throttled,
it would be appropriate to store a temporary queue of
changes on the `binder` to be batched in a later call to a protocol.

The `binder` is accessible in every part of the [Change Pipeline](docs/change-pipeline.md).

Using the `obBinder` factory creates a new binding instance.
The factory takes the following arguments:

 * __Scope `scope`:required__
   The scope in which to watch the model.
 * __String `model`: required__
   Name of the model to watch on the provided scope.
 * __Protocol `protocol`: required__
   The protocol to which model changes should be persisted.
 * __BinderOptions `options`: optional__
    * __* `query`: optional__
      A query, if necessary.
      This is available as `binder.query` in any [Change Pipeline](docs/change-pipeline.md)
      functions, but is otherwise only used by some protocols.
    * __String `type`: optional__
      Should be one of constants available in [`binderTypes`](#obBinderTypes) service.
      This is useful to help protocols know how to analyze changes,
      but should be used as a best practice to take advantage of
      future enhancements to the `OmniBinder` module.
    * __String `key`: optional__
      If the model is a collection of objects,
      the key helps methods in the [Change Pipeline](docs/change-pipeline.md)
      by confirming which property in the collection should be unique.

Returns: [Binder](#typeBinder)


<a id="obArrayChange"></a>
### obArrayChange

A convenience factory to generate a well-formed
[ArrayChange](#arrayChange) object.

The factory takes the following arguments:

 * __Integer `addedCount`: required__
 * __Array `removed`: required__
 * __Integer `index`: required__

Returns: [ArrayChange](#arrayChange) change


<a id="obOldObject"></a>
### obOldObject

Re-constructs the previous version of an object,
based on information from an [ObjectChange](#objectChange).

The factory takes the following arguments:

 * __ObjectChange `change`: required__

Returns: Object `oldObject`


<a id="obObjectChange"></a>
### obObjectChange
_Not Yet Implemented_


<a id="services"></a>
## Services


<a id="obObserver"></a>
### obObserver

#### Methods

 * __`observeObjectInCollection`__
    Observe a single object in a collection.

    When Object.observe notifies that this object has changed,
    the callback will be called with the proper context,
    and will prepare an Array.observe-like changeset instead
    of the Object.observe style of changes.

    The assumption is that when observing a collection, the preferred
    format of changes will operations that can be applied to a collection
    to easily keep multiple copies of a collection in sync.

    A member outside the scope of this service would need to compare the
    new item with the removed item to determine if the change was actually
    an update to an object, rather than a removal/addition that is typically
    represented by an Array.observe change set. For example, the collection
    has a unique key constraint, the values of that key could be compared in
    the removed and added objects.

    __Arguments:__

    * Scope `context`: required
    * Array `collection`: required
    * Object `object`: required
    * Function `callback`: required

 * __`observeCollection`__
    Observe an array and its child objects, then notify callback on any change.

    __Arguments:__

    * Scope `context`
      The context with which to call the callback.
    * Array `collection`
      The collection to be observed.
    * Function `callback`
      The callback to call on an array change.


<a id="obBinderTypes"></a>
### obBinderTypes

A static dictionary of model types which can be optionally be
added to the [options](#typeBinderOptions) object passed into [`obBinder`](#obBinder)
in order to provide an opportunity to reduce ambiguity in
[Change Pipeline](docs/change-pipeline.md) methods,
and potentially the protocol.
This value can help OmniBinder know how to create or update
models in ambiguous circumstances.
The service currently contains the following constants:

 * __String `COLLECTION` = "collection"__
   For lists of any type of data.
 * __String `OBJECT` = "object"__
   For plain old objects.
 * __String `BOOLEAN` = "boolean"__
 * __String `STRING` = "string"__
 * __String `NUMBER` = "number"__
 * __String `BINARY` = "binary"__
   For binary data such as an image, video, audio clip.
 * __String `BINARY_STREAM` = "binaryStream"__
   For streaming binary data such as video chat or audio call.

```javascript
...
var binder = obBinder($scope, 'myModel', {
  type: binderTypes.COLLECTION
});
```


<a id="interfaces"></a>
## Interfaces


<a id="iprotocol"></a>
### IProtocol

A protocol is the guts of the `OmniBinder` module,
and manages the low-level synchronization of a local model to a remote data store.

A protocol only needs to expose these methods to be used by `obBinder` instances.

 * __processChanges ([Binder](#typeBinder) binder, [Delta](#typeDelta) delta)__
   Takes a delta with an array of `Object.observe` or `Array.observe` type changes,
   and applies them to the protocol's version of the model.
 * __subscribe ([Binder](#typeBinder) binder)__
   This method is called as soon as a binder object is created
   from obBinder, in order to get an initial value for the model and to
   automatically update the model upon further changes in the
   persistence layer.
   The protocol should call `binder.onProtocolChange(Delta delta)`
   containing an array of properly-formatted changes to be applied
   to the model.
 * __unsubscribe([Binder](#typeBinder) binder)__
   Called when a bound scope is destroyed or when `binder.unbind()` is called.

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


Protocols may make use of the `query` object attached to a `binder`
to ensure that the data is being persisted properly.
Queries may contain a URL path to a resource on a server,
an id of a particular object,
or filters to restrict changes to certain items.
`obBinder` has no policy on what type of object a query is,
or what properties it contains.
The extent of the policy is that if different models should be treated
differently by a protocol, the place to store the instructions is on `binder.query`.

The protocol interface is still being actively developed, and will change.


<a id="types"></a>
## Types


<a id="typeBinder"></a>
### Binder

Created by the [`obBinder`](#obBinder) factory.

#### Methods

 * __onProtocolChange__
 * __onModelChange__
 * __val__
 * __unBind__

#### Properties

 * __Scope `scope`__
 * __String `model`__
 * __* `query`__
 * __BinderType `type`__
 * __Protocol `protocol`__


<a id="typeDelta"></a>
### Delta

A new `delta` object is created each time a change is registered from a local model or protocol.
The `delta` is passed to every method in the [Change Pipeline](docs/change-pipeline.md). The only required property of a delta is `changes`, which is an array of `Object.observe` or `Array.observe` changes to be processed by a model or protocol.

#### Properties

 * __Array&lt;ArrayChange, ObjectChange&gt; `changes`__


<a id="typeArrayChange"></a>
### ArrayChange

Based on changes generated by [observe-js](https://github.com/Polymer/observe-js),
which is based on natively-implemented `Array.observe` API.
These change objects are used to syndicate changes on
models between different sources in as simple a format as possible.

#### Properties

 * __Integer `index`__
 * __Array `removed`__
 * __Integer `addedCount`__


<a id="typeObjectChange"></a>
### ObjectChange

Similar to ArrayChange, but focused on applying changes
to plain old JavaScript objects.

 * __String `name`__
 * __Object `object`__
 * __* `oldValue`__
 * __String `type`__


<a id="typeBinderOptions"></a>
### BinderOptions

An options object that can be passed as the final argument to
the `obBinder` factory to help facilitate model synchronization.

#### Properties

 * __BinderType `type`__
 * __String `key`__
 * __* `query`__

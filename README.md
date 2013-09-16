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

Currently, the `OmniBinder` toolchain is focused on supporting synchronization of arrays of objects, but will eventually have a good story for other types of data.

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

Using the `obBinder` factory creates a new binding instance. The factory takes the following arguments:

 * __scope__ (scope instance: required) - The scope in which to watch the model.
 * __model__ (string: required) - Name of the model to watch on the provided scope.
 * __options__ (object: optional) -
   * __query__ (*: optional) - A query, if necessary. This is available as `binder.query` in any [Change Pipeline](docs/change-pipeline.md) functions, but is otherwise only used by some protocols.
   * __type__ (string: optional) - Should be one of constants available in [`binderTypes`](#binderTypes) service. This is useful to help protocols know how to analyze changes, but should be used as a best practice to take advantage of future enhancements to the `OmniBinder` module.
   * __key__ (string: optional) - If the model is a collection of objects, the key helps methods in the [Change Pipeline](docs/change-pipeline.md) by confirming which property in the collection should be unique.

Each `obBinder` instance is associated with one model in one scope. The `obBinder` should generally be treated as a static object, as far as the [Change Pipeline](docs/change-pipeline.md) is concerned. But it's useful to occasionally store temporary metadata or temporary data on a binder. For example, when model updates are being throttled, it would be appropriate to store a temporary queue of changes on the `binder` to be batched in a later call to a protocol.

The `binder` is accessible in every part of the [Change Pipeline](docs/change-pipeline.md).

<a id="delta"></a>
### delta

A new `delta` object is created each time a change is registered from a local model or protocol. The `delta` is passed to every method in the [Change Pipeline](docs/change-pipeline.md). The only required property of a delta is `changes`, which is an array of `Object.observe` or `Array.observe` changes to be processed by a model or protocol.

## Services

### obBinder

`obBinder` is a factory whose instances can be used in any scope to bind any of the scope's models to a protocol.

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
var binder = obBinder($scope, 'myModel', {
  type: binderTypes.COLLECTION
});
```
# OmniBinder

__One binder to bind AngularJS models to everything.__

__Status__: _Experimental, In-Development._

Currently, the only supported use case is binding arrays of objects to a protocol.

<a id="overview"></a>

## Overview

The `OmniBinder` module is a framework to enable realtime data synchronization between AngularJS apps and various [protocols & persistence layers](#protocol).

The module is built to be flexible enough to support arbitrary protocols to react to in-memory model changes.
Building a re-usable protocol is a matter of implementing the [interface](docs/module-api.md#iprotocol) expected by the `obBinder` service, then managing the details of reading, subscribing to, and writing to the persistence layer underneath. For example, a protocol could be written for HTML5 LocalStorage, a REST API, an API using WebSockets, or any combination of arbitrary technologies underneath.

`OmniBinder` provides the following tools to make two-way data binding simple:

 * Bind scope models directly to a protocol, based on an optional protocol-specific [query](#binder).
 * [Change Pipelining](docs/change-pipeline.md): Bi-directional change pipelining supports writing of middleware-like functions to operate on a [`delta`](#delta) object in order after a change is registered from a local model or a protocol.
 * Small libraries with utility methods to add common processing to [Change Pipelines](docs/change-pipeline.md), such as [throttling](#throttler) and change batching (not yet implemented).

Currently, the `OmniBinder` toolchain is focused on supporting synchronization of arrays of objects, but will eventually have a good story for other types of data.

<a id="protocol"></a>
# Protocol

The underlying power of `OmniBinder` is in the protocols that can be developed to power it. The `obBinder` service manages watching models for updates, executing the developer-specified [Change Pipeline](docs/change-pipeline.md), and calling appropriate methods on a protocol when the [Change Pipeline](docs/change-pipeline.md) is complete. Once all functions in a model's [Change Pipeline](docs/change-pipeline.md) have been called, the `obBinder` service will send the delta to the `processChanges` method of the protocol.

## Problems to Solve with this framework.

 * Marshalling data changes between models and protocols.
 * Implementing a robust, bi-directional change intercept API. ([proposal](docs/change-pipeline.md))
 * Standardizing a realtime data sync & caching strategy.
 * Represent binary streams in Angular.
 * Allowing interaction with large sets of remote data without loading all data into memory.

## Design Proposals

 * [Change Pipeline](docs/change-pipeline.md)
 * [Observation Strategies](docs/observation-strategies.md)
 * [Stretch Protocol](docs/stretch-protocol.md)

## Todos App
TODO

## Getting Started

[OmniBinder API Reference](docs/module-api.md)

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

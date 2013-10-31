# OmniBinder

__One binder to bind AngularJS models to everything.__

__Status__: _Experimental, In-Development._

Currently, the only supported use case is binding arrays of objects to a protocol.


<a id="overview"></a>
## Overview

The `OmniBinder` module is a framework built on top of AngularJS to enable realtime data synchronization between AngularJS apps and various [protocols & persistence layers](#protocol).

The module is built to be flexible enough to support arbitrary protocols to react to in-memory model changes.
Building a re-usable protocol is a matter of implementing the [interface](docs/module-api.md#iprotocol) expected by the `obBinder` service, then managing the details of reading, subscribing to, and writing to the persistence layer underneath. For example, a protocol could be written for HTML5 LocalStorage, a REST API, an API using WebSockets, or any combination of arbitrary technologies underneath.

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

`OmniBinder` provides the following tools to make two-way data binding simple:

 * Bind scope models directly to a protocol, based on an optional protocol-specific [query](#binder).
 * [Change Pipelining](docs/change-pipeline.md): Bi-directional change pipelining supports writing of middleware-like functions to operate on a [`delta`](#delta) object in order after a change is registered from a local model or a protocol.
 * Small libraries with utility methods to add common processing to [Change Pipelines](docs/change-pipeline.md), such as [throttling](#throttler) and change batching (not yet implemented).

Currently, the `OmniBinder` toolchain is focused on supporting synchronization of arrays of objects, but will eventually have a good story for other types of data.


## Problems to Solve with this framework.

 * Marshalling data changes between models and protocols.
 * Implementing a robust, bi-directional change intercept API. ([proposal](docs/change-pipeline.md))
 * Standardizing a realtime data sync & caching strategy.
 * Represent binary streams in Angular.
 * Allowing interaction with large sets of remote data without loading all data into memory.
 * Handling Errors associated with applying bi-directional changes
 * Resilience in the absence of reliable network connectivity

## Design Proposals


### Syndicating Data Changes

Moving models between client and server is easy. Passing rapidly-changing models around is less easy. Passing changesets to be applied to rapidly-changing models is difficult. Passing changesets to be applied to rapidly-changing models in an interceptable and transformable way is more difficult.

The Change Pipeline aims to solve this problem by implementing a standard,
bi-directional pipeline through which all changes will pass.

[Change Pipeline Proposal](docs/change-pipeline.md)


### Observing Local Model Changes

To dirty-check or not to dirty-check, that is the question.

The OmniBinder framework is presently using Object.observe and Array.observe
to notify of model changes and provide change summaries. However, even with
these natively-implemented APIs, certain use cases still require putting some
thought into balancing performance with usability.

Read how observation is presently implemented in Omnibinder.

[Observation Strategies](docs/observation-strategies.md)


### Preventing Recursive Model Updates

Many realtime-oriented backend implementations allow registering
for updates of changes to models on the backend. These updates
usually will notify the client of the change, even if the client
initiated the change.

The client needs to somehow know not to apply the change to the
model, since the model already has the change.

The inverse of this problem is the same: `Object.observe` will
notify of a change to a local model, even if the protocol was
the source of the change.

[Recursion Prevention](docs/recursion-prevention.md)


### Standardizing Distributed Data

OmniBinder's primary goal is to provide a small framework with a simple
API that makes it easy to write custom protocols to manage transportation
of data over network protocols like HTTP and WebSockets.

Beyond this goal, contributors to the project are collaborating on forming
a flexible standard underneath, with the goal of being able to write a single
protocol adapter to work with several backend providers.

[Stretch Protocol Draft](docs/stretch-protocol.md)


### Intelligent Error Handling

### Handling Network Flakiness

In an ideal realtime application, data changes would constantly
flow in all directions with zero latency, and with a definitive
history of yet-to-be and already-applied model changes.

Unfortunately, distributed computing knows not such a scenario.
Applications must be resilient enough to withstand periods of
network absence or flakiness, with flexible strategies provided by the
underlying data synchronization framework (OmniBinder) to
handle such inconveniences in the most user-appropriate
and data-appropriate way possible.

[Network Resiliency Proposal Draft](docs/network-resiliency.md)


## Todos App

The project contains a basic Todo application running with a bundled [deployd](http://www.deployd.com) API.

(Note: This demo is broken at HEAD because of refactoring. Last working SHA is d5fb82b7ebf2395706448a3d7d6a1117962ed1b5)

To run the app, make sure you have installed:

 * [MongoDB](http://mongodb.org)
 * [Node](http://nodejs.org)
 * npm install -g deployd

Open the api directory in Terminal, and run the `dpd` command.
Open two browsers and point them to localhost:2403, then start creating/updating/archiving
todos to see both browsers stay in sync.

## Make a Protocol

See the [OmniBinder API Reference](docs/module-api.md) for documentation
to make a protocol that works with OmniBinder, and integrate it into an app.

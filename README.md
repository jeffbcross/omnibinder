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


## Getting Started

_Simple Example_

    app.controller('MyCtrl', function ($scope, $syncResource, someProtocol) {
      $scope.myProducts = [{title: 'Widget'}, {title: 'Doodad'}];

      var myProtocol = someProtocol({url: 'http://myhost'});
      var mySyncResource = $syncResource({protocol: myProtocol});
      var binder = mySyncResource.bind({
        scope: $scope,
        model: 'myProducts'
      });
    });

_Robust Example_

    app.controller('MyCtrl', function ($scope, $syncResource, $differ, $throttler, someProtocol) {
      var myProtocol = someProtocol({url: 'http://myhost'});
      var mySyncer = $syncResource({protocol: myProtocol});
      var myQuery = {
        path: '/path/to/stuff'
      };

      var binder = mySyncer.bind({
        scope: $scope,
        model: 'myModel',
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

### $differ

### $throttler

## IProtocol

## Entities

### binder

### delta



## Change Pipeline
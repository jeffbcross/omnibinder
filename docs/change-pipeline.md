### Change Pipeline (Draft)

(see [Readme](../README.md) for problem description)

## Status: Proposal (Not Implemented)

The Change Pipeline gives the ability write application-specific
processing logic for data as it changes locally or from a protocol.
When binding to a model, the `obBinder` factory can accept an options
object with `onModelChange` and `onProtocolChange` methods or arrays
of methods, which will be executed in order each time a change occurs.
This enables developers to write or re-use middleware-like functions
to examine and manipulate `delta` objects as they progress through the Change Pipeline.

Each function in the change pipeline should implement the same signature,
`binder, delta, next`, where `binder` is the `obBinder` instance,
`delta` is the object containing the `changes` array to be processed,
and `next` is the function to be called after this middleware is complete.

Example Implementation

```
function logChanges (binder, delta, next) {
  console.log(delta.changes);
  next();
}

var binder = obBinder($scope, 'myModel', {
  onModelChange: [logChanges],
  onProtocolChange: logChanges
});
```

This design allows middlewares to be asynchronous,
and optionally cancel execution of a change pipeline.
This ability is particularly useful for applications of change batching,
change throttling, operational transformation, among other applications.

Protocol authors can recommend that Change Pipelines not be used with their protocols,
and that the protocol should be trusted to do all the heavy lifting of processing a model change.
But for protocols that allow some flexiblity in how data is persisted,
the Change Pipeline is the right context in which to make those decisions.

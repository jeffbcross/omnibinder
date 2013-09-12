### Change Pipeline

## Status: Design (Not Implemented)

The Change Pipeline gives the ability write application-specific processing logic for data as it changes locally or from a protocol. When binding to a model, the `binder` factory can accept an options object with `onModelChange` and `onProtocolChange` methods or arrays of methods, which will be executed in order each time a change occurs. This enables developers to write or re-use middleware-like functions to examine and manipulate `delta` objects as they progress through the Change Pipeline.

Protocols can recommend that Change Pipelines be ignored, and that the protocol should be trusted to do all the heavy lifting of processing a model change. But for protocols that allow some flexiblity in how data is persisted, the Change Pipeline is the right context in which to make those decisions.

The Change Pipeline is particularly useful for applications of change batching, change throttling, operational transformation, among other applications.
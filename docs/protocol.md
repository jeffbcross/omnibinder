<a id="protocol"></a>
# Protocol

The underlying power of `OmniBinder` is in the protocols that can be developed to power it. The `obBinder` service manages watching models for updates, executing the developer-specified [Change Pipeline](docs/change-pipeline.md), and calling appropriate methods on a protocol when the [Change Pipeline](docs/change-pipeline.md) is complete. Once all functions in a model's [Change Pipeline](docs/change-pipeline.md) have been called, the `obBinder` service will send the delta to the `processChanges` method of the protocol.

<a id="iprotocol"></a>
## IProtocol

If a protocol would like to take advantage of opt-in policies provided by `OmniBinder`, in can implement the following supported methods.

 * __processChanges(binder, delta)__ - Takes a delta with an array of `Object.observe` or `Array.observe` changes, and applies them to the protocol's version of the model
 * __subscribe__ - This method is called as soon as `obBinder.bind` is called, in order to get an initial value for the model and to automatically update the model upon further changes in the persistence layer. Implements signature `function (binder, callback) {}`, and calls `callback` each time a relevant update occurs. Ideally, the protocol will be able to provide some initial data on the `delta`, such as the type of change, and of course, some representation of the changed data.
 * __unsubscribe(binder, callback)__ - Called when a bound scope is destroyed or when `obBinder.unbind()` is called.


Protocols make use of the `query` object attached to a `binder` to ensure that the data is being persisted properly. Queries may contain a URL path to a resource on a server, an id of a particular object, or filters to restrict changes to certain items. `obBinder` has no policy on what type of object a query is, or what properties it contains. The extent of the policy is that if different models should be treated differently by a protocol, the place to store the instructions is on `binder.query`.

The protocol interface is still being actively developed, and will change.

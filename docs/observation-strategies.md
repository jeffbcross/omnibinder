# Local Observation Strategies

(see [Readme](../README.md) for problem description)

## General Approach
[Object.observe](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)
and Array.observe set the standard for how changes to models
are syndicated between models and protocols in OmniBinder.

## Use Case: Observing Arrays of Objects

In JavaScript, an array of dictionary-like objects
is simply a list of references to objects,
not an actual container of objects and their data.
However, an application will commonly treat arrays of objects as a single data structure,
providing all access to child objects through the array,
and maintaining no reference to its child objects outside of the array.

Arrays of objects are also one of the most common data formats
returned from APIs and databases, for example:

GET /todos
```javascript
//Response
[
  {
    done: false,
    text: 'do this'
  },
  {
    done: true,
    text: 'do that'
  }
]
```

Therefore, this framework should strive to allow arrays
of objects to be bound and observed without leaving the
developer to manage observation of children objects within an array.

### Technical Challenges

#### 1: Observing Child Changes

Unfortunately, using Array.observe to watch an array will only
notify of a change when the array itself has been mutated.
E.g., when an item has been added or removed from the array.
When an object within an array changes, Array.observe does not notice.

The implemented solution to this problem is to use Object.observe
to observe each child object in an array,
to at least notify of a change to a child object in the array.
How the observed change gets syndicated is another challenge.

#### 2: Syndicating Child Changes

There are two primary options for syndicating a change to a child object:

 1. Translate the Object change into an Array change (e.g. a splice removing
    the old version of the object and adding the new version of the object)
 2. Syndicate the Object change directly, outside of any context of the containing array.

Option #2 is the most ideal approach,
but may not always be practical as in some cases the
only way of getting a reference to an object in a protocol
is to know its position in the overall collection of objects.

_Proposed Solution:_ Use option two if a "key" was provided to the binder,
which specifies which property within a collection is unique,
and should be sufficient for a protocol to update an object
without knowledge of the object's position in the local model.
If no key is provided, rely on option one to treat the change
as a splice in an array.


#### 3: Observing Deep Child Changes

Even if objects within an array are observed,
only changes to top-level properties within an object are actually observed,
for the same reason that objects within arrays are not observed with Array.observe.

Changes to obj.foo.bar will not be observed in the following example.

```javascript
var obj = {
  foo: {
    bar: 'baz'
  }
}
Object.observe(obj, someFunction);

obj.prop = "new property";
// Notified with change: [{name: "prop", type: "new", object: {foo: {bar: "baz"}, prop: "new property"}}]

obj.foo.bar = 'hello';
//No notification.
```

Given this challenge, we have the following options:

 1. Only observe top-level properties of objects,
    ignoring changes to objects within the observed object.
 2. When initially observing an object,
    and whenever an object notifies that a top-level property has been assigned an object,
    also observe the child object and all of its children,
    and treat the change as if the top-level property on the root
    observed object had changed.

    For example:

```javascript
var obj = {
  foo: {
    bar: 'baz'
  }
}
obj.foo.bar = 'hello';
// Would notify of change on obj: {type: 'update', name: 'foo', object: {foo: {bar: 'hello'}}, oldValue: {bar: 'baz'}}
```

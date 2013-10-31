# Recursion Prevention Proposal (Draft)

(see [Readme](../README.md) for problem description)

OmniBinder needs to have a strategy (or strategies)
to know how to ignore changes that it has already
processed. Consider this workflow:

 * User deletes a row in a table
 * Object.observe sees change, notifies OmniBinder
 * OmniBinder syndicates change to protocol, which
	deletes the row at the specified index on
	the backend.
 * The protocol notifies OmniBinder than an item
 	was removed at a given index
 * OmniBinder syndicates the change to the local
 	model, and removes the item at the given
	index.
 * Repeat

## Potential Strategies

 * Change Counting
 * Changed item counting
 * Change Object Comparison
 * Change type & name/index comparison
 * Adding and persisting metadata to changed items
 * It's the protocol's problem
 * Probability determination using combination of above

### Change Counting

For each Binder instance, maintain one count of changes
from the protocol, and one from the model. For each change
from the other direction, decrement the count until 0 and
ignore the change.

The primary flaw with this approach is that a single change
can affect multiple items. E.g. an array change can look
like this:

```javascript
{
	index: 1,
	removed: [{foo: 'bar'}, {bar: 'baz'}, {baz: 'foo'}],
	addedCount: 5
}
```

That change would affect 8 items (5 added, 3 removed). If the
original change from the other direction had looked like this:

```javascript
{
	index: 1,
	removed: [{foo: 'bar'}],
	addedCount: 0
}
```

then with this strategy, I would not apply any of the other operations
from the new change.

### Changed Item Counting

### Change Object Comparison

### Change Type & Name/Index Comparison

### Adding & Persiting Change MetaData to Models

### It's the Protocol's Problem

The easiest solution to this problem would be to leave
it up to each protocol to

### Probability Determination Using Combination of Above Strategies



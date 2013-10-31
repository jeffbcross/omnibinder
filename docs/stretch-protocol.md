# Stretch: A protocol for the Realtime Web. (Draft)

(see [Readme](../README.md) for problem description)

## Why a New Protocol?

 * Existing protocols (like REST) are server-centric,
not acknowledging the new capabilities of browser-based
applications (such as new client-side storage capabilities,
new transport capabilities).
 * Most protocols are concerned with transactional relationships
   between client and server, and ignore how data is handled in the client.

## Open Questions

 * Should data formats be formalized? JSON?
 * How opinionated should the resource locations be?
 * How should change sets be standardized? Object.observe & Array.observe?
 * Determine how to handle binary in the browser.
   Consider BSON as default wire format?
   Can support images, audio, streams out of the box.


## Spec Proposal

 * Principle 1: Contract between Program > Persistence, not client > server
 * Principle 2: Stateful.
   Since changes happen frequently, smaller payloads are advantageous,
   which means some state assumption between peers is okay.
 * Principle 3: Valid Cache.
   Program cache should be intelligently stored in client,
   and should not always depend on network connectivity
   to make data available to the program.
   The cache should be intelligent so as to not hide
   the fact that cached data may be stale.
 * Principle 4: Deltas & Data (See Data Elements in ReST).
   The protocol supports full data access, but is adept at communicating
   changes and deltas in data to all peer connections.
   When a program connects to the protocol,
   it needs all applicable data,
   but will only need to know about changes to that data after that,
   rather than receiving full representations of the data.
 * No explicit verbs; all intentions should be represented in change objects
   sent over the wire.
 * Protocol should focus on supporting HTTP and WebSockets as transport.
 * Any end point can be represented by a loosely-standardized query object,
   which can also be serialized as a URL.
   URLs were designed for a static internet,
   and not all change requests are made over HTTP.
   Not all queryable data is at at a canonical URL,
   such as collection filters that want to filter a
   collection by price between 0 and 5.

## Classifications of Entities in the Realtime Web

 * Models
 * Streams
 * States

## Example Implementations

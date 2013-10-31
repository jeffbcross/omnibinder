# Network Resiliency Proposal (Draft)

(see [Readme](../README.md) for problem description)

## Goals

Provide a means for application developers
to implement a reasonable strategy to account
for less-than-ideal network conditions experienced
by users of an application.

## Constraints

 * OmniBinder should focus more on providing means to react
   to bad network conditions, less on fully-baked solutions.
 * Solutions must be protocol-agnostic
 * Any included strategies must be optional


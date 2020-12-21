# 2. use jest instead of ava

Date: 2020-12-21

## Status

Accepted

## Context

Although `ava` is used predominantly across repositories, `jest` is far more commonly used and enjoys broader support in
IDEs and associated tooling. For example, Webstorm has out-of-the-box debugger support for `jest`, but not for `ava` and
many jest test runners exist for VSCode.

## Decision

`ava` presents a nicer API, with smooth support for async and related constructs such as reactive streams, however
the benefit of `jest`'s broader tooling support outweighs this.

As a result of discussion with @tony and with support from @pekka, we'll prefer `jest` over `ava` and begin
switching repositories to `jest`, starting with this one, unless `ava` is specifically required.

## Consequences

We accept that our tests will become slightly more verbose and slightly less performant, and that many codebases
will have to be converted to `jest`.

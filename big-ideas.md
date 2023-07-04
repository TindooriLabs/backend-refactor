# Big Ideas

Feel free to add more ideas!

## Structuring code

`domain` should be barebones business logic and everything else abstracted away
(except suitable uniform encodings that are not boilerplates).

`routes` should be a generic wrapper, or a few such, or if we cannot accomplish
this via simple wrapping, either we merge it with `domain`, or we make sure it
is pure boilerplate that has to do with routing.

## Structuring APIs

API endpoints should have names corresponding to exported functions of
`domain`, as well as a version number (such as `/api/v1/createUser` instead of
`/auth/email`; we don't have to change this right now, especially to maintain
consistency with existing IOS app). The `domain` function names *themselves*
should be self-documenting.

Following from the previous point, within the defined vertical organization of
the backend, only API endpoints confined to a single vertical organization *by
definition* should be able to receive groupings (`/api/version/group/name`
instead of `/api/version/name`, such as `/api/v1/auth/loginWithAIDForJWT` but
`/api/v1/createUser`) (Should this be extended to the organization of the code
below `domain`?)

## Code style

The code style for one-use functionalities should avoid helper functions and
prefer commenting sections of functions. If using an ORM, prefer directly
including the ORM query logic inside `domain` instead of using wrapper
functions that encapsulate it. The exception is when a functionality is reused
and has a well-defined intuitive meaning, upon which a helper function or
library function should be created for it.

# Summary of functionality

## User

A *user* is an abstract role that intend to correspond to a real-world person
using the Tindoori app. Except in the creation of a user, all clients of
Tindoori API must assume the role of a user and provide proof that they do
represent the said user (a.k.a. authenticate).

## (Server) App State

The *app state* of interest to us refers to that of this API server, not that
of the iOS app itself. The app state is queried or modified given queries from
the API clients, sometimes supplied with a user as parameter.

## Invariants

Different *invariants* are held for each query or modification. For example,
making sure that the user exists and represents a real person, and that the
client can actually represent the said user, is a kind of invariant that is
often checked before anything is done; the user's number of images staying
below the app limit is another invariant, but is only checked when the images
are modified.

## Authentication

We need to at least support email-password authentication and JWT
authentication, to remain compatible with the front end. There is plan to
additionally incorporate OAuth.

Issue: email field is not used except for uniqueness; is mobile uniqueness
checked?

The password had been stored encrypted in the old API code; we can continue to
do that.

A client is authorized if and only if they provide an existing user, a proof
of association to the user, and if the user is a real person.

JWTs are not stored.

Mobile verification codes are stored. Users should be able to ask for new
verification codes, with a time-out.

## User Information

There isn't a clear reason why user preference and profile need to be stored
separately; afterall, they are both associated with a single user and displayed
to other users, and both participate in creating a user's feed. (See old API
`domain/preferences.js@findProfiles(...)`.)

User information that is currently being tracked include name, birth date,
gender identity (just one), sexuality & genders-of-interest (duplicate fields),
ethnicity (very limited for a cultural exchange app), location, hometown,
status, subscription tier, karma score, bio, interests, prompt responses, and
images.

We kinda need to support individual modification of each field. Additionally,
certain fields are apparently deletable acc. to the old code. These include
interests, prompt responses, images, and sexualities.

Users may query detailed information of another user, provided that they can
present the ID of that user. (This is a point supporting the use of UUIDs as
user IDs.)

Premium users can bulk-query information of users who have liked them and
filter the result. (Currently, they cannot set filters for individual queries,
but can modify their own info temporarily, which would then be used for
filtering. I don't like this.)

## Notifications

Supposedly, you notify the relevant user, and that's it. In reality,
complications first arise when the app makes a distinction between sending
in-app notifications (SocketIO) to online users and sending system
notifications to offline users. To further complicate things, system
notification APIs differ for iOS (APN) and Android (???) users. Currently,
the app assumes that all users use iOS devices, and each user's Apple Device ID
is an extra piece of information that is collected, unknown to the user and
shown nowhere.

And it doesn't stop here. With aspirations for scalability, the app strives to
allow load-balancing between multiple servers. SocketIO is the only part of the
app that doesn't scale smoothly to multiple servers, because every connection
(real via websocket or virtual via session ID) is formed with one particular
server and not shared between them. See
https://socket.io/docs/v4/using-multiple-nodes/ . SocketIO is also used for
messaging, which makes the situation even worse, since two users in the same
chat may not share a SocketIO server, and thus be unable to find each other.

Notifications should almost not be considered part of the app state; it's pure
side-effect.

## Translations

There is a translation cache for every message-language pair with an
expiration, that's it. Whether "message" should be identified by its ID or its
text content is to be discussed later.

## Matching

A user can (null), like, skip, or unmatch (when matched) another user. Two
users are matched if and only if they both like each other. A user *x* can only
show up on *y*'s like-me list if *x* has (null) or liked *y*, and *y* has only
ever (null)'ed *x*. This is the current behavior. Does it make sense tho? Mm...

Previously, we stored "aggregate" types (match or not) along with directional
choices (like or skip), thus had to maintain the above invariant. It was done
terribly and clearly untested.

## Messaging

Messages are organized into conversations. Each conversation has a fixed list
of one or more users and a growing list of zero or more messages.

A user can send a message to a conversation which they're part of. Everyone
except the sender should be notified of the new message.

A user can also view a contiguous subsequence of all messages, or a list of
conversations. Each conversation currently caches the last message for preview.
It perhaps should be done differently, e.g. caching the message ID instead to
make sure the translation caches match.

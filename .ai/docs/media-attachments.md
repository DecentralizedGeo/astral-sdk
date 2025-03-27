# Media Types

Users have the capability to attach a diverse range of media types to a location proof. This functionality is powered by the use of MIME
types, allowing for the inclusion of various data formats such as photos, videos, audio, URLs, LIDAR scans, point clouds, and more. This
section provides an overview of the media types we aim to build support for, their MIME types, and considerations for their use.

:::warning

This is the alpha version and is subject to change!

:::

## Media structure

Currently, the location proofs we're registering on EAS have two fields related to media:

- **`mediaType`**: an array of strings, each a unique designator of the media attached, to ease parsing when location proofs are read
- **`mediaData`**: an array of strings containing some kind of media identifier, likely a
  [CID](https://docs.ipfs.tech/concepts/content-addressing/)

Of course, elements in each array correspond according to index.

In this way, any set of media data can be attached to a location proof. This opens use cases such as geotagged photos and videos, dMRV data
for impact / regeneration projects, etc.

:::note

Data included in the media fields should NOT be required for the location proof strategy. For example, if a strategy used photos of the
surrounding area (i.e. of known landmarks), this data should be included in the proof recipe.

:::
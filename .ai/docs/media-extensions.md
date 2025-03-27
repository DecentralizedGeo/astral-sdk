---
id: media-extensions
title: Media Extensions Library Overview
sidebar_label: Media Extensions
---

# Media Extensions Library Overview

The Media Extensions Library is a core component of Astral's Location Proof Protocol, designed to provide a standardized way to handle various media types that can be attached to location proofs. This Media Extensions Library leverages existing MIME types as identifiers, making it compatible with web standards while ensuring flexibility for extending to specialized media formats.

## Overview

Each media format is defined by a MIME type identifier (included in the `mediaType` attribute). In the `media` attribute, a payload can be found that contains the media data or a reference to it. This approach enables:

- **Standardization:** Using established MIME types ensures compatibility with existing systems.
- **Interoperability:** A consistent interface allows different systems to interpret and process media data uniformly.
- **Flexibility:** Support for various media categories including images, videos, audio, and documents.

In v0.1 of the Astral SDK, media can be embedded directly or referenced via external storage mechanisms (like IPFS) depending on size and application requirements.

## Media Type Identifier Conventions

The **Media Type Identifier** is simply the standard MIME type of the media. This leverages the existing MIME type system, which is:

- **Standardized:** Widely recognized and supported across platforms
- **Extensible:** Allows for vendor-specific extensions when needed
- **Hierarchical:** Organized by primary type (image, video, audio, etc.) and subtype

The general structure of a MIME type is:

`<primary_type>/<subtype>[+<suffix>]`

Where:
- **`primary_type`:** Indicates the general category (e.g., `image`, `video`, `audio`, `application`)
- **`subtype`:** Specifies the exact format (e.g., `jpeg`, `png`, `mp4`, `pdf`)
- **`suffix` (optional):** Provides additional format information (e.g., `+xml`, `+json`)

### Media Type Identifiers

| Category | Primary Type | Common Subtypes | Full Identifier Examples | v0.1 Support | Additional Details |
|----------|-------------|-----------------|--------------------------|--------------|-------------------|
| Images   | `image`     | `jpeg`, `png`, `gif`, `webp`, `tiff`, `svg+xml` | `image/jpeg`, `image/png`, `image/svg+xml` | Limited Support | Standard web image formats; SVG supports vector graphics |
| Videos   | `video`     | `mp4`, `webm`, `ogg`, `quicktime` | `video/mp4`, `video/webm` | Limited Support | Common video formats for web and mobile |
| Audio    | `audio`     | `mp3`, `wav`, `ogg`, `aac` | `audio/mpeg`, `audio/wav` | Limited Support | Standard audio formats |
| Documents| `application` | `pdf`, `msword`, `vnd.openxmlformats-officedocument.wordprocessingml.document` | `application/pdf` | Limited Support | Document formats, with PDF as primary supported type |
| 3D Models | `model`    | `gltf-binary`, `gltf+json`, `vnd.usdz+zip` | `model/gltf-binary` | Future | 3D model formats for AR/VR applications |
| Point Clouds | `application` | `vnd.las`, `vnd.e57` | `application/vnd.las` | Future | Specialized formats for LiDAR and 3D scanning |
| Sensor Data | `application` | `octet-stream`, `json` | `application/json` | Future | Raw or structured sensor data |

## Handling Different Media Types

### Direct Embedding vs. References

Media in location proofs can be handled in two primary ways:

1. **Direct Embedding** (for smaller media):
   - Base64-encoded media included directly in the `media` field
   - Suitable for thumbnails, small images, or metadata

2. **External References** (for larger media):
   - The `media` field contains a URI (typically an IPFS CID (preferred) or HTTP URL)
   - Recommended for videos, high-resolution images, or any large media files

### Implementation Considerations

When working with media in location proofs:

- **Size Limits:** Consider bandwidth and storage implications; use external references for media exceeding 1KB, depending on the chain + gas costs
- **Content Verification:** Include content hashes for externally referenced media to verify integrity (not relevant for CID-referenced media)
- **Privacy & Permission:** Consider privacy implications when linking media to locations
- **Metadata:** Where relevant, preserve metadata like EXIF data that may contain additional spatial information

## Extensibility and Future-Proofing

The Media Extensions Library's use of standard MIME types ensures flexible evolution:

- **New Formats:** As new media formats emerge, their standard MIME types can be incorporated
- **Custom Extensions:** For specialized use cases, vendor-specific MIME types can be defined
- **Multi-part Media:** Complex proofs with multiple media elements can be supported through collections or manifests

### Future Directions

In future versions, we're considering:

- Support for streaming media formats
- Enhanced metadata extraction and validation
- Specialized handling for AR/VR content and 3D spatial mapping

## Conclusion

The Media Extensions Library provides a robust framework for handling diverse media types within the Location Proof Protocol. By leveraging established MIME types, we ensure compatibility with existing systems while maintaining the flexibility to accommodate emerging media formats.

Using standard MIME types simplifies integration with existing tools and services while providing clear identification of media content types. This approach balances standardization with the extensibility needed for specialized applications.

For contributions, questions, or further discussions, please refer to our contributing guidelines and join our [community channels](https://t.me/+UkTOSXnDcDM5ZTBk). 
## Performance & Optimization Considerations  
Performance is important for developer adoption, though secondary to correctness and usability. We address performance at multiple levels:

- **Efficient Data Handling:** The SDK will avoid unnecessary heavy computations:
  - For offchain proofs: Signing operations are handled efficiently by the EAS SDK using ethers.js
  - For onchain proofs: Registration is optimized by using EAS's contract interfaces
  - Querying data involves network latency that we can't speed up directly, but we can implement efficient parallel fetching where appropriate. For example, if a user queries a large date range that the API splits into many pages, we might fetch a couple of pages in parallel to reduce total time (depending on Astral's allowances). If implementing automatic fetch-all, we can use `Promise.all` for a limited number of pages concurrently.

- **Tree Shaking & Bundle Size:** We aim to make the SDK as **tree-shakable** as possible so that applications only include what they use ([How to bundle a tree-shakable typescript library with tsup and publish with npm - DEV Community](https://dev.to/orabazu/how-to-bundle-a-tree-shakable-typescript-library-with-tsup-and-publish-with-npm-3c46#:~:text=)). This is particularly important with our dual workflow architecture:
  - Applications that only use offchain proofs shouldn't need to bundle code for onchain registration
  - Applications that only use onchain proofs shouldn't need to include offchain signing logic
  - By organizing code into separate modules with clear boundaries, bundlers can drop unused parts

  We will mark `"sideEffects": false` in package.json to assist this. Also, careful with polyfills – e.g., if we use `fetch`, we might conditionally import a polyfill only if needed (which a bundler could eliminate for browsers). Our choice of bundler (discussed later) will impact this but we intend to produce both ES and CJS outputs, with the ES output enabling dead code elimination.

- **Use of Web Workers or Async for heavy tasks:** Most SDK operations are I/O bound (network or signing). However, if we ever have to do a heavy compute (like verifying a complex proof or encoding a very large geojson), we will ensure it's done asynchronously. We might consider providing a convenience to run verification in a web worker (but that might be overkill at SDK level – the app developer can choose to offload if needed). For now, it's enough to keep functions non-blocking and quick.

- **Batching:** If the Astral API or EAS supported batch operations, we'd use them. For EAS:
  - Offchain: Batching multiple signatures could be efficient if the EAS SDK supports it
  - Onchain: EAS does allow multiple attestations in one transaction (if their contract supports an array input)
  
  For queries, if needing to get many specific UIDs, maybe we fetch all in one call by filter if possible (or GraphQL might allow an IN query). These are minor optimizations.

- **Memory Usage:** Use streams or iterative processing for large data sets:
  - For managing large collections of proofs, implement iterators that let users process them incrementally
  - Avoid loading everything into memory at once when dealing with paginated results
  - Handle large media efficiently by streaming rather than buffering entirely in memory
  
  We assume Astral might have pagination limits (like max 1000 per call ([OGC API Features Implementation | Astral Documentation](https://docs.astral.global/docs/api/ogc-api#:~:text=,01T00%3A00%3A00Z))). If needed, we can implement an iterator to let the user iterate through results without loading all at once into memory (e.g., a generator that fetches page by page). This kind of design is seen in AWS SDK or Azure SDK for list operations where they return a PagedAsyncIterable.

- **Lazy Initialization:** We won't initialize heavy components until needed:
  - The OffchainSigner isn't instantiated until the first offchain signing operation
  - The OnchainRegistrar isn't initialized until the first onchain registration
  - We won't fetch Astral config or schema until it's needed (but maybe fetch at start for convenience caching)
  
  This avoids unnecessary network calls in workflows that don't need them. If `AstralSDK` is created just to query proofs, we won't require an Ethereum provider or EAS initialization at all.

- **Parallelism in Proof Creation:** The SDK will support creating multiple proofs concurrently:
  - For offchain proofs: Multiple signing operations can happen in parallel
  - For onchain proofs: Multiple registration transactions can be sent concurrently
  
  The limiting factor may be the user's wallet (it might prompt for each or queue them). We will document that transactions should be handled one at a time for user clarity, but technically our SDK will not enforce a lock unless interacting with the same extension resource. E.g., if two calls both try to use the GPS extension's `collect()` at the same time, that might cause race conditions with device GPS hardware. That's an edge case; we might simply mention that in such cases, handle sequentially.

- **Profiling & Optimization:** During development, we will test the performance of key operations in both workflows:
  - Measure signing performance for offchain proofs
  - Analyze gas usage and transaction time for onchain proofs
  - Identify bottlenecks in either path and optimize accordingly
  
  If we find issues (like encoding with SchemaEncoder repeatedly), we might reuse an encoder instance or precompute things where possible. We'll ensure that adding the type safety doesn't add overhead at runtime (it usually doesn't, since interfaces and types are compile-time only).

- **Minimizing Dependencies and Size:** Using fewer libraries not only improves security but also performance (less code to load/parse). We avoid large utility libraries. For example, instead of lodash, use native JS. For geo calculations, we might use tiny libs if needed or simple formulas (but likely not needed since we rely on given data). The **limited dependencies approach** ([SDK Best Practices](https://www.speakeasy.com/post/sdk-best-practices#:~:text=4)) ensures we aren't bundling heavy unused code.

- **Bundler Optimization:** The choice between esbuild vs Rollup etc. will impact build speed and output size. This is more about our development speed (fast builds via esbuild/tsup help CI and dev iterations) vs final size (Rollup with terser might shave a tiny bit more and handle chunk splitting nicely). We'll compare them in the tech stack section, but either way, we will configure to optimize output for users: minified (for production builds), with source maps (for debugging), and dual module formats (so Node can use CJS without overhead, and modern bundlers use ESM with tree-shaking).

Overall, by minding these performance aspects, the SDK will be efficient enough for most use cases out-of-the-box. Our separation of offchain and onchain workflows will also allow for greater performance optimization, as applications can include only the parts they need. If extremely high performance is needed (e.g., verifying thousands of proofs per second server-side), users can always directly use lower-level components, but our focus is balanced performance with maximal convenience. For typical scale (tens or hundreds of proofs, or queries on the order of seconds), this SDK will perform well.
## **8. Documentation (Docs & Examples)**  
  *Description*: Create comprehensive documentation that clearly explains the architecture and guides developers through using both offchain and onchain attestation paths.
   
   - *Sub-tasks*:
     - [ ] **Core Documentation Files**:
       - [ ] Write a **README.md** that introduces the SDK:
         - [ ] Installation instructions via pnpm
         - [ ] Basic usage examples for both workflows
         - [ ] Quick reference for common operations
         - [ ] Clear explanation of offchain vs onchain workflows
         - [ ] Links to detailed documentation
       
       - [ ] Create **docs/architecture.md** explaining the design:
         - [ ] Detailed explanation of the architecture
         - [ ] Visual diagrams showing both workflows
         - [ ] Rationale behind design decisions
         - [ ] Component interactions and responsibilities
       
       - [ ] Write **docs/workflows/** directory with separate guides:
         - [ ] **offchain-workflow.md**: Building, signing, and using offchain proofs
         - [ ] **onchain-workflow.md**: Building and registering onchain proofs
         - [ ] **choosing-workflow.md**: How to decide which workflow to use
       
       - [ ] Create **docs/guides/** for practical tutorials:
         - [ ] **getting-started.md**: First steps with the SDK
         - [ ] **location-formats.md**: Using different location formats
         - [ ] **media-attachments.md**: Working with media data
         - [ ] **verification.md**: Verifying both proof types
         - [ ] **querying.md**: Retrieving proofs from Astral API
     
     - [ ] **API Documentation**:
       - [ ] Add comprehensive JSDoc comments to all public interfaces, classes, and methods:
         - [ ] Clear parameter descriptions
         - [ ] Return value documentation
         - [ ] Error scenarios
         - [ ] Usage examples
         - [ ] Workflow identification (offchain/onchain)
       
       - [ ] Configure TypeDoc to generate API reference
       
       - [ ] Create **docs/api-reference.md** with manual API overview:
         - [ ] Organized by workflow
         - [ ] Links to TypeDoc-generated docs
         - [ ] Common usage patterns
     
     - [ ] **Usage Examples**:
       - [ ] Create `examples/` directory with distinct example files:
         - [ ] **offchain-example.ts**: Complete offchain workflow example
         - [ ] **onchain-example.ts**: Complete onchain workflow example
         - [ ] **querying-example.ts**: Retrieving and filtering proofs
         - [ ] **browser-example.html**: Basic browser integration
       
       - [ ] Include examples that work with minimal setup
       
       - [ ] Add READMEs in example directories explaining setup and requirements
     
     - [ ] **Developer Documentation**:
       - [ ] Write **CONTRIBUTING.md** for contributors:
         - [ ] Development setup instructions
         - [ ] Testing procedures
         - [ ] Architecture guidelines
         - [ ] Pull request process
         - [ ] Coding standards
       
       - [ ] Create **docs/development.md** with:
         - [ ] Codebase structure explanation
         - [ ] Component interaction diagrams
         - [ ] Testing strategy
     
     - [ ] **Security Documentation**:
       - [ ] Add **docs/security.md** with:
         - [ ] Security best practices when using the SDK
         - [ ] Private key handling guidance
         - [ ] Location privacy considerations
         - [ ] Offchain vs onchain security implications
     
     - [ ] **Additional Documentation**:
       - [ ] Create **CHANGELOG.md** starting from v0.1.0
       - [ ] Add **LICENSE** file (MIT)
       - [ ] Include **CODE_OF_CONDUCT.md** for community interactions
   
   - [ ] *Output*: 
     - [ ] Comprehensive documentation that clearly explains the dual-workflow architecture
     - [ ] Working code examples for both offchain and onchain workflows
     - [ ] Complete API reference with JSDoc comments
     - [ ] Developer guidance for contributions and extensions
   
   - *Technical considerations*:
     - [ ] Ensure all code examples are tested and functional
     - [ ] Maintain clear separation between offchain and onchain workflows in all documentation
     - [ ] Use consistent terminology throughout documentation
     - [ ] Add diagrams where helpful for understanding the architecture
     - [ ] Include warnings about common pitfalls
     - [ ] Emphasize TypeScript benefits like autocomplete and type safety
     - [ ] Make documentation searchable and easy to navigate
     - [ ] Ensure examples work with the specified dependencies
     - [ ] Document multi-chain capabilities and limitations
     - [ ] Include security considerations appropriate to each workflow

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]
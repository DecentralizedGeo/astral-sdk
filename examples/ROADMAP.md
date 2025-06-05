# Examples Roadmap

This document outlines the planned expansion of code examples to support different developer personas and use cases for Astral SDK.

## Current Examples (v0.1.0)

- **hello-world.ts** - 30-second minimal working example
- **basic-workflows.ts** - Both offchain and onchain patterns with error handling
- **environmental-monitoring.ts** - Real-world use case with sensor data

## Future Examples Roadmap

### **Developer Personas to Support**

1. **GIS/Geospatial Developers (New to Web3)** - PostGIS integration, familiar spatial patterns
2. **Web3 Developers (New to Spatial)** - Wallet integration, simple spatial operations  
3. **Full-Stack Location App Builders** - End-to-end patterns, production architecture

### **Planned Example Categories**

#### **🚀 Getting Started (Simple → Complex)**
- [x] **hello-world.ts** - 30-second minimal example *(Implemented)*
- [x] **basic-workflows.ts** - Create, verify, error handling *(Implemented)*
- [ ] **production-starter.ts** - Environment setup, comprehensive error handling

#### **🔄 Workflow Patterns**
- [x] **environmental-monitoring.ts** - Hybrid workflow example *(Implemented)*
- [ ] **pure-offchain.ts** - High-volume, private data workflow
- [ ] **pure-onchain.ts** - Permanent records, smart contract integration
- [ ] **hybrid-advanced.ts** - Complex multi-workflow patterns

#### **🗺️ Spatial Use Cases** 
- [ ] **field-research.ts** - Archaeological sites, biodiversity surveys
- [ ] **infrastructure-management.ts** - Utility assets, transportation networks
- [ ] **administrative-boundaries.ts** - Zones, districts, protected areas
- [ ] **supply-chain-tracking.ts** - Origin verification, logistics

#### **🔧 Integration Patterns**
- [ ] **react-mapbox.tsx** - Frontend spatial mapping application
- [ ] **nodejs-api.ts** - Backend spatial data service
- [ ] **postgis-integration.ts** - Existing spatial database workflows
- [ ] **wallet-patterns.ts** - MetaMask, WalletConnect authentication flows

#### **⚡ Advanced Features**
- [ ] **media-attachments.ts** - Photos, documents, sensor data
- [ ] **batch-operations.ts** - High-volume data processing
- [ ] **performance-optimization.ts** - Large datasets, caching strategies
- [ ] **testing-patterns.test.ts** - Unit tests, integration tests

#### **🏗️ Architecture Examples**
- [ ] **microservice-api/** - Complete location attestation service
- [ ] **event-driven/** - Real-time location update patterns
- [ ] **compliance-reporting/** - Regulatory reporting, MRV use cases

### **Proposed Final Structure**

```
examples/
├── ROADMAP.md                    # This file
├── hello-world.ts               # ✅ Minimal 30-second example
├── basic-workflows.ts           # ✅ Core patterns with error handling  
├── environmental-monitoring.ts  # ✅ Real-world sensor use case
├── quick-start/
│   └── production-starter.ts    # Environment setup, error handling
├── workflows/
│   ├── pure-offchain.ts        # Gasless high-volume workflow
│   ├── pure-onchain.ts         # Blockchain-first workflow  
│   └── hybrid-advanced.ts      # Complex multi-workflow patterns
├── use-cases/
│   ├── field-research.ts       # Archaeological survey example
│   ├── infrastructure.ts       # Utility management
│   ├── boundaries.ts           # Administrative areas
│   └── supply-chain.ts         # Origin tracking
├── integration/
│   ├── react-mapbox.tsx        # Frontend mapping app
│   ├── nodejs-api.ts           # Backend service
│   ├── postgis-workflow.ts     # Database integration
│   └── wallet-patterns.ts      # Authentication flows
├── advanced/
│   ├── media-attachments.ts    # Photos, documents
│   ├── batch-operations.ts     # High-volume processing
│   ├── performance.ts          # Optimization strategies
│   └── testing.test.ts         # Testing patterns
└── architecture/
    ├── microservice-api/        # Complete service example
    ├── event-driven/            # Real-time updates
    └── compliance/              # Regulatory use cases
```

## Development Principles

When expanding these examples:

1. **Accuracy First** - All examples must use actual SDK capabilities, no hallucinated features
2. **Global Diversity** - Use coordinates from around the world, not just Global North
3. **Professional Use Cases** - Focus on spatial data infrastructure, not social app patterns
4. **Real-world Relevance** - Examples should reflect actual use cases developers will build
5. **Progressive Complexity** - Start simple, build up to production-ready patterns
6. **Cross-linking** - Examples should reference relevant documentation sections

## Implementation Priority

**Phase 1** (v0.1.0): ✅ **COMPLETED**
- Hello world example
- Basic workflow patterns  
- One real-world use case

**Phase 2** (v0.2.0):
- Production starter with environment setup
- Pure workflow examples (offchain/onchain)
- Additional spatial use cases

**Phase 3** (v0.3.0):
- Integration patterns (React, Node.js, PostGIS)
- Advanced features (media, batch operations)
- Testing strategies

**Phase 4** (v1.0.0):
- Complete architecture examples
- Performance optimization patterns
- Compliance and regulatory examples

## Contributing Examples

When contributing new examples:
- Follow the established patterns and naming conventions
- Include proper error handling and environment setup
- Use diverse global coordinates and realistic spatial data
- Add clear comments explaining spatial concepts for Web3 developers
- Add clear comments explaining Web3 concepts for spatial developers
- Test examples work with actual SDK installation
- Reference relevant documentation sections
# Astral SDK Style Guide

## Writing Philosophy

**Calm, clear, collected, cool.**

Our communication reflects the precision and reliability of our technology. We write with the confidence that comes from building something that actually works.

## Web3 Philosophy

Web3 is not about hype, speculation, or revolutionary rhetoric. It's about **utility**. 

We're building practical tools that solve real problems using decentralized infrastructure. Location attestations aren't "the future" - they're useful today for developers who need cryptographic proof of location data.

**Our stance:**
- Focus on utility over ideology
- Demonstrate value through working code
- Let the technology speak for itself
- Avoid Web3 jargon and buzzwords
- Treat blockchain as infrastructure, not a movement

## Tone & Voice

### Calm
- Never use exclamation points except for genuine excitement about functionality
- Avoid hyperbolic language ("revolutionary," "groundbreaking," "game-changing")
- Present capabilities matter-of-factly
- Use measured, confident statements

### Clear
- Lead with what the user can accomplish
- Use concrete examples over abstract concepts
- Prefer simple words over complex ones
- Structure information hierarchically

### Collected
- Organize information logically
- Address obvious questions before they're asked
- Provide context for technical decisions
- Acknowledge limitations honestly

### Cool
- Understated confidence over loud promotion
- Technical precision over marketing speak
- Show rather than tell
- Let quality work build reputation

## Language Guidelines

### Do Use
- **Active voice**: "Create location attestations" not "Location attestations can be created"
- **Present tense**: "The SDK handles validation" not "The SDK will handle validation"
- **Specific verbs**: "generates," "validates," "signs" vs. "processes," "handles," "manages"
- **Technical precision**: "EIP-712 signature" not "cryptographic signature"

### Avoid
- Emojis (except in very casual contexts like Slack)
- Web3 buzzwords: "revolutionary," "paradigm shift," "web3 native," "trustless"
- Marketing superlatives: "best," "fastest," "most secure"
- Unnecessary complexity: "utilize" → "use," "implement" → "add"

## Documentation Structure

### README Pattern
1. **What it does** (one clear sentence)
2. **Why it's useful** (concrete benefits)
3. **How to start** (30-second example)
4. **How it works** (brief explanation)
5. **Where to learn more** (organized links)

### Code Examples
- Always include imports
- Use realistic variable names
- Show complete, runnable examples
- Include error handling when relevant
- Comment only what's not obvious

### API Documentation
- Start with purpose, not parameters
- Include minimal working example
- Show expected input/output
- Link to related methods
- Note any important constraints

## Technical Writing

### Code Comments
- Explain **why**, not **what**
- Document business logic and edge cases
- Use complete sentences
- Keep comments up-to-date with code changes

### Error Messages
- Start with what happened
- Include what the user should do
- Provide relevant context
- Avoid technical jargon in user-facing errors

### Commit Messages
- Use conventional commit format
- Be specific about changes
- Explain motivation for non-obvious changes
- Reference issues when relevant

## Content Guidelines

### Tutorials
- Start with the end result
- Explain each step's purpose
- Provide checkpoints for verification
- Include troubleshooting for common issues

### Explanatory Content
- Use analogies sparingly and accurately
- Define terms on first use
- Link to authoritative sources
- Build concepts incrementally

### Release Notes
- Lead with user impact
- Group changes logically
- Include migration steps for breaking changes
- Thank contributors specifically

## Examples

### Good
```
Create cryptographically signed location attestations using EIP-712 signatures or onchain registration.
```

### Avoid
```
🚀 Revolutionary Web3 location protocol that will transform how we think about spatial data! ✨
```

### Good
```
The SDK validates GeoJSON objects against the specification before creating attestations.
```

### Avoid
```
Our cutting-edge validation engine leverages industry-standard GeoJSON parsing to ensure data integrity.
```

## Review Checklist

Before publishing any content, verify:

- [ ] Does this help users accomplish their goals?
- [ ] Are the examples complete and accurate?
- [ ] Is the language precise and unambiguous?
- [ ] Does it maintain our calm, professional tone?
- [ ] Are we solving real problems, not creating artificial ones?
- [ ] Would a developer trust this enough to build on it?

## Voice Examples

### Product Descriptions
**Good**: "TypeScript SDK for creating location attestations on EAS-compatible networks."
**Avoid**: "Next-generation Web3 location protocol powered by blockchain technology."

### Feature Announcements
**Good**: "Added support for Polygon network. Developers can now create attestations on Polygon using the same API."
**Avoid**: "🎉 HUGE UPDATE! We're thrilled to announce Polygon support is here! This game-changing integration opens up incredible new possibilities!"

### Error Documentation
**Good**: "Invalid GeoJSON: coordinates array must contain exactly 2 numbers [longitude, latitude]."
**Avoid**: "Oops! Something went wrong with your coordinates. Please check your GeoJSON format."

## Implementation Notes

- Apply this guide to all public-facing content
- READMEs, documentation, error messages, and API responses
- Use for internal docs to maintain consistency
- Review existing content against these standards during major releases
- Update the guide as our voice evolves

Remember: We're building infrastructure. Our communication should reflect the same reliability and precision as our code.
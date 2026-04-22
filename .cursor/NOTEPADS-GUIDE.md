# Cursor Notepads Guide

This guide shows how to use Cursor's Notepads feature to reference additional skills on-demand.

## What's in Rules (Always Loaded)

These 3 essential skills are in `.cursor/rules/` and automatically loaded by Cursor:

1. **test-driven-development.md** - TDD workflow, test pyramid, Prove-It pattern
2. **code-review-and-quality.md** - Five-axis review framework
3. **incremental-implementation.md** - Build in small, verifiable slices

These are your baseline. Always follow them.

## What's in Skills (Use as Notepads)

The other 18 skills are in `.cursor/skills/` - load them as Notepads when needed.

### Setup: Create Notepads in Cursor

**In Cursor IDE:**
1. Open Settings (Cmd+,)
2. Go to **Notepads** section
3. Create a new notepad for each skill you'll use

### Phase-Specific Notepads

Create these notepads based on what you're working on:

#### Define Phase
- **Notepad:** "swe: Spec-Driven Development"
  - Source: `.cursor/skills/spec-driven-development/SKILL.md`
  - Use when: Starting new features

- **Notepad:** "swe: Idea Refine"
  - Source: `.cursor/skills/idea-refine/SKILL.md`
  - Use when: Brainstorming features

#### Plan Phase
- **Notepad:** "swe: Planning & Task Breakdown"
  - Source: `.cursor/skills/planning-and-task-breakdown/SKILL.md`
  - Use when: Estimating and scoping work

#### Build Phase
- **Notepad:** "swe: Context Engineering"
  - Source: `.cursor/skills/context-engineering/SKILL.md`
  - Use when: Setting up project context

- **Notepad:** "swe: Frontend UI Engineering"
  - Source: `.cursor/skills/frontend-ui-engineering/SKILL.md`
  - Use when: Building user interfaces

- **Notepad:** "swe: API & Interface Design"
  - Source: `.cursor/skills/api-and-interface-design/SKILL.md`
  - Use when: Designing APIs or module boundaries

- **Notepad:** "swe: Source-Driven Development"
  - Source: `.cursor/skills/source-driven-development/SKILL.md`
  - Use when: Grounding decisions in official docs

#### Verify Phase
- **Notepad:** "swe: Browser Testing with DevTools"
  - Source: `.cursor/skills/browser-testing-with-devtools/SKILL.md`
  - Use when: Debugging or testing in browser

- **Notepad:** "swe: Debugging & Error Recovery"
  - Source: `.cursor/skills/debugging-and-error-recovery/SKILL.md`
  - Use when: Troubleshooting issues

#### Review Phase
- **Notepad:** "swe: Code Simplification"
  - Source: `.cursor/skills/code-simplification/SKILL.md`
  - Use when: Reducing complexity

- **Notepad:** "swe: Security & Hardening"
  - Source: `.cursor/skills/security-and-hardening/SKILL.md`
  - Use when: Handling security-critical code

- **Notepad:** "swe: Performance Optimization"
  - Source: `.cursor/skills/performance-optimization/SKILL.md`
  - Use when: Optimizing for speed/efficiency

#### Ship Phase
- **Notepad:** "swe: Git Workflow & Versioning"
  - Source: `.cursor/skills/git-workflow-and-versioning/SKILL.md`
  - Use when: Committing and versioning

- **Notepad:** "swe: CI/CD & Automation"
  - Source: `.cursor/skills/ci-cd-and-automation/SKILL.md`
  - Use when: Setting up pipelines

- **Notepad:** "swe: Deprecation & Migration"
  - Source: `.cursor/skills/deprecation-and-migration/SKILL.md`
  - Use when: Sunsetting old systems

- **Notepad:** "swe: Documentation & ADRs"
  - Source: `.cursor/skills/documentation-and-adrs/SKILL.md`
  - Use when: Writing docs or architecture decisions

- **Notepad:** "swe: Shipping & Launch"
  - Source: `.cursor/skills/shipping-and-launch/SKILL.md`
  - Use when: Deploying to production

## Reference Materials (Quick Checklists)

Also create these reference notepads for quick lookups:

- **Notepad:** "ref: Security Checklist"
  - Source: `.cursor/references/security-checklist.md`

- **Notepad:** "ref: Performance Checklist"
  - Source: `.cursor/references/performance-checklist.md`

- **Notepad:** "ref: Testing Patterns"
  - Source: `.cursor/references/testing-patterns.md`

- **Notepad:** "ref: Accessibility Checklist"
  - Source: `.cursor/references/accessibility-checklist.md`

## How to Use Notepads in Chat

Once you've created notepads in Cursor settings, reference them in chat:

```
@notepad swe: Spec-Driven Development
Write a spec for [feature]. Follow the spec-driven-development framework.

@notepad swe: Frontend UI Engineering
I'm building a form component. Check this against the Frontend UI Engineering skill.

@notepad ref: Security Checklist
Review this authentication code against the security checklist.
```

## Why This Structure?

- **Rules (3 essential)** - Always loaded, minimal context overhead, core baseline
- **Notepads (18 optional)** - Load when relevant, respects context limits
- **References (4 checklists)** - Quick lookup, don't need to load all the time

This balances comprehensive guidance with Cursor's context efficiency.

---

**Setup Steps:**
1. Open Cursor Settings
2. Go to Notepads
3. Create notepads for skills/references you'll use
4. Reference them with `@notepad [name]` in chat

**That's it!** You now have 21 production-grade skills available on-demand without overwhelming Cursor's context.

---

For the full official guide, see:
https://github.com/addyosmani/agent-skills/blob/main/docs/cursor-setup.md

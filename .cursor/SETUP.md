# Agent Skills Setup for Cursor

This project integrates [agent-skills](https://github.com/addyosmani/agent-skills) following the **official Cursor configuration** from the project's own setup guide.

## Structure

### Essential Rules (Always Loaded)

Located in `.cursor/rules/` - these 3 skills are automatically loaded by Cursor:

1. **test-driven-development.md** (14 KB)
   - TDD workflow, test pyramid, Prove-It pattern
   - Follow this for all testing

2. **code-review-and-quality.md** (14 KB)
   - Five-axis review framework
   - Use before merging code

3. **incremental-implementation.md** (8.3 KB)
   - Build in small, verifiable slices
   - Base approach for all implementation

### Full Skills Library

Located in `.cursor/skills/` - 21 complete skills available as Notepads:

All skills from the Define, Plan, Build, Verify, Review, and Ship phases. Load them as Cursor Notepads when needed.

### Quick References

Located in `.cursor/references/`:
- `security-checklist.md` - Pre-commit security checks
- `performance-checklist.md` - Performance validation
- `testing-patterns.md` - Test examples and patterns
- `accessibility-checklist.md` - WCAG 2.1 AA compliance

### Specialist Agents

Located in `.cursor/agents/`:
- `code-reviewer.md` - Senior engineer code review perspective
- `test-engineer.md` - QA specialist testing perspective
- `security-auditor.md` - Security engineer threat perspective

### Slash Command Guides

Located in `.cursor/commands/`:
- `/spec` - Spec-Driven Development
- `/plan` - Planning & Task Breakdown
- `/build` - Incremental Implementation
- `/test` - Test-Driven Development
- `/review` - Code Review & Quality Gates
- `/code-simplify` - Code Simplification
- `/ship` - Shipping & Deployment

## Setup

### Step 1: Essential Rules (Already Done)

The 3 essential rules are already in `.cursor/rules/` and automatically loaded by Cursor.

### Step 2: Create Notepads (You Do This)

In **Cursor Settings → Notepads**, create notepads for skills you'll use frequently:

```
Name: swe: Spec-Driven Development
Content: Copy from .cursor/skills/spec-driven-development/SKILL.md

Name: swe: Frontend UI Engineering
Content: Copy from .cursor/skills/frontend-ui-engineering/SKILL.md

Name: swe: Security & Hardening
Content: Copy from .cursor/skills/security-and-hardening/SKILL.md

Name: ref: Security Checklist
Content: Copy from .cursor/references/security-checklist.md
```

See `.cursor/NOTEPADS-GUIDE.md` for the complete list of suggested notepads.

### Step 3: Use in Chat

Reference notepads in Cursor chat:

```
@notepad swe: Spec-Driven Development
Write a spec for the user authentication feature.

@notepad ref: Security Checklist
Review this code against the security checklist before I commit.
```

## Workflow

### Always (Built Into Rules)

1. **Test-Driven Development** - Write tests first, code second (Red-Green-Refactor)
2. **Code Review & Quality** - Five-axis review before merging
3. **Incremental Implementation** - Small, atomic, verifiable changes

### By Phase (Use Notepads)

**Defining:** Use `@notepad swe: Spec-Driven Development`
**Planning:** Use `@notepad swe: Planning & Task Breakdown`
**Building:** Use `@notepad swe: [Frontend UI | API Design | Security | etc]`
**Verifying:** Use `@notepad swe: Browser Testing` or `@notepad swe: Debugging`
**Reviewing:** Use `@notepad swe: Code Simplification` + `@notepad ref: Security Checklist`
**Shipping:** Use `@notepad swe: Git Workflow` + `@notepad swe: Shipping & Launch`

## Key Principles

These skills encode engineering judgment from senior engineers:

- **Spec Before Code** - Catch 80% of issues before writing
- **Small, Atomic Tasks** - Faster reviews, better feedback
- **Test-Driven Development** - Tests are proof, not afterthought
- **Security First** - Catch vulnerabilities early
- **Measure Performance** - Fix real problems, not guesses
- **Code as Liability** - Minimize surface area

## Why This Structure?

- **3 Essential Rules** - Always loaded, minimal context overhead
- **18 Optional Skills** - Load as Notepads when relevant
- **4 Quick References** - Checklists for critical decisions
- **Respects Context** - Won't overwhelm Cursor's context window
- **Official Setup** - Following the [recommended Cursor configuration](https://github.com/addyosmani/agent-skills/blob/main/docs/cursor-setup.md)

## Complete File Listing

```
.cursor/
├── rules/                          # 3 Essential skills (always loaded)
│   ├── test-driven-development.md
│   ├── code-review-and-quality.md
│   └── incremental-implementation.md
│
├── skills/                         # 21 Full skills (use as notepads)
│   ├── spec-driven-development/
│   ├── planning-and-task-breakdown/
│   ├── api-and-interface-design/
│   ├── frontend-ui-engineering/
│   ├── context-engineering/
│   ├── source-driven-development/
│   ├── browser-testing-with-devtools/
│   ├── debugging-and-error-recovery/
│   ├── code-simplification/
│   ├── security-and-hardening/
│   ├── performance-optimization/
│   ├── git-workflow-and-versioning/
│   ├── ci-cd-and-automation/
│   ├── deprecation-and-migration/
│   ├── documentation-and-adrs/
│   ├── shipping-and-launch/
│   ├── idea-refine/
│   └── using-agent-skills/
│
├── references/                     # 4 Quick checklists
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   ├── testing-patterns.md
│   └── accessibility-checklist.md
│
├── agents/                         # 3 Specialist personas
│   ├── code-reviewer.md
│   ├── test-engineer.md
│   └── security-auditor.md
│
├── commands/                       # 7 Slash command guides
│   ├── spec.md
│   ├── plan.md
│   ├── build.md
│   ├── test.md
│   ├── review.md
│   ├── code-simplify.md
│   └── ship.md
│
├── hooks/                          # Session automation
│
├── NOTEPADS-GUIDE.md              # Setup instructions
├── AGENTS.md                       # Multi-agent orchestration
└── README.md                       # This directory's guide
```

## References

- **Official Cursor Setup:** https://github.com/addyosmani/agent-skills/blob/main/docs/cursor-setup.md
- **Main Project:** https://github.com/addyosmani/agent-skills
- **Local Guides:**
  - `.cursor/NOTEPADS-GUIDE.md` - How to set up Notepads
  - `README.md` - Project overview
  - `QUICK-START.md` - 5-minute guide
  - `SKILLS-INDEX.md` - Complete skill reference

## Quick Start

1. Read this file (you're doing it!)
2. Open `.cursor/NOTEPADS-GUIDE.md` and create notepads for skills you'll use
3. Open `README.md` for project overview
4. Start with `@notepad swe: Spec-Driven Development` for your first feature

---

**Version:** Agent Skills 0.5.0  
**Setup:** Following Official Cursor Recommendations  
**Integrated:** April 22, 2026

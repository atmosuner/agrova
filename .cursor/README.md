# Cursor Configuration Directory

This directory contains all Agent Skills configuration for the Strack project.

## Organization

- **skills/** - 21 production-grade engineering skills (full directory structure with supporting files)
- **rules/** - Individual SKILL.md files extracted for Cursor's rule system
- **agents/** - 3 specialist personas (code-reviewer, test-engineer, security-auditor)
- **references/** - 5 reference checklists (security, performance, testing, accessibility, orchestration)
- **hooks/** - Session lifecycle automation scripts
- **commands/** - 7 slash commands (/spec, /plan, /build, /test, /review, /code-simplify, /ship)
- **AGENTS.md** - Multi-agent orchestration patterns

## How to Use

### In Cursor IDE

1. **Access Skills as Rules:**
   - The 21 SKILL.md files in `.cursor/rules/` are automatically available as Cursor rules
   - Reference them directly by skill name: `spec-driven-development`, `test-driven-development`, etc.

2. **Use Agents:**
   - Reference `.cursor/agents/code-reviewer.md` for code review perspective
   - Reference `.cursor/agents/test-engineer.md` for test strategy
   - Reference `.cursor/agents/security-auditor.md` for security review

3. **Check References:**
   - `.cursor/references/security-checklist.md` before handling security-critical code
   - `.cursor/references/performance-checklist.md` for performance work
   - `.cursor/references/testing-patterns.md` when writing tests

4. **Use Slash Commands:**
   - Type `/spec` to activate Spec-Driven Development
   - Type `/plan` to break work into tasks
   - Type `/build` to implement incrementally
   - Type `/test` to verify with tests
   - Type `/review` for pre-merge quality gates
   - Type `/code-simplify` to reduce complexity
   - Type `/ship` for production deployment

## Key Files

- Read `..README.md` first for overview
- See `..QUICK-START.md` for 5-minute guide
- Check `..SKILLS-INDEX.md` for skill reference
- Full docs: `..AGENT-SKILLS-SETUP.md`

## Structure Reference

```
.cursor/
├── rules/                         # Cursor rule files (auto-discovered)
│   ├── spec-driven-development.md
│   ├── test-driven-development.md
│   ├── code-review-and-quality.md
│   └── ... 18 more
│
├── skills/                        # Full skill directories with all supporting files
│   ├── spec-driven-development/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   └── examples/
│   └── ... 20 more
│
├── agents/                        # Specialist personas
│   ├── code-reviewer.md
│   ├── test-engineer.md
│   ├── security-auditor.md
│   └── README.md
│
├── references/                    # Quick-reference materials
│   ├── testing-patterns.md
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   ├── accessibility-checklist.md
│   └── orchestration-patterns.md
│
├── hooks/                         # Session automation
│   ├── hooks.json
│   ├── session-start.sh
│   ├── sdd-cache-pre.sh
│   ├── sdd-cache-post.sh
│   └── simplify-ignore.sh
│
├── commands/                      # Slash command definitions
│   ├── spec.md
│   ├── plan.md
│   ├── build.md
│   ├── test.md
│   ├── review.md
│   ├── code-simplify.md
│   └── ship.md
│
├── AGENTS.md                      # Multi-agent orchestration
└── README.md                      # This file
```

---

**Integrated:** April 22, 2026  
**Source:** [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)

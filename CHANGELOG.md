# Changelog

All notable changes to the AI Automation Starter Kit.

## [1.0.5] - 2026-03-23

### Added

**Templates:**
- `multi-agent-orchestrator.json` - Coordinate multiple specialized AI agents (planner, researcher, analyst, writer, reviewer, synthesizer) for complex tasks. Features DAG-based execution, shared memory, quality review loops, and automatic iteration. Inspired by trending frameworks: obra/superpowers (+38K stars), GitHub Squad, LangGraph.

**Prompts:**
- `multi-agent-planner.md` - Strategic task decomposition prompt for multi-agent workflows with examples and anti-patterns

### Notes

Multi-agent orchestration is the hottest trend in AI automation (March 2026). This template provides a production-ready pattern for coordinating specialized agents.

---

## [1.0.4] - 2026-03-19

### Added

**Templates:**
- `data-extraction.json` - Extract structured data from URLs, PDFs, or raw text with schema validation, chunking for large documents, and optional enrichment. Includes 3 usage examples (contact scraping, invoice parsing, product info).

**MVP Complete!** 🎉 5/5 templates, 5/5 prompts, all scripts (Python + JS).

---

## [1.0.3] - 2026-03-19

### Added

**Scripts:**
- `llm_utils.js` - JavaScript/ESM version of LLM client with JSDoc types
- `webhook_handler.js` - JavaScript/ESM webhook server using Express

JavaScript versions maintain feature parity with Python: retry with backoff, multi-provider support (OpenAI/Anthropic), rate limiting, signature verification, and batch processing utilities.

---

## [1.0.2] - 2026-03-18

### Added

**Documentation:**
- `architecture-patterns.md` - 6 production-tested patterns (webhook→action, queue-based, human-in-loop, fallback chain, caching, multi-model router) + anti-patterns to avoid
- `security-considerations.md` - Comprehensive security guide: API key management, input validation, PII masking, rate limiting, webhook security, audit logging, and deployment checklist

---

## [1.0.1] - 2026-03-17

### Added

**Templates:**
- `meeting-summarizer.json` - Transform transcripts into structured summaries with action items

**Prompts:**
- `meeting-summarizer.md` - Meeting analysis and action item extraction prompt

---

## [1.0.0] - 2026-03-17

### Added

**Templates:**
- `email-triage.json` - AI-powered email classification and routing
- `lead-qualification.json` - Instant lead scoring and qualification
- `content-repurpose.json` - Multi-format content generation pipeline

**Prompts:**
- `email-classifier.md` - Email classification prompt with examples
- `lead-qualifier.md` - Lead scoring prompt with ICP matching

**Scripts:**
- `llm_utils.py` - Unified LLM client for OpenAI/Anthropic
- `webhook_handler.py` - Universal webhook server with rate limiting

**Documentation:**
- `quickstart.md` - Get started in 15 minutes guide

### Notes

Initial release. Built for indie hackers, freelancers, and founders who want to ship AI automations fast.

---

## Roadmap

### [1.1.0] - Planned
- [ ] More prompt templates (support, sales, onboarding)
- [x] JavaScript/TypeScript versions of scripts ✅ *shipped in 1.0.3*
- [ ] n8n/Activepieces native templates
- [ ] Cost tracking utilities

### [1.2.0] - Planned
- [ ] Agent orchestration patterns
- [ ] Memory/state management
- [ ] Multi-model routing
- [ ] Evaluation framework

---

**Maintained by Vector** 🎯

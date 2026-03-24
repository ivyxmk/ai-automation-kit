# ✅ Template Quality Checklist

*Standard checklist for all templates in AI Automation Kit*
*Created: 2026-03-24*

---

## 🎯 Purpose

Ensure consistent quality across all templates. Every template should pass this checklist before release.

---

## 📋 Pre-Release Checklist

### 1. Structure & Format

- [ ] **Valid JSON/YAML** — Passes linting without errors
- [ ] **Consistent naming** — snake_case for keys, descriptive names
- [ ] **Version field** — Semantic versioning (e.g., "1.0.0")
- [ ] **Metadata block** — name, description, author, version, category

### 2. Documentation

- [ ] **README.md** — Clear description, use cases, setup instructions
- [ ] **Examples** — At least 2 working examples with expected output
- [ ] **Variables documented** — All configurable variables listed with defaults
- [ ] **Prerequisites** — Required tools, API keys, dependencies listed

### 3. Configurability

- [ ] **Environment variables** — Sensitive data via env vars, not hardcoded
- [ ] **Default values** — Sensible defaults for all optional parameters
- [ ] **Override mechanism** — Clear way to customize behavior
- [ ] **Validation** — Input validation with helpful error messages

### 4. Agent Toolkit Compatibility (NEW)

- [ ] **Nemotron-ready** — Works with NVIDIA Nemotron models
- [ ] **AI-Q patterns** — Follows hybrid query architecture where applicable
- [ ] **OpenShell compatible** — Respects security sandboxing patterns
- [ ] **Tool definitions** — Standard tool/function calling format

### 5. Testing

- [ ] **Unit tests** — Key functions tested
- [ ] **Integration test** — End-to-end workflow verified
- [ ] **Edge cases** — Error handling for common failures
- [ ] **Dry-run mode** — Safe way to test without side effects

### 6. Production Readiness

- [ ] **Logging** — Appropriate log levels, no sensitive data in logs
- [ ] **Error handling** — Graceful failures with actionable messages
- [ ] **Rate limiting** — Respects API limits where applicable
- [ ] **Idempotency** — Safe to retry operations

---

## 📊 Quality Tiers

### Tier 1: MVP (Minimum Viable)
- [ ] Valid structure
- [ ] Basic README
- [ ] 1 working example
- [ ] Environment variable support

### Tier 2: Production Ready
- All Tier 1 +
- [ ] Full documentation
- [ ] 2+ examples
- [ ] Integration tests
- [ ] Error handling

### Tier 3: Enterprise Grade
- All Tier 2 +
- [ ] Agent Toolkit compatibility
- [ ] Comprehensive tests
- [ ] Monitoring hooks
- [ ] Security audit passed

---

## 🔄 Retroactive Application

### Templates to Review

| Template | Current Tier | Target Tier | Notes |
|----------|--------------|-------------|-------|
| *(Add existing templates)* | | | |

---

## 📝 Template Submission Flow

1. **Create** — Use this checklist during development
2. **Self-review** — Check off items before PR
3. **Peer review** — Second pair of eyes on checklist
4. **Release** — Only after Tier 1 minimum achieved

---

## 🎯 Agent Toolkit Integration Patterns

### Adobe Creative Workflow
```
Use case: Image generation pipeline
Tools: Firefly API, asset management
Pattern: Request → Generate → Review → Approve
```

### Salesforce CRM Agent
```
Use case: Lead scoring, automated follow-up
Tools: Salesforce API, Agentforce
Pattern: Trigger → Score → Route → Act
```

### ServiceNow IT Support
```
Use case: Ticket triage, auto-resolution
Tools: ServiceNow API, knowledge base
Pattern: Classify → Search → Resolve/Escalate
```

---

*Created via nightly improvement execution — 2026-03-24*

# 🛠️ NVIDIA Agent Toolkit Templates

*Templates for NVIDIA Agent Toolkit enterprise integrations*
*Created: 2026-03-24 | Status: 🟡 In Development*

---

## 📋 Overview

Pre-built templates for the 17 official NVIDIA Agent Toolkit partners. These templates accelerate deployment of agentic AI workflows on enterprise platforms.

## 🗂️ Template Structure

```
agent-toolkit/
├── README.md           # This file
├── adobe/              # Adobe Creative workflows
│   └── firefly-pipeline.json
├── salesforce/         # Salesforce CRM agents
│   └── lead-scoring.json
├── servicenow/         # IT service management
│   └── ticket-triage.json
└── _base/              # Shared components
    └── nemotron-config.json
```

## 📦 Available Templates

### Tier 1: Priority (High Enterprise Demand)

| Template | Partner | Use Case | Status |
|----------|---------|----------|--------|
| `adobe/firefly-pipeline` | Adobe | Image generation pipeline | 🔲 Planned |
| `salesforce/lead-scoring` | Salesforce | CRM lead automation | 🔲 Planned |
| `servicenow/ticket-triage` | ServiceNow | IT support automation | 🔲 Planned |

### Tier 2: Expansion

| Template | Partner | Use Case | Status |
|----------|---------|----------|--------|
| `crowdstrike/threat-response` | CrowdStrike | Security ops | 🔲 Planned |
| `atlassian/devops-agent` | Atlassian | DevOps workflows | 🔲 Planned |

## 🔧 Agent Toolkit Compatibility

All templates are designed for:
- **Nemotron** models (agentic reasoning)
- **AI-Q** hybrid architecture (cost optimization)
- **OpenShell** security runtime (sandboxing)

## 📝 Development Notes

These templates follow patterns from GTC 2026 announcements. Enterprise partner APIs may require specific access arrangements.

---

*YELLOW zone: Review after implementation*

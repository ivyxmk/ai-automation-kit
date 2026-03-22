# 🚀 Quick Start Guide

Get your first AI automation running in under 15 minutes.

---

## Prerequisites

- Python 3.9+ or Node.js 18+
- OpenAI API key (or Anthropic)
- Basic understanding of webhooks

---

## Step 1: Set Up Your Environment

```bash
# Clone or download this kit
cd ai-automation-kit

# Create virtual environment (Python)
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install openai anthropic flask requests

# Set your API key
export OPENAI_API_KEY="sk-..."
```

---

## Step 2: Test the LLM Utils

```python
from scripts.llm_utils import LLMClient, LLMConfig

# Initialize client
config = LLMConfig(provider="openai", model="gpt-4o-mini")
client = LLMClient(config)

# Test classification
result = client.complete(
    prompt="Classify this: 'I want to cancel my subscription'",
    system="Return JSON with 'intent' and 'sentiment' fields",
    json_mode=True
)

print(result)
# Output: {"intent": "cancellation", "sentiment": "negative"}
```

---

## Step 3: Deploy a Simple Automation

### Option A: Email Triage (Zapier/Make)

1. Create a Zap/Scenario triggered by new emails
2. Add a webhook step that calls your server
3. Use the classification result to route the email

```
Trigger: New Email in Gmail
→ Webhook: POST to your-server.com/classify
→ Filter: If priority == "high"
→ Action: Send Slack notification
```

### Option B: Lead Qualification (Self-hosted)

1. Start the webhook server:

```bash
python scripts/webhook_handler.py
```

2. Point your form/CRM to `http://your-server:8080/webhook/form`

3. The handler processes leads and returns qualification data

---

## Step 4: Customize the Prompts

Edit the prompts in `/prompts` to match your use case:

```markdown
# In prompts/email-classifier.md

**Our categories:**
- sales (leads, demos, pricing)
- support (bugs, issues, complaints)
- billing (invoices, refunds, payments)
- [ADD YOUR CATEGORIES HERE]
```

---

## Step 5: Scale Up

### Add Error Handling

```python
from scripts.llm_utils import retry_with_backoff

@retry_with_backoff(max_retries=3)
def process_item(item):
    return client.complete(...)
```

### Add Caching

```python
import functools

@functools.lru_cache(maxsize=1000)
def classify_cached(text_hash):
    return client.complete(...)
```

### Add Logging

```python
import logging
logging.basicConfig(level=logging.INFO)

# All LLM calls are now logged
```

---

## Common Patterns

### Pattern 1: Classification → Routing

```
Input → LLM Classification → Conditional Logic → Multiple Outputs
```

### Pattern 2: Extraction → Enrichment → Action

```
Document → Extract Data → Enrich via APIs → Update CRM/Database
```

### Pattern 3: Generation → Review → Send

```
Context → LLM Draft → Human Review Queue → Send if Approved
```

---

## Cost Optimization

| Model | Cost/1K tokens | Best For |
|-------|----------------|----------|
| gpt-4o-mini | $0.00015 | Classification, extraction |
| gpt-4o | $0.005 | Complex reasoning, generation |
| claude-3-haiku | $0.00025 | Fast classification |
| claude-3-sonnet | $0.003 | Balanced tasks |

**Rule of thumb:** Start with the cheapest model, upgrade only if accuracy is insufficient.

---

## Next Steps

1. **Explore `/templates`** for more automation patterns
2. **Read `/docs/architecture.md`** for complex setups
3. **Check `/docs/security.md`** before going to production

---

## Need Help?

- Check the prompt engineering tips in `/prompts/README.md`
- Review error handling patterns in `/scripts/`
- Common issues documented in `/docs/troubleshooting.md`

---

**Happy automating!** 🤖

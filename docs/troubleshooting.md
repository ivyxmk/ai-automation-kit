# Troubleshooting & FAQ

Common issues and solutions when building AI automation workflows.

---

## Common Issues

### 1. LLM Responses Are Inconsistent

**Symptom:** Same input produces wildly different outputs.

**Solutions:**
- Lower the temperature (0.0-0.3 for deterministic tasks)
- Add more specific examples in your prompt
- Use structured output (JSON mode) when available
- Add validation/retry logic for critical paths

```python
# Example: Retry with validation
def get_reliable_response(prompt, max_retries=3):
    for attempt in range(max_retries):
        response = call_llm(prompt, temperature=0.1)
        if validate_response(response):
            return response
    raise ValueError("Failed to get valid response")
```

---

### 2. Rate Limiting / 429 Errors

**Symptom:** API returns "Too Many Requests" errors.

**Solutions:**
- Implement exponential backoff
- Batch similar requests together
- Use a queue system for high volume
- Consider multiple API keys for production

```python
import time

def call_with_backoff(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except RateLimitError:
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait)
    raise Exception("Max retries exceeded")
```

---

### 3. High Latency / Slow Responses

**Symptom:** Automation feels sluggish, webhooks timeout.

**Solutions:**
- Use async processing (respond immediately, process in background)
- Switch to faster models for simple tasks (GPT-3.5 vs GPT-4)
- Cache common responses
- Stream responses when possible

```python
# Return 202 Accepted immediately, process async
@app.post("/webhook")
async def handle_webhook(data: dict):
    background_tasks.add_task(process_with_ai, data)
    return {"status": "accepted"}, 202
```

---

### 4. Costs Growing Too Fast

**Symptom:** API bills higher than expected.

**Solutions:**
- Use smaller/cheaper models where possible
- Implement caching for repeated queries
- Batch process instead of real-time
- Set hard spending limits with your provider
- Truncate unnecessary context from prompts

**Cost comparison (approximate, per 1M tokens):**
| Model | Input | Output |
|-------|-------|--------|
| GPT-4 | $30 | $60 |
| GPT-4 Turbo | $10 | $30 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| Claude Sonnet | $3 | $15 |

---

### 5. Classification Accuracy Issues

**Symptom:** AI misclassifies emails, leads, tickets.

**Solutions:**
- Add more examples (few-shot prompting)
- Define categories more clearly with edge cases
- Use confidence scores + human review for uncertain cases
- Create a feedback loop to improve over time

```python
# Use confidence thresholds
result = classify(email)
if result.confidence < 0.7:
    send_to_human_review(email, result.suggestion)
else:
    take_action(result.category)
```

---

### 6. Webhook Timeouts

**Symptom:** Zapier/Make reports timeouts, automations fail.

**Solutions:**
- Return 200/202 immediately, process async
- Use queues for heavy processing
- Keep webhook handlers lightweight
- Increase timeout settings if available

---

## FAQ

### Q: Which LLM should I use?

**Quick guide:**
- **Simple classification/routing:** GPT-3.5 Turbo, Claude Haiku
- **Content generation:** GPT-4, Claude Sonnet
- **Complex reasoning:** GPT-4, Claude Opus
- **Speed-critical:** GPT-3.5 Turbo, Groq

Start with the cheapest that works, upgrade if quality suffers.

---

### Q: How do I handle sensitive data?

See [Security Considerations](./security-considerations.md) for detailed guidance. Key points:
- Never log PII in plain text
- Use environment variables for API keys
- Implement data retention policies
- Consider on-premise/private LLM options for sensitive use cases

---

### Q: Should I use Zapier/Make or build custom?

**Use Zapier/Make when:**
- Prototyping or validating ideas
- Simple workflows (< 5 steps)
- Non-technical users will maintain it
- Time to market matters most

**Build custom when:**
- High volume (1000s of events/day)
- Complex logic or branching
- Need fine-grained control
- Cost optimization is priority

---

### Q: How do I test AI automations?

1. **Unit tests:** Mock LLM responses, test your logic
2. **Prompt tests:** Golden datasets with expected outputs
3. **Shadow mode:** Run new prompts in parallel, compare results
4. **Canary deploys:** Route 5% of traffic to new version

```python
# Example: Prompt regression test
def test_email_classifier():
    test_cases = [
        ("Your order has shipped", "transactional"),
        ("Meeting tomorrow at 3pm", "calendar"),
        ("50% off sale!", "promotional"),
    ]
    for email, expected in test_cases:
        result = classify_email(email)
        assert result.category == expected
```

---

### Q: What's the best way to handle failures?

1. Log everything (input, output, errors, latency)
2. Implement retries with backoff
3. Have fallback paths (rule-based, human escalation)
4. Alert on error rate spikes
5. Build dashboards to monitor success rates

---

## Getting Help

- Review the [Architecture Patterns](./architecture-patterns.md) for design guidance
- Check [Security Considerations](./security-considerations.md) for compliance
- File issues on GitHub for kit-specific problems
- Join the community Discord for real-time help

---

*Still stuck? Most issues come down to: prompts, rate limits, or async handling. Start there.*

# Architecture Patterns for AI Automation

Production-tested patterns for building robust AI automation systems.

---

## Pattern 1: Webhook → Process → Action

The most common pattern for event-driven automation.

```
[External Service] → [Webhook Endpoint] → [AI Processor] → [Action]
     (Zapier)           (Your server)        (LLM call)      (API/Email)
```

**When to use:**
- Email automation
- Form processing
- Chat integrations
- CRM events

**Example flow:**
1. New email arrives in Gmail
2. Zapier sends webhook to your endpoint
3. AI classifies email urgency/intent
4. Appropriate action triggered (reply, forward, archive, alert)

**Key considerations:**
- Use async processing for LLM calls (they can be slow)
- Implement retry logic with exponential backoff
- Log everything for debugging

---

## Pattern 2: Queue-Based Processing

For high-volume or long-running tasks.

```
[Input] → [Queue] → [Worker Pool] → [Results Store]
                         ↓
                    [AI Processor]
```

**When to use:**
- Batch processing (100s of items)
- Tasks that can fail and need retry
- Cost optimization (batch similar requests)

**Implementation tips:**
- Redis or SQS for queue
- Process in batches of 5-10 for cost efficiency
- Set dead-letter queue for failures

---

## Pattern 3: Human-in-the-Loop

AI suggests, human approves.

```
[Input] → [AI Analysis] → [Suggestion Queue] → [Human Review] → [Action]
                                ↓
                         [Auto-approve if confidence > threshold]
```

**When to use:**
- High-stakes decisions
- Building trust with new clients
- Compliance requirements
- Training data collection

**Confidence thresholds (starting points):**
- Auto-approve: > 95%
- Quick review: 80-95%
- Full review: < 80%

---

## Pattern 4: Fallback Chain

Graceful degradation when AI fails or is unsure.

```
[Input] → [Primary LLM] → [Success?] → Yes → [Action]
                              ↓ No
                         [Fallback LLM]
                              ↓ No
                         [Rule-based fallback]
                              ↓ No
                         [Human escalation]
```

**Implementation:**
```python
async def process_with_fallback(input_data):
    try:
        result = await primary_llm(input_data)
        if result.confidence > 0.8:
            return result
    except Exception:
        pass
    
    try:
        result = await fallback_llm(input_data)
        if result.confidence > 0.7:
            return result
    except Exception:
        pass
    
    # Rule-based fallback
    if matches_known_pattern(input_data):
        return rule_based_response(input_data)
    
    # Escalate to human
    return await escalate_to_human(input_data)
```

---

## Pattern 5: Caching Layer

Reduce costs and latency for repeated queries.

```
[Input] → [Cache Check] → [Hit?] → Yes → [Return cached]
                             ↓ No
                        [AI Process] → [Cache result] → [Return]
```

**Cache strategies:**
- Exact match: Hash the input
- Semantic match: Embed and similarity search
- TTL: 1 hour for dynamic, 24h+ for stable

**Cost impact:**
With 40% cache hit rate on 1000 daily queries:
- Without cache: ~$5/day (GPT-4)
- With cache: ~$3/day (40% savings)

---

## Pattern 6: Multi-Model Router

Use the right model for each task.

```
[Input] → [Task Classifier] → [Router]
                                 ├→ Simple: GPT-3.5 ($)
                                 ├→ Complex: GPT-4 ($$$)
                                 └→ Code: Claude ($$)
```

**Router logic example:**
```python
def route_request(task_type, complexity):
    if task_type == "classification" and complexity == "simple":
        return "gpt-3.5-turbo"  # Fast, cheap
    elif task_type == "code_generation":
        return "claude-3-sonnet"  # Good at code
    elif complexity == "complex" or task_type == "reasoning":
        return "gpt-4"  # Most capable
    else:
        return "gpt-3.5-turbo"  # Default cheap
```

---

## Anti-Patterns to Avoid

### ❌ Synchronous LLM Calls in Web Requests
LLM calls can take 2-30 seconds. Never block a user request.

**Fix:** Use background jobs, webhooks, or websockets.

### ❌ No Rate Limiting
API costs can explode with runaway loops.

**Fix:** Implement per-user and global rate limits.

### ❌ Prompt in Code
Changing prompts requires redeployment.

**Fix:** Store prompts in config files or database.

### ❌ No Input Validation
Prompt injection is real.

**Fix:** Validate and sanitize all user inputs. See `security.md`.

### ❌ Ignoring Token Limits
Truncated context = bad outputs.

**Fix:** Count tokens, summarize long inputs, use chunking.

---

## Choosing a Pattern

| Scenario | Recommended Pattern |
|----------|---------------------|
| Simple webhook automation | Webhook → Process → Action |
| Processing large batches | Queue-Based |
| Client-facing, needs trust | Human-in-the-Loop |
| Production system, must be reliable | Fallback Chain |
| High volume, repetitive queries | Caching Layer |
| Multiple task types, cost-sensitive | Multi-Model Router |

---

## Next Steps

- Review `/scripts/` for implementation examples
- See `/templates/` for ready-to-use workflows
- Check `security.md` for hardening your system

---

*Part of the AI Automation Starter Kit* 🤖

# Security Considerations for AI Automation

When deploying AI automations in production, security isn't optional. This guide covers essential practices to protect your data, users, and systems.

---

## 🔐 API Key Management

### Never Hardcode Keys

```python
# ❌ Bad
OPENAI_API_KEY = "sk-abc123..."

# ✅ Good
import os
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
```

### Best Practices

1. **Use environment variables** for all secrets
2. **Rotate keys regularly** (every 90 days minimum)
3. **Use separate keys** for dev/staging/production
4. **Monitor usage** for anomalies that indicate leaks
5. **Set spending limits** on API accounts

### Secret Management Tools

| Tool | Best For |
|------|----------|
| `.env` + `python-dotenv` | Local development |
| AWS Secrets Manager | AWS deployments |
| HashiCorp Vault | Multi-cloud / enterprise |
| 1Password/Doppler | Team workflows |

---

## 🛡️ Input Validation

### Sanitize All Inputs

AI systems can be manipulated through prompt injection. Always validate:

```python
def validate_input(user_input: str, max_length: int = 10000) -> str:
    """Sanitize user input before sending to LLM."""
    if not user_input or not isinstance(user_input, str):
        raise ValueError("Invalid input type")
    
    # Length check
    if len(user_input) > max_length:
        raise ValueError(f"Input exceeds {max_length} characters")
    
    # Strip control characters
    cleaned = ''.join(char for char in user_input if char.isprintable() or char in '\n\t')
    
    return cleaned.strip()
```

### Prompt Injection Prevention

```python
# Separate system instructions from user content clearly
def build_safe_prompt(system_prompt: str, user_content: str) -> list:
    """Build prompt with clear boundaries."""
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"USER INPUT START\n{user_content}\nUSER INPUT END"}
    ]
```

---

## 🔒 Data Privacy

### Minimize Data Exposure

1. **Only send necessary data** to AI providers
2. **Strip PII** before processing when possible
3. **Use data masking** for sensitive fields

```python
import re

def mask_pii(text: str) -> str:
    """Mask common PII patterns."""
    # Email
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
    # Phone (US format)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', text)
    # SSN
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
    # Credit card
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[CC]', text)
    return text
```

### Data Retention

- **Log only what you need** for debugging
- **Set retention policies** (e.g., delete logs after 30 days)
- **Don't log sensitive outputs** (decisions about people, PII)

---

## ⚠️ Rate Limiting & Abuse Prevention

### Implement Rate Limits

```python
from functools import wraps
from time import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, user_id: str) -> bool:
        now = time()
        # Clean old requests
        self.requests[user_id] = [
            t for t in self.requests[user_id] 
            if now - t < self.window
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(now)
        return True

# Usage: 10 requests per minute per user
limiter = RateLimiter(max_requests=10, window_seconds=60)
```

### Cost Controls

```python
def check_token_budget(estimated_tokens: int, daily_limit: int = 100000) -> bool:
    """Prevent runaway costs."""
    today_usage = get_today_token_usage()  # Your tracking function
    return (today_usage + estimated_tokens) <= daily_limit
```

---

## 🌐 Webhook Security

### Verify Webhook Sources

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook authenticity."""
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### Webhook Best Practices

1. **Always use HTTPS** endpoints
2. **Verify signatures** from the source
3. **Set timeouts** on webhook processing
4. **Queue async processing** for heavy workloads
5. **Return 200 quickly**, process in background

---

## 📋 Output Validation

### Verify AI Outputs

Don't blindly trust AI outputs, especially for:
- **Actions** (sending emails, database writes)
- **Financial decisions**
- **Access control**

```python
def validate_classification(result: str, allowed_values: list) -> str:
    """Ensure AI output is in expected range."""
    result = result.strip().lower()
    if result not in [v.lower() for v in allowed_values]:
        return "unknown"  # Safe default
    return result

# Usage
category = validate_classification(
    ai_response,
    allowed_values=["urgent", "normal", "low", "spam"]
)
```

### Human-in-the-Loop

For high-stakes decisions, require human approval:

```python
def process_lead(lead_data: dict, ai_decision: str) -> None:
    if ai_decision == "enterprise" and lead_data.get("deal_size", 0) > 50000:
        # Flag for human review instead of auto-routing
        queue_for_review(lead_data, reason="High-value enterprise lead")
    else:
        auto_route(lead_data, ai_decision)
```

---

## 🔍 Audit Logging

### Log for Accountability

```python
import json
from datetime import datetime

def audit_log(action: str, user_id: str, details: dict) -> None:
    """Create audit trail for AI decisions."""
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "details": details,
        # Don't log actual prompts/responses in audit - too verbose
        "input_hash": hash_input(details.get("input")),
    }
    # Write to secure audit log
    append_to_audit_log(json.dumps(entry))
```

### What to Log

| Do Log | Don't Log |
|--------|-----------|
| Timestamp | Full prompts |
| User/session ID | Raw PII |
| Action taken | API keys |
| Decision made | Passwords |
| Error codes | Internal IPs |

---

## 🚨 Error Handling

### Fail Safely

```python
def safe_llm_call(prompt: str, fallback: str = "Unable to process") -> str:
    """LLM call with graceful degradation."""
    try:
        response = call_llm(prompt)
        return response
    except RateLimitError:
        # Don't retry immediately, backoff
        return fallback
    except AuthenticationError:
        # Alert ops team, don't expose
        notify_ops("API key may be invalid")
        return fallback
    except Exception as e:
        # Log for debugging, return safe default
        log_error(e)
        return fallback
```

### Don't Leak Details

```python
# ❌ Bad - exposes internals
return {"error": str(e), "traceback": traceback.format_exc()}

# ✅ Good - safe error response
return {"error": "Processing failed", "code": "PROCESS_ERROR"}
```

---

## ✅ Security Checklist

Before deploying any AI automation:

- [ ] API keys in environment variables, not code
- [ ] Input validation and sanitization implemented
- [ ] Rate limiting configured
- [ ] PII masking for sensitive data
- [ ] Webhook signatures verified
- [ ] Output validation for critical actions
- [ ] Audit logging enabled
- [ ] Error handling doesn't leak details
- [ ] Human review for high-stakes decisions
- [ ] Spending limits set on AI provider accounts
- [ ] Regular security review scheduled

---

## Resources

- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OpenAI Safety Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Anthropic's Responsible AI Guidelines](https://docs.anthropic.com/)

---

*Stay secure. Ship responsibly.* 🔒

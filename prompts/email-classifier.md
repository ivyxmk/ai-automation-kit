# Email Classifier Prompt

## System Prompt

```
You are an expert email classifier. Your job is to analyze incoming emails and provide structured classification data that can be used for automated routing and prioritization.

Be precise. Be consistent. Output valid JSON only.
```

## User Prompt Template

```
Analyze this email and classify it:

**From:** {{sender}}
**Subject:** {{subject}}
**Body:**
{{body}}

---

Provide your analysis as JSON with these exact fields:

{
  "category": "<sales|support|billing|partnership|spam|personal|newsletter|internal|other>",
  "priority": "<high|medium|low>",
  "sentiment": "<positive|neutral|negative|urgent>",
  "requires_response": <true|false>,
  "response_deadline_hours": <number or null>,
  "key_entities": ["<extracted names, companies, products>"],
  "intent": "<brief description of what sender wants>",
  "suggested_action": "<specific recommended action>",
  "confidence": <0.0-1.0>
}

Classification rules:
- HIGH priority: Revenue impact, urgent deadlines, VIP senders, escalations
- MEDIUM priority: Standard business requests, follow-ups
- LOW priority: FYI emails, newsletters, non-urgent updates

Respond with JSON only. No explanation.
```

## Example Output

```json
{
  "category": "support",
  "priority": "high",
  "sentiment": "negative",
  "requires_response": true,
  "response_deadline_hours": 4,
  "key_entities": ["John Smith", "Acme Corp", "Enterprise Plan"],
  "intent": "Customer experiencing login issues, threatening to cancel",
  "suggested_action": "Escalate to support lead, offer immediate call",
  "confidence": 0.95
}
```

## Customization Notes

- Add custom categories for your business (e.g., "legal", "hr", "investor")
- Adjust priority rules based on your SLAs
- Add VIP sender list for automatic high-priority flagging
- Include product/service names for better entity extraction

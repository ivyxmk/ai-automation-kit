# Lead Qualifier Prompt

## System Prompt

```
You are a senior sales analyst specializing in lead qualification. You evaluate inbound leads to determine fit, intent, and priority for the sales team.

Your analysis directly impacts sales efficiency. Be accurate, actionable, and data-driven.
```

## User Prompt Template

```
Qualify this lead for our sales team:

**Lead Information:**
{{lead_info}}

**Company Data (enriched):**
{{company_data}}

**LinkedIn/Professional Data:**
{{linkedin_data}}

**Our ICP (Ideal Customer Profile):**
- Company size: 50-500 employees
- Industries: SaaS, E-commerce, Fintech
- Role: Director+ in Operations, Sales, or Customer Success
- Tech stack: Uses Salesforce, HubSpot, or similar
- Pain signals: Scaling challenges, manual processes, hiring ops roles

---

Analyze and output as JSON:

{
  "score": <0-100>,
  "tier": "<hot|warm|cold|disqualified>",
  "icp_match": {
    "overall": <true|false>,
    "company_size_fit": <true|false>,
    "industry_fit": <true|false>,
    "role_fit": <true|false>,
    "signals_detected": <true|false>
  },
  "buying_signals": [
    "<signal 1>",
    "<signal 2>"
  ],
  "red_flags": [
    "<concern 1>"
  ],
  "urgency": "<high|medium|low>",
  "budget_indicator": "<enterprise|mid-market|smb|unknown>",
  "decision_timeline": "<immediate|30_days|90_days|exploring|unknown>",
  "recommended_approach": "<specific outreach strategy>",
  "talking_points": [
    "<point 1>",
    "<point 2>"
  ],
  "qualification_reasoning": "<brief explanation>"
}

Scoring guide:
- 80-100: HOT - Strong ICP match + clear buying signals
- 60-79: WARM - Good fit, needs nurturing
- 40-59: COLD - Weak fit, long-term nurture
- 0-39: DISQUALIFIED - Not a fit, do not pursue

Output JSON only.
```

## Example Output

```json
{
  "score": 85,
  "tier": "hot",
  "icp_match": {
    "overall": true,
    "company_size_fit": true,
    "industry_fit": true,
    "role_fit": true,
    "signals_detected": true
  },
  "buying_signals": [
    "Recently posted job for 'Operations Manager' - scaling pain",
    "VP title - has budget authority",
    "Requested demo specifically for enterprise features"
  ],
  "red_flags": [],
  "urgency": "high",
  "budget_indicator": "mid-market",
  "decision_timeline": "30_days",
  "recommended_approach": "Immediate personalized outreach referencing their ops hiring. Offer discovery call focused on scaling automation.",
  "talking_points": [
    "Address scaling challenges without adding headcount",
    "Reference similar company case study",
    "Highlight enterprise security features they mentioned"
  ],
  "qualification_reasoning": "Strong ICP match across all dimensions. VP-level decision maker from growing SaaS company actively hiring ops roles indicates pain point we solve. Demo request shows active evaluation."
}
```

## Customization

- Replace ICP criteria with your actual profile
- Add industry-specific signals
- Include competitor mentions as buying signals
- Add your pricing tiers to budget_indicator options

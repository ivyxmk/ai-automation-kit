"""
LLM Utilities for AI Automation
Battle-tested helpers for working with OpenAI, Anthropic, and local models.
"""

import json
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from functools import wraps


@dataclass
class LLMConfig:
    """Configuration for LLM calls"""
    provider: str = "openai"  # openai, anthropic, local
    model: str = "gpt-4o-mini"
    max_tokens: int = 1000
    temperature: float = 0.1  # Low for automation tasks
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    """Decorator for retrying failed API calls with exponential backoff"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator


class LLMClient:
    """Unified client for multiple LLM providers"""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self._client = self._init_client()
    
    def _init_client(self):
        if self.config.provider == "openai":
            from openai import OpenAI
            return OpenAI()
        elif self.config.provider == "anthropic":
            from anthropic import Anthropic
            return Anthropic()
        else:
            raise ValueError(f"Unknown provider: {self.config.provider}")
    
    @retry_with_backoff(max_retries=3)
    def complete(
        self,
        prompt: str,
        system: str = "",
        json_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Get completion from LLM.
        Returns parsed JSON if json_mode=True, raw text otherwise.
        """
        if self.config.provider == "openai":
            return self._openai_complete(prompt, system, json_mode)
        elif self.config.provider == "anthropic":
            return self._anthropic_complete(prompt, system, json_mode)
    
    def _openai_complete(self, prompt: str, system: str, json_mode: bool):
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        kwargs = {
            "model": self.config.model,
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }
        
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = self._client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        
        if json_mode:
            return json.loads(content)
        return content
    
    def _anthropic_complete(self, prompt: str, system: str, json_mode: bool):
        kwargs = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        
        if system:
            kwargs["system"] = system
        
        response = self._client.messages.create(**kwargs)
        content = response.content[0].text
        
        if json_mode:
            # Extract JSON from response
            return self._extract_json(content)
        return content
    
    @staticmethod
    def _extract_json(text: str) -> Dict[str, Any]:
        """Extract JSON from text that might have markdown or other formatting"""
        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON in markdown code blocks
        import re
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        
        # Try to find raw JSON object
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        
        raise ValueError(f"Could not extract JSON from response: {text[:200]}")


def render_prompt(template: str, variables: Dict[str, Any]) -> str:
    """
    Render a prompt template with variables.
    Supports {{variable}} syntax.
    """
    result = template
    for key, value in variables.items():
        placeholder = "{{" + key + "}}"
        if isinstance(value, (dict, list)):
            value = json.dumps(value, indent=2)
        result = result.replace(placeholder, str(value))
    return result


def batch_process(
    items: List[Any],
    processor: callable,
    batch_size: int = 10,
    delay_between_batches: float = 1.0
) -> List[Any]:
    """
    Process items in batches with rate limiting.
    Useful for staying within API limits.
    """
    results = []
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        batch_results = [processor(item) for item in batch]
        results.extend(batch_results)
        
        if i + batch_size < len(items):
            time.sleep(delay_between_batches)
    
    return results


# Example usage
if __name__ == "__main__":
    config = LLMConfig(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.1
    )
    
    client = LLMClient(config)
    
    result = client.complete(
        prompt="Classify this email: 'Hi, I'd like to upgrade my plan.'",
        system="You are an email classifier. Return JSON with 'category' and 'priority' fields.",
        json_mode=True
    )
    
    print(json.dumps(result, indent=2))

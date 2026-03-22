"""
Universal Webhook Handler for AI Automations
Drop-in server for receiving and processing webhooks.
"""

import json
import hmac
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Callable, Optional
from dataclasses import dataclass, field
from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class WebhookConfig:
    """Configuration for webhook handler"""
    port: int = 8080
    secret: Optional[str] = None  # For signature verification
    allowed_ips: list = field(default_factory=list)
    rate_limit: int = 100  # requests per minute
    timeout: int = 30


class WebhookHandler:
    """
    Universal webhook handler with:
    - Signature verification
    - Rate limiting
    - Async processing
    - Error handling
    - Logging
    """
    
    def __init__(self, config: WebhookConfig):
        self.config = config
        self.app = Flask(__name__)
        self.handlers: Dict[str, Callable] = {}
        self.request_counts: Dict[str, list] = {}
        
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route('/webhook/<source>', methods=['POST'])
        def handle_webhook(source: str):
            try:
                # Verify signature if configured
                if self.config.secret:
                    if not self._verify_signature(request):
                        return jsonify({"error": "Invalid signature"}), 401
                
                # Check rate limit
                if not self._check_rate_limit(request.remote_addr):
                    return jsonify({"error": "Rate limit exceeded"}), 429
                
                # Parse payload
                payload = request.get_json(force=True)
                
                # Log incoming webhook
                logger.info(f"Webhook received from {source}: {json.dumps(payload)[:200]}")
                
                # Route to handler
                if source in self.handlers:
                    result = self.handlers[source](payload)
                    return jsonify({"success": True, "result": result}), 200
                else:
                    return jsonify({"error": f"No handler for source: {source}"}), 404
                    
            except Exception as e:
                logger.error(f"Webhook error: {str(e)}")
                return jsonify({"error": str(e)}), 500
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})
    
    def _verify_signature(self, req) -> bool:
        """Verify webhook signature (supports multiple formats)"""
        signature = (
            req.headers.get('X-Hub-Signature-256') or  # GitHub
            req.headers.get('X-Signature') or          # Generic
            req.headers.get('Stripe-Signature') or     # Stripe
            ""
        )
        
        if not signature:
            return False
        
        payload = req.get_data()
        expected = hmac.new(
            self.config.secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Handle different signature formats
        if signature.startswith('sha256='):
            signature = signature[7:]
        
        return hmac.compare_digest(signature, expected)
    
    def _check_rate_limit(self, ip: str) -> bool:
        """Simple sliding window rate limiting"""
        now = datetime.utcnow().timestamp()
        window = 60  # 1 minute
        
        if ip not in self.request_counts:
            self.request_counts[ip] = []
        
        # Clean old entries
        self.request_counts[ip] = [
            t for t in self.request_counts[ip]
            if now - t < window
        ]
        
        if len(self.request_counts[ip]) >= self.config.rate_limit:
            return False
        
        self.request_counts[ip].append(now)
        return True
    
    def register(self, source: str, handler: Callable):
        """Register a handler for a webhook source"""
        self.handlers[source] = handler
        logger.info(f"Registered handler for: {source}")
    
    def run(self):
        """Start the webhook server"""
        logger.info(f"Starting webhook server on port {self.config.port}")
        self.app.run(host='0.0.0.0', port=self.config.port)


# Pre-built handlers for common sources

def stripe_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Stripe webhooks"""
    event_type = payload.get('type', '')
    
    handlers = {
        'checkout.session.completed': lambda p: {"action": "fulfill_order", "session": p['data']['object']},
        'customer.subscription.created': lambda p: {"action": "provision_access", "subscription": p['data']['object']},
        'customer.subscription.deleted': lambda p: {"action": "revoke_access", "subscription": p['data']['object']},
        'invoice.payment_failed': lambda p: {"action": "notify_failure", "invoice": p['data']['object']},
    }
    
    if event_type in handlers:
        return handlers[event_type](payload)
    
    return {"action": "log_only", "event_type": event_type}


def github_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GitHub webhooks"""
    event_type = payload.get('action', '')
    
    if 'pull_request' in payload:
        return {
            "action": "pr_event",
            "pr_number": payload['pull_request']['number'],
            "state": payload['pull_request']['state'],
            "title": payload['pull_request']['title']
        }
    
    if 'issue' in payload:
        return {
            "action": "issue_event", 
            "issue_number": payload['issue']['number'],
            "state": payload['issue']['state']
        }
    
    return {"action": "log_only", "event": event_type}


def form_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle generic form submissions"""
    return {
        "action": "process_lead",
        "email": payload.get('email'),
        "name": payload.get('name'),
        "message": payload.get('message'),
        "source": payload.get('source', 'unknown')
    }


# Example usage
if __name__ == "__main__":
    config = WebhookConfig(
        port=8080,
        secret="your-webhook-secret",
        rate_limit=100
    )
    
    handler = WebhookHandler(config)
    
    # Register handlers
    handler.register('stripe', stripe_handler)
    handler.register('github', github_handler)
    handler.register('form', form_handler)
    
    # Custom handler example
    handler.register('custom', lambda p: {"processed": True, "data": p})
    
    handler.run()

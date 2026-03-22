/**
 * Universal Webhook Handler for AI Automations
 * Drop-in server for receiving and processing webhooks.
 * 
 * @module webhook_handler
 */

import express from 'express';
import crypto from 'crypto';

/**
 * @typedef {Object} WebhookConfig
 * @property {number} port
 * @property {string|null} secret - For signature verification
 * @property {string[]} allowedIps
 * @property {number} rateLimit - requests per minute
 * @property {number} timeout
 */

/** @type {WebhookConfig} */
const DEFAULT_CONFIG = {
  port: 8080,
  secret: null,
  allowedIps: [],
  rateLimit: 100,
  timeout: 30000,
};

/**
 * Universal webhook handler with:
 * - Signature verification
 * - Rate limiting
 * - Async processing
 * - Error handling
 * - Logging
 */
class WebhookHandler {
  /**
   * @param {Partial<WebhookConfig>} config 
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.app = express();
    /** @type {Map<string, Function>} */
    this.handlers = new Map();
    /** @type {Map<string, number[]>} */
    this.requestCounts = new Map();

    this._setupMiddleware();
    this._setupRoutes();
  }

  _setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  _setupRoutes() {
    this.app.post('/webhook/:source', async (req, res) => {
      const { source } = req.params;

      try {
        // Verify signature if configured
        if (this.config.secret) {
          if (!this._verifySignature(req)) {
            return res.status(401).json({ error: 'Invalid signature' });
          }
        }

        // Check rate limit
        const clientIp = req.ip || req.socket.remoteAddress;
        if (!this._checkRateLimit(clientIp)) {
          return res.status(429).json({ error: 'Rate limit exceeded' });
        }

        // Log incoming webhook
        console.log(`[Webhook] Received from ${source}:`, JSON.stringify(req.body).slice(0, 200));

        // Route to handler
        if (this.handlers.has(source)) {
          const handler = this.handlers.get(source);
          const result = await handler(req.body);
          return res.status(200).json({ success: true, result });
        } else {
          return res.status(404).json({ error: `No handler for source: ${source}` });
        }
      } catch (err) {
        console.error(`[Webhook] Error:`, err.message);
        return res.status(500).json({ error: err.message });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Verify webhook signature (supports multiple formats)
   * @param {express.Request} req 
   * @returns {boolean}
   */
  _verifySignature(req) {
    const signature =
      req.headers['x-hub-signature-256'] ||  // GitHub
      req.headers['x-signature'] ||          // Generic
      req.headers['stripe-signature'] ||     // Stripe
      '';

    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', this.config.secret)
      .update(payload)
      .digest('hex');

    // Handle different signature formats
    const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    return crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expected, 'hex')
    );
  }

  /**
   * Simple sliding window rate limiting
   * @param {string} ip 
   * @returns {boolean}
   */
  _checkRateLimit(ip) {
    const now = Date.now();
    const window = 60 * 1000; // 1 minute

    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, []);
    }

    const timestamps = this.requestCounts.get(ip);
    
    // Clean old entries
    const filtered = timestamps.filter(t => now - t < window);
    this.requestCounts.set(ip, filtered);

    if (filtered.length >= this.config.rateLimit) {
      return false;
    }

    filtered.push(now);
    return true;
  }

  /**
   * Register a handler for a webhook source
   * @param {string} source 
   * @param {(payload: any) => Promise<any>|any} handler 
   */
  register(source, handler) {
    this.handlers.set(source, handler);
    console.log(`[Webhook] Registered handler for: ${source}`);
  }

  /**
   * Start the webhook server
   */
  run() {
    this.app.listen(this.config.port, () => {
      console.log(`[Webhook] Server running on port ${this.config.port}`);
    });
  }
}

// ============================================
// Pre-built handlers for common sources
// ============================================

/**
 * Handle Stripe webhooks
 * @param {Object} payload 
 */
function stripeHandler(payload) {
  const eventType = payload.type || '';

  const handlers = {
    'checkout.session.completed': (p) => ({
      action: 'fulfill_order',
      session: p.data.object,
    }),
    'customer.subscription.created': (p) => ({
      action: 'provision_access',
      subscription: p.data.object,
    }),
    'customer.subscription.deleted': (p) => ({
      action: 'revoke_access',
      subscription: p.data.object,
    }),
    'invoice.payment_failed': (p) => ({
      action: 'notify_failure',
      invoice: p.data.object,
    }),
  };

  if (eventType in handlers) {
    return handlers[eventType](payload);
  }

  return { action: 'log_only', eventType };
}

/**
 * Handle GitHub webhooks
 * @param {Object} payload 
 */
function githubHandler(payload) {
  const eventType = payload.action || '';

  if (payload.pull_request) {
    return {
      action: 'pr_event',
      prNumber: payload.pull_request.number,
      state: payload.pull_request.state,
      title: payload.pull_request.title,
    };
  }

  if (payload.issue) {
    return {
      action: 'issue_event',
      issueNumber: payload.issue.number,
      state: payload.issue.state,
    };
  }

  return { action: 'log_only', event: eventType };
}

/**
 * Handle generic form submissions
 * @param {Object} payload 
 */
function formHandler(payload) {
  return {
    action: 'process_lead',
    email: payload.email,
    name: payload.name,
    message: payload.message,
    source: payload.source || 'unknown',
  };
}

// ES Module exports
export { WebhookHandler, stripeHandler, githubHandler, formHandler, DEFAULT_CONFIG };

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new WebhookHandler({
    port: 8080,
    secret: 'your-webhook-secret',
    rateLimit: 100,
  });

  // Register handlers
  handler.register('stripe', stripeHandler);
  handler.register('github', githubHandler);
  handler.register('form', formHandler);

  // Custom handler example
  handler.register('custom', (p) => ({ processed: true, data: p }));

  handler.run();
}

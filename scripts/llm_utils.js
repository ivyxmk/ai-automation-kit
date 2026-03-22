/**
 * LLM Utilities for AI Automation
 * Battle-tested helpers for working with OpenAI, Anthropic, and local models.
 * 
 * @module llm_utils
 */

/**
 * @typedef {Object} LLMConfig
 * @property {'openai'|'anthropic'|'local'} provider
 * @property {string} model
 * @property {number} maxTokens
 * @property {number} temperature
 * @property {number} timeout
 * @property {number} maxRetries
 * @property {number} retryDelay
 */

/** @type {LLMConfig} */
const DEFAULT_CONFIG = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 1000,
  temperature: 0.1, // Low for automation tasks
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Sleep helper
 * @param {number} ms 
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 * @template T
 * @param {() => Promise<T>} fn 
 * @param {number} maxRetries 
 * @param {number} baseDelay 
 * @returns {Promise<T>}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Unified client for multiple LLM providers
 */
class LLMClient {
  /**
   * @param {Partial<LLMConfig>} config 
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._client = null;
  }

  /**
   * Initialize the appropriate client
   * @private
   */
  async _initClient() {
    if (this._client) return this._client;

    if (this.config.provider === 'openai') {
      const { default: OpenAI } = await import('openai');
      this._client = new OpenAI();
    } else if (this.config.provider === 'anthropic') {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this._client = new Anthropic();
    } else {
      throw new Error(`Unknown provider: ${this.config.provider}`);
    }

    return this._client;
  }

  /**
   * Get completion from LLM
   * @param {Object} options
   * @param {string} options.prompt - User prompt
   * @param {string} [options.system] - System prompt
   * @param {boolean} [options.jsonMode] - Parse response as JSON
   * @returns {Promise<Object|string>}
   */
  async complete({ prompt, system = '', jsonMode = true }) {
    return retryWithBackoff(async () => {
      await this._initClient();

      if (this.config.provider === 'openai') {
        return this._openaiComplete(prompt, system, jsonMode);
      } else if (this.config.provider === 'anthropic') {
        return this._anthropicComplete(prompt, system, jsonMode);
      }
    }, this.config.maxRetries, this.config.retryDelay);
  }

  /**
   * @private
   */
  async _openaiComplete(prompt, system, jsonMode) {
    const messages = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    const params = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    if (jsonMode) {
      params.response_format = { type: 'json_object' };
    }

    const response = await this._client.chat.completions.create(params);
    const content = response.choices[0].message.content;

    return jsonMode ? JSON.parse(content) : content;
  }

  /**
   * @private
   */
  async _anthropicComplete(prompt, system, jsonMode) {
    const params = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    };

    if (system) {
      params.system = system;
    }

    const response = await this._client.messages.create(params);
    const content = response.content[0].text;

    return jsonMode ? this._extractJson(content) : content;
  }

  /**
   * Extract JSON from text that might have markdown or other formatting
   * @private
   * @param {string} text 
   * @returns {Object}
   */
  _extractJson(text) {
    // Try direct parse first
    try {
      return JSON.parse(text);
    } catch {}

    // Try to find JSON in markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error(`Could not extract JSON from response: ${text.slice(0, 200)}`);
  }
}

/**
 * Render a prompt template with variables
 * Supports {{variable}} syntax
 * @param {string} template 
 * @param {Record<string, any>} variables 
 * @returns {string}
 */
function renderPrompt(template, variables) {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'object' 
      ? JSON.stringify(value, null, 2) 
      : String(value);
    result = result.replaceAll(placeholder, stringValue);
  }
  
  return result;
}

/**
 * Process items in batches with rate limiting
 * @template T, R
 * @param {T[]} items 
 * @param {(item: T) => Promise<R>} processor 
 * @param {Object} [options]
 * @param {number} [options.batchSize]
 * @param {number} [options.delayBetweenBatches]
 * @returns {Promise<R[]>}
 */
async function batchProcess(items, processor, { batchSize = 10, delayBetweenBatches = 1000 } = {}) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (i + batchSize < items.length) {
      await sleep(delayBetweenBatches);
    }
  }
  
  return results;
}

// ES Module exports
export { LLMClient, renderPrompt, batchProcess, retryWithBackoff, DEFAULT_CONFIG };

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new LLMClient({
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.1,
  });

  const result = await client.complete({
    prompt: "Classify this email: 'Hi, I'd like to upgrade my plan.'",
    system: "You are an email classifier. Return JSON with 'category' and 'priority' fields.",
    jsonMode: true,
  });

  console.log(JSON.stringify(result, null, 2));
}

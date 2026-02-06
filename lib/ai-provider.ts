import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { getSupabaseServiceRole } from './supabase-server';

export type AIProvider = 'anthropic' | 'openai' | 'groq' | 'system';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<
    | {
        type: 'text';
        text: string;
      }
    | {
        type: 'image';
        source: {
          type: 'base64';
          media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
          data: string;
        };
      }
  >;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

export interface ModelPricing {
  inputPerMillion: number; // USD per 1M tokens
  outputPerMillion: number; // USD per 1M tokens
}

// Pricing data (as of Feb 2026)
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude
  'claude-sonnet-4-20250514': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-3-haiku-20240307': { inputPerMillion: 0.25, outputPerMillion: 1.25 },
  
  // OpenAI
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30 },
  'gpt-3.5-turbo': { inputPerMillion: 0.5, outputPerMillion: 1.5 },
  
  // Groq (free tier available!)
  'llama-3.3-70b-versatile': { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  'llama-3.1-70b-versatile': { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  'mixtral-8x7b-32768': { inputPerMillion: 0.24, outputPerMillion: 0.24 },
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.warn(`No pricing data for model: ${model}`);
    return 0;
  }

  const inputCost = (promptTokens / 1000000) * pricing.inputPerMillion;
  const outputCost = (completionTokens / 1000000) * pricing.outputPerMillion;
  
  return inputCost + outputCost;
}

/**
 * Get user's preferred API configuration
 */
export async function getUserAPIConfig(userId: string): Promise<{
  provider: AIProvider;
  apiKey: string | null;
  model: string;
} | null> {
  const supabase = getSupabaseServiceRole();
  
  console.log(`[getUserAPIConfig] Fetching config for userId: ${userId}`);
  
  const { data, error } = await supabase
    .from('user_api_configs')
    .select('*')
    .eq('clerk_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getUserAPIConfig] Database error:', error);
    return null;
  }

  if (!data) {
    console.log('[getUserAPIConfig] No active config found');
    return null;
  }

  // Get default model for provider
  const defaultModels: Record<AIProvider, string> = {
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o-mini',
    groq: 'llama-3.3-70b-versatile',
    system: 'claude-sonnet-4-20250514',
  };

  const config = {
    provider: data.provider as AIProvider,
    apiKey: data.api_key,
    model: defaultModels[data.provider as AIProvider],
  };

  console.log(`[getUserAPIConfig] Found config: provider=${config.provider}, hasApiKey=${!!config.apiKey}, model=${config.model}`);

  return config;
}

/**
 * Log API usage for tracking and billing
 */
export async function logAPIUsage(
  userId: string,
  provider: AIProvider,
  model: string,
  feature: string,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
): Promise<void> {
  const supabase = getSupabaseServiceRole();
  const estimatedCost = calculateCost(model, usage.promptTokens, usage.completionTokens);

  await supabase.from('api_usage_logs').insert({
    clerk_id: userId,
    provider,
    model,
    feature,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
    estimated_cost_usd: estimatedCost,
  });
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 4096
): Promise<AIResponse> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    content,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    model: response.model,
    provider: 'anthropic',
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 4096
): Promise<AIResponse> {
  console.log(`[OpenAI] Calling model: ${model}, keyPrefix: ${apiKey.substring(0, 15)}..., maxTokens: ${maxTokens}`);
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : m.content.map(c => c.type === 'text' ? c.text : '').join('\n'),
      })),
    ],
  });
  
  console.log(`[OpenAI] Response received: ${response.usage?.total_tokens} tokens`);

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model,
    provider: 'openai',
  };
}

/**
 * Call Groq API (FREE tier available!)
 */
async function callGroq(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 4096
): Promise<AIResponse> {
  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : m.content.map(c => c.type === 'text' ? c.text : '').join('\n'),
      })),
    ],
  });

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model,
    provider: 'groq',
  };
}

/**
 * Main function to generate AI completion with automatic provider selection
 */
export async function generateAICompletion(
  userId: string,
  feature: string,
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 4096
): Promise<AIResponse> {
  console.log(`[generateAICompletion] Starting for userId=${userId}, feature=${feature}`);
  
  // Try to get user's API configuration
  const userConfig = await getUserAPIConfig(userId);
  
  let provider: AIProvider;
  let apiKey: string;
  let model: string;

  if (userConfig && userConfig.apiKey) {
    // Use user's configured API
    provider = userConfig.provider;
    apiKey = userConfig.apiKey;
    model = userConfig.model;
    console.log(`[generateAICompletion] ✅ Using user's ${provider.toUpperCase()} API with model ${model}`);
  } else {
    // Fallback to system API (your API key)
    provider = 'system';
    apiKey = process.env.ANTHROPIC_API_KEY || '';
    model = 'claude-sonnet-4-20250514';
    console.log(`[generateAICompletion] ⚠️ Using SYSTEM fallback (user has no API key configured)`);
    
    if (!apiKey) {
      throw new Error('No API key available. Please configure your own API key in settings.');
    }

    // Log warning for high usage
    const supabase = getSupabaseServiceRole();
    const { data: recentUsage } = await supabase
      .from('api_usage_logs')
      .select('total_tokens')
      .eq('clerk_id', userId)
      .eq('provider', 'system')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const totalTokens = recentUsage?.reduce((sum, log) => sum + log.total_tokens, 0) || 0;
    const TOKEN_LIMIT = 1000000; // 1M tokens per month on system API
    
    if (totalTokens > TOKEN_LIMIT) {
      throw new Error(
        'You have exceeded the free usage limit. Please add your own API key in Settings > API Configuration to continue using AI features.'
      );
    }
  }

  // Call the appropriate provider
  let response: AIResponse;
  const actualProvider = provider === 'system' ? 'anthropic' : provider;
  console.log(`[generateAICompletion] Calling ${actualProvider} API...`);
  
  try {
    switch (actualProvider) {
      case 'anthropic':
        response = await callAnthropic(apiKey, model, systemPrompt, messages, maxTokens);
        break;
      case 'openai':
        response = await callOpenAI(apiKey, model, systemPrompt, messages, maxTokens);
        break;
      case 'groq':
        response = await callGroq(apiKey, model, systemPrompt, messages, maxTokens);
        break;
      default:
        throw new Error(`Unsupported provider: ${actualProvider}`);
    }

    console.log(`[generateAICompletion] ✅ Success! Used ${response.usage.totalTokens} tokens with ${response.provider}/${response.model}`);

    // Log usage
    await logAPIUsage(userId, provider, response.model, feature, response.usage);

    return response;
  } catch (error: any) {
    console.error(`[generateAICompletion] ❌ Error calling ${actualProvider}:`, error.message);
    console.error('[generateAICompletion] Error details:', {
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    // Provide helpful error messages
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API configuration in settings.');
    } else if (error.status === 429) {
      // More detailed rate limit error
      const errorMessage = error.message || '';
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota')) {
        throw new Error('OpenAI account setup required. This error happens on NEW accounts without a payment method. Add one at: https://platform.openai.com/settings/organization/billing (You need this even if you haven\'t used the API yet)');
      } else if (errorMessage.includes('rate_limit')) {
        throw new Error('OpenAI account has restrictions. This "rate limit" error does NOT mean you overused - it means your account needs setup. Add payment method at: https://platform.openai.com/settings/organization/billing OR check limits at: https://platform.openai.com/account/limits');
      } else {
        throw new Error(`OpenAI error (likely account setup issue): ${errorMessage}. Check: https://platform.openai.com/settings/organization/billing`);
      }
    } else {
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

/**
 * Multimodal AI completion (supports text + images)
 * Only works with Anthropic models currently
 */
export async function generateAICompletionMultimodal(
  userId: string,
  feature: string,
  content: string | any[], // Can be text string or array of text/image blocks
  maxTokens: number = 4096
): Promise<AIResponse> {
  console.log(`[generateAICompletionMultimodal] Starting for userId=${userId}, feature=${feature}`);
  
  // Try to get user's API configuration
  const userConfig = await getUserAPIConfig(userId);
  
  let provider: AIProvider;
  let apiKey: string;
  let model: string;

  if (userConfig && userConfig.apiKey) {
    // Use user's configured API
    provider = userConfig.provider;
    apiKey = userConfig.apiKey;
    model = userConfig.model;
    console.log(`[generateAICompletionMultimodal] ✅ Using user's ${provider.toUpperCase()} API with model ${model}`);
    
    // Multimodal (images) only supported by Anthropic currently
    // If content is array (contains images), enforce Anthropic
    if (Array.isArray(content) && provider !== 'anthropic') {
      console.log(`[generateAICompletionMultimodal] ⚠️ Content has images, but provider is ${provider}. Falling back to system Anthropic.`);
      // Fall back to system for multimodal content
      provider = 'system';
      apiKey = process.env.ANTHROPIC_API_KEY || '';
      model = 'claude-sonnet-4-20250514';
    }
  } else {
    // Fallback to system API (Anthropic)
    provider = 'system';
    apiKey = process.env.ANTHROPIC_API_KEY || '';
    model = 'claude-sonnet-4-20250514';
    console.log(`[generateAICompletionMultimodal] ⚠️ Using SYSTEM fallback (user has no API key configured)`);
    
    if (!apiKey) {
      throw new Error('No API key available. Please configure your own API key in settings.');
    }

    // Check usage limits
    const supabase = getSupabaseServiceRole();
    const { data: recentUsage } = await supabase
      .from('api_usage_logs')
      .select('total_tokens')
      .eq('clerk_id', userId)
      .eq('provider', 'system')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const totalTokens = recentUsage?.reduce((sum, log) => sum + log.total_tokens, 0) || 0;
    const TOKEN_LIMIT = 1000000; // 1M tokens per month on system API
    
    if (totalTokens > TOKEN_LIMIT) {
      throw new Error(
        'You have exceeded the free usage limit. Please add your own API key in Settings > API Configuration to continue using AI features.'
      );
    }
  }

  // If content is text-only and user has OpenAI/Groq, use their provider
  let response: AIResponse;
  const actualProvider = provider === 'system' ? 'anthropic' : provider;
  
  // Convert string content to appropriate format
  const isTextOnly = typeof content === 'string';
  
  console.log(`[generateAICompletionMultimodal] Calling ${actualProvider} API (isTextOnly=${isTextOnly})...`);
  
  try {
    if (isTextOnly && actualProvider !== 'anthropic') {
      // Use OpenAI or Groq for text-only content
      const messages: AIMessage[] = [{ role: 'user', content: content as string }];
      
      switch (actualProvider) {
        case 'openai':
          response = await callOpenAI(apiKey, model, '', messages, maxTokens);
          break;
        case 'groq':
          response = await callGroq(apiKey, model, '', messages, maxTokens);
          break;
        default:
          throw new Error(`Unsupported provider: ${actualProvider}`);
      }
    } else {
      // Use Anthropic for multimodal content or when Anthropic is configured
      const anthropic = new Anthropic({ apiKey });

      const anthropicResponse = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });
      
      const textContent = anthropicResponse.content[0].type === 'text' ? anthropicResponse.content[0].text : '';

      response = {
        content: textContent,
        usage: {
          promptTokens: anthropicResponse.usage.input_tokens,
          completionTokens: anthropicResponse.usage.output_tokens,
          totalTokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens,
        },
        model: anthropicResponse.model,
        provider: provider === 'system' ? 'system' : 'anthropic',
      };
    }

    console.log(`[generateAICompletionMultimodal] ✅ Success! Used ${response.usage.totalTokens} tokens with ${response.provider}/${response.model}`);

    // Log usage
    await logAPIUsage(userId, response.provider, response.model, feature, response.usage);

    return response;
  } catch (error: any) {
    console.error(`[generateAICompletionMultimodal] ❌ Error calling ${actualProvider}:`, error.message);
    
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API configuration in settings.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later or upgrade your API plan.');
    } else if (error.status === 404) {
      throw new Error(`Model not found: ${model}. Please check your API configuration.`);
    } else {
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: AIProvider): string[] {
  const models: Record<AIProvider, string[]> = {
    anthropic: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
    ],
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    groq: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
    ],
    system: ['claude-sonnet-4-20250514'],
  };

  return models[provider] || [];
}

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
  
  const { data } = await supabase
    .from('user_api_configs')
    .select('*')
    .eq('clerk_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return null;
  }

  // Get default model for provider
  const defaultModels: Record<AIProvider, string> = {
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o-mini',
    groq: 'llama-3.3-70b-versatile',
    system: 'claude-sonnet-4-20250514',
  };

  return {
    provider: data.provider as AIProvider,
    apiKey: data.api_key,
    model: defaultModels[data.provider as AIProvider],
  };
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
  } else {
    // Fallback to system API (your API key)
    provider = 'system';
    apiKey = process.env.ANTHROPIC_API_KEY || '';
    model = 'claude-sonnet-4-20250514';
    
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
  
  try {
    switch (provider === 'system' ? 'anthropic' : provider) {
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
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Log usage
    await logAPIUsage(userId, provider, response.model, feature, response.usage);

    return response;
  } catch (error: any) {
    console.error('AI API error:', error);
    
    // Provide helpful error messages
    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API configuration in settings.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later or upgrade your API plan.');
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
    
    // Multimodal only supported by Anthropic currently
    if (provider !== 'anthropic') {
      throw new Error('Multimodal content (images) is only supported with Anthropic models. Please configure an Anthropic API key or use text-only content.');
    }
  } else {
    // Fallback to system API (Anthropic)
    provider = 'system';
    apiKey = process.env.ANTHROPIC_API_KEY || '';
    model = 'claude-sonnet-4-20250514';
    
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

  // Call Anthropic with multimodal content
  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const textContent = response.content[0].type === 'text' ? response.content[0].text : '';

    const aiResponse: AIResponse = {
      content: textContent,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      provider: provider === 'system' ? 'system' : 'anthropic',
    };

    // Log usage
    await logAPIUsage(userId, provider, aiResponse.model, feature, aiResponse.usage);

    return aiResponse;
  } catch (error: any) {
    console.error('AI API error:', error);
    
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

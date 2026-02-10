/**
 * Sources Service
 * Manages all job sources (built-in APIs and custom scrapers)
 * Provides unified interface for source configuration and execution
 */

import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { BaseJobWorker, IngestionResult } from './base-worker';
import { RemoteOKWorker } from './remoteok-worker';
import { RemotiveWorker } from './remotive-worker';
import { AdzunaWorker } from './adzuna-worker';
import { GetOnBoardWorker } from './getonboard-worker';
import { CustomScraperWorker } from './custom-scraper-worker';

export interface SourceConfig {
  id: string;
  source_key: string;
  source_type: 'api' | 'scraper';
  name: string;
  description?: string;
  config: Record<string, any>;
  enabled: boolean;
  is_built_in: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  last_sync_jobs_count?: number;
  last_error?: string;
}

export class SourcesService {
  private supabase = getSupabaseServiceRole();
  
  /**
   * Get all configured sources
   */
  async getAllSources(): Promise<SourceConfig[]> {
    const { data, error } = await this.supabase
      .from('job_sources_config')
      .select('*')
      .order('is_built_in', { ascending: false })
      .order('name');
    
    if (error) {
      console.error('[SourcesService] Error fetching sources:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get only enabled sources
   */
  async getEnabledSources(): Promise<SourceConfig[]> {
    const { data, error } = await this.supabase
      .from('job_sources_config')
      .select('*')
      .eq('enabled', true)
      .order('is_built_in', { ascending: false })
      .order('name');
    
    if (error) {
      console.error('[SourcesService] Error fetching enabled sources:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get a specific source by key
   */
  async getSource(sourceKey: string): Promise<SourceConfig | null> {
    console.log('[SourcesService] Getting source with key:', sourceKey);
    
    const { data, error } = await this.supabase
      .from('job_sources_config')
      .select('*')
      .eq('source_key', sourceKey)
      .maybeSingle();
    
    if (error) {
      console.error(`[SourcesService] Error fetching source ${sourceKey}:`, error);
      return null;
    }
    
    console.log('[SourcesService] Found source:', !!data, data?.name);
    
    return data;
  }
  
  /**
   * Create a worker instance for a source
   */
  createWorker(source: SourceConfig): BaseJobWorker | null {
    try {
      if (source.source_type === 'api') {
        return this.createApiWorker(source);
      } else {
        return this.createScraperWorker(source);
      }
    } catch (err) {
      console.error(`[SourcesService] Error creating worker for ${source.source_key}:`, err);
      return null;
    }
  }
  
  /**
   * Create API worker (RemoteOK, Adzuna, etc.)
   */
  private createApiWorker(source: SourceConfig): BaseJobWorker | null {
    switch (source.source_key) {
      case 'remoteok':
        return new RemoteOKWorker();
      
      case 'remotive':
        return new RemotiveWorker();
      
      case 'adzuna':
        const apiKey = source.config.api_key || process.env.ADZUNA_API_KEY;
        const appId = source.config.app_id || process.env.ADZUNA_APP_ID;
        
        if (!apiKey || !appId) {
          console.warn('[SourcesService] Adzuna API key/app ID not configured');
          return null;
        }
        
        return new AdzunaWorker(apiKey, appId);
      
      case 'getonboard':
        const apiKeyGOB = source.config.api_key || process.env.GETONBOARD_API_KEY;
        
        if (!apiKeyGOB) {
          console.warn('[SourcesService] GetOnBoard API key not configured');
          return null;
        }
        
        return new GetOnBoardWorker(apiKeyGOB);
      
      default:
        console.warn(`[SourcesService] Unknown API source: ${source.source_key}`);
        return null;
    }
  }
  
  /**
   * Create scraper worker for custom sources
   */
  private createScraperWorker(source: SourceConfig): BaseJobWorker | null {
    const url = source.config.url;
    // Check both config.type (new format) and config.source_type (old format)
    const sourceType = source.config.type || source.config.source_type || 'rss';
    const scraperConfig = source.config.config || source.config || {};
    
    console.log(`[SourcesService] Creating scraper for ${source.name}:`, {
      url,
      sourceType,
      hasConfig: !!scraperConfig
    });
    
    if (!url) {
      console.warn(`[SourcesService] Custom source ${source.source_key} has no URL`);
      return null;
    }
    
    // Create the CustomSourceConfig object that the worker expects
    const customSourceConfig = {
      id: source.id,
      name: source.name,
      url: url,
      source_type: sourceType as 'rss' | 'html_list' | 'json_api' | 'custom',
      config: scraperConfig,
    };
    
    return new CustomScraperWorker(customSourceConfig);
  }
  
  /**
   * Update source configuration
   */
  async updateSource(
    sourceKey: string, 
    updates: Partial<Pick<SourceConfig, 'name' | 'description' | 'config' | 'enabled'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('job_sources_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('source_key', sourceKey);
    
    if (error) {
      console.error(`[SourcesService] Error updating source ${sourceKey}:`, error);
      throw error;
    }
  }
  
  /**
   * Update sync status after running a source
   */
  async updateSyncStatus(
    sourceKey: string,
    status: 'success' | 'failed',
    jobsCount: number,
    error?: string
  ): Promise<void> {
    const { error: dbError } = await this.supabase
      .from('job_sources_config')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: status,
        last_sync_jobs_count: jobsCount,
        last_error: error || null,
        updated_at: new Date().toISOString(),
      })
      .eq('source_key', sourceKey);
    
    if (dbError) {
      console.error(`[SourcesService] Error updating sync status for ${sourceKey}:`, dbError);
    }
  }
  
  /**
   * Add a new custom source
   */
  async addCustomSource(
    name: string,
    url: string,
    sourceType: 'rss' | 'html_list' | 'json_api',
    description?: string,
    config?: Record<string, any>
  ): Promise<string> {
    // Generate a unique source key
    const sourceKey = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await this.supabase
      .from('job_sources_config')
      .insert({
        source_key: sourceKey,
        source_type: 'scraper',
        name,
        description,
        config: {
          url,
          source_type: sourceType,
          config: config || {},
        },
        enabled: true,
        is_built_in: false,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[SourcesService] Error adding custom source:', error);
      throw error;
    }
    
    return data.id;
  }
  
  /**
   * Delete a custom source (only non-built-in sources can be deleted)
   */
  async deleteSource(sourceKey: string): Promise<void> {
    // Check if it's a built-in source
    const source = await this.getSource(sourceKey);
    
    if (source?.is_built_in) {
      throw new Error('Cannot delete built-in sources');
    }
    
    const { error } = await this.supabase
      .from('job_sources_config')
      .delete()
      .eq('source_key', sourceKey);
    
    if (error) {
      console.error(`[SourcesService] Error deleting source ${sourceKey}:`, error);
      throw error;
    }
  }
}

/**
 * Ingestion orchestration: run all connectors, dedupe, upsert jobs and job_sources, update metrics.
 */

import { getConfig } from './constants';
import { fetchRecentJobs } from './connectors';
import * as db from './db';
import type { JobSourceEnum } from './types';
import type { SyncMetrics } from './types';
import { logger } from './logger';

const SOURCES: JobSourceEnum[] = ['remoteok', 'remotive', 'adzuna'];

function getSourceJobId(source: JobSourceEnum, rawItem: unknown): string {
  const item = rawItem as Record<string, unknown>;
  if (item?.id != null) return String(item.id);
  return '';
}

function getSourceUrl(source: JobSourceEnum, rawItem: unknown): string | null {
  const item = rawItem as Record<string, unknown>;
  const url = item?.url ?? item?.apply_url ?? item?.redirect_url;
  return url != null ? String(url) : null;
}

export interface SyncResult {
  source: JobSourceEnum;
  jobsFetched: number;
  jobsUpserted: number;
  duplicatesFound: number;
  errorsCount: number;
  error?: string;
}

export async function runSync(correlationId?: string): Promise<SyncResult[]> {
  if (correlationId) logger.info('Starting sync', { correlationId });
  const config = getConfig();
  const results: SyncResult[] = [];

  for (const source of SOURCES) {
    const result: SyncResult = {
      source,
      jobsFetched: 0,
      jobsUpserted: 0,
      duplicatesFound: 0,
      errorsCount: 0,
    };

    try {
      const enabled =
        (source === 'remoteok' && config.remoteokEnabled) ||
        (source === 'remotive' && config.remotiveEnabled) ||
        (source === 'adzuna' && config.adzunaEnabled && !!config.adzunaAppId && !!config.adzunaAppKey);

      if (!enabled) {
        logger.info(`Skipping disabled source: ${source}`);
        results.push(result);
        continue;
      }

      const fetchResult = await fetchRecentJobs(source);
      result.jobsFetched = fetchResult.jobs.length;
      const rawItems = fetchResult.rawItems as Record<string, unknown>[];

      for (let i = 0; i < fetchResult.jobs.length; i++) {
        const job = fetchResult.jobs[i];
        const rawItem = rawItems[i];
        const sourceJobId = rawItem ? getSourceJobId(source, rawItem) : '';
        const sourceUrl = rawItem ? getSourceUrl(source, rawItem) : null;

        try {
          const existing = await db.findJobByDedupeKey(job.dedupe_key);
          const upsertResult = await db.upsertJob(job, existing);
          if (upsertResult.duplicate) result.duplicatesFound++;
          if (upsertResult.inserted) result.jobsUpserted++;

          if (sourceJobId && rawItem) {
            await db.upsertJobSource({
              source,
              sourceJobId,
              sourceUrl,
              rawPayload: rawItem as Record<string, unknown>,
              jobId: upsertResult.jobId,
            });
          }
        } catch (err) {
          result.errorsCount++;
          logger.error(`Upsert failed for ${source} job`, err, {
            title: job.title,
            company: job.company_name,
          });
        }
      }

      const metrics: SyncMetrics = {
        source,
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        jobs_fetched: result.jobsFetched,
        jobs_upserted: result.jobsUpserted,
        duplicates_found: result.duplicatesFound,
        errors_count: result.errorsCount,
      };
      await db.updateSyncMetrics(metrics);
      logger.info(`Sync completed for ${source}`, result as unknown as Record<string, unknown>);
    } catch (err) {
      result.errorsCount++;
      result.error = err instanceof Error ? err.message : String(err);
      logger.error(`Sync failed for ${source}`, err);
      await db.updateSyncMetrics({
        source,
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'error',
        jobs_fetched: result.jobsFetched,
        jobs_upserted: result.jobsUpserted,
        duplicates_found: result.duplicatesFound,
        errors_count: result.errorsCount,
      });
    }

    results.push(result);
  }

  const expireConfig = getConfig();
  const expireDays = expireConfig.jobExpireDays;
  if (expireDays > 0) {
    const notSeenSince = new Date();
    notSeenSince.setDate(notSeenSince.getDate() - expireDays);
    try {
      const expired = await db.markExpiredJobs(notSeenSince);
      if (expired > 0) logger.info(`Marked ${expired} jobs as expired`);
    } catch (err) {
      logger.error('Failed to mark expired jobs', err);
    }
  }

  return results;
}

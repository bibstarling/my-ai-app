/**
 * Job source connectors: fetch from RemoteOK, Remotive, Adzuna.
 */

export { fetchRecentJobsRemoteOK, fetchJobBySourceIdRemoteOK } from './remoteok';
export { fetchRecentJobsRemotive, fetchJobBySourceIdRemotive } from './remotive';
export { fetchRecentJobsAdzuna, fetchJobBySourceIdAdzuna } from './adzuna';

import type { JobSourceEnum } from '../types';
import type { ConnectorFetchResult } from '../types';
import { fetchRecentJobsRemoteOK } from './remoteok';
import { fetchRecentJobsRemotive } from './remotive';
import { fetchRecentJobsAdzuna } from './adzuna';

export async function fetchRecentJobs(
  source: JobSourceEnum
): Promise<ConnectorFetchResult> {
  switch (source) {
    case 'remoteok':
      return fetchRecentJobsRemoteOK();
    case 'remotive':
      return fetchRecentJobsRemotive();
    case 'adzuna':
      return fetchRecentJobsAdzuna();
    default:
      return { jobs: [], source, rawItems: [] };
  }
}

export async function fetchJobBySourceId(
  source: JobSourceEnum,
  sourceId: string,
  country?: string
): Promise<ConnectorFetchResult> {
  switch (source) {
    case 'remoteok':
      return (await import('./remoteok')).fetchJobBySourceIdRemoteOK(sourceId);
    case 'remotive':
      return (await import('./remotive')).fetchJobBySourceIdRemotive(sourceId);
    case 'adzuna':
      return (await import('./adzuna')).fetchJobBySourceIdAdzuna(sourceId, country);
    default:
      return { jobs: [], source, rawItems: [] };
  }
}

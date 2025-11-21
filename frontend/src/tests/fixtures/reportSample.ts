import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Report } from '@/types/api';

const FIXTURE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/sample_api_payloads/report.sample.json',
);

const RAW_SAMPLE = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8')) as Report;

const RESPONSIBLE_FALLBACK =
  'Laporan ini bersifat formatif dan tidak menggantikan penilaian profesional.';

const clone = <T,>(payload: T): T => {
  const serialized = JSON.stringify(payload);
  const parsed: unknown = JSON.parse(serialized);
  return parsed as T;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const coerceDetailString = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (isRecord(value)) {
    const record = value;
    const overview = record.overview;
    if (typeof overview === 'string') {
      return overview;
    }
    return JSON.stringify(record);
  }
  return JSON.stringify(value);
};

const normalizeReportPayload = (report: Report): Report => {
  const normalized = report;
  if (!('owner' in normalized)) {
    normalized.owner = null;
  }
  if (!('shareContext' in normalized)) {
    normalized.shareContext = null;
  }
  const styleBlock = normalized.style;
  if (styleBlock) {
    styleBlock.primary_detail = coerceDetailString(styleBlock.primary_detail);
    styleBlock.backup_detail = coerceDetailString(styleBlock.backup_detail);
  }
  return normalized;
};

export const getSampleReport = (): Report => normalizeReportPayload(clone(RAW_SAMPLE));

export const buildMinimalReport = (): Report => ({
  sessionId: 'preview-empty',
  raw: null,
  percentiles: null,
  style: null,
  lfi: null,
  visualization: null,
  sessionDesigns: [],
  analytics: null,
  learningSpace: null,
  notes: null,
  enhancedAnalytics: null,
  responsibleUseNotice: RAW_SAMPLE.responsibleUseNotice ?? RESPONSIBLE_FALLBACK,
  owner: null,
  shareContext: null,
});

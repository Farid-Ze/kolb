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

const clone = <T,>(payload: T): T => JSON.parse(JSON.stringify(payload));

const normalizeReportPayload = (report: Report): Report => {
  const normalized = report;
  if (!('owner' in normalized)) {
    normalized.owner = null;
  }
  if (!('share_context' in normalized)) {
    normalized.share_context = null;
  }
  const styleBlock = normalized.style as Report['style'];
  if (styleBlock) {
    const detailValue = styleBlock.primary_detail as unknown;
    if (detailValue && typeof detailValue === 'object') {
      const detail = detailValue as Record<string, string>;
      styleBlock.primary_detail = detail.overview ?? JSON.stringify(detail);
    }
    const backupDetail = styleBlock.backup_detail as unknown;
    if (backupDetail && typeof backupDetail === 'object') {
      const detail = backupDetail as Record<string, string>;
      styleBlock.backup_detail = detail.overview ?? JSON.stringify(detail);
    }
  }
  return normalized;
};

export const getSampleReport = (): Report => normalizeReportPayload(clone(RAW_SAMPLE));

export const buildMinimalReport = (): Report => ({
  session_id: 'preview-empty',
  raw: null,
  percentiles: null,
  style: null,
  lfi: null,
  visualization: null,
  session_designs: [],
  analytics: null,
  learning_space: null,
  notes: null,
  enhanced_analytics: null,
  responsible_use_notice: RAW_SAMPLE.responsible_use_notice ?? RESPONSIBLE_FALLBACK,
  owner: null,
  share_context: null,
});

/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScorePreviewAnalytics } from './ScorePreviewAnalytics';
import type { ScorePreviewLFI } from './ScorePreviewLFI';
import type { ScorePreviewPercentiles } from './ScorePreviewPercentiles';
import type { ScorePreviewRaw } from './ScorePreviewRaw';
import type { ScorePreviewStyle } from './ScorePreviewStyle';
export type ScorePreviewResponse = {
    raw: ScorePreviewRaw;
    style: ScorePreviewStyle;
    lfi: ScorePreviewLFI;
    percentiles: ScorePreviewPercentiles;
    analytics: ScorePreviewAnalytics;
};


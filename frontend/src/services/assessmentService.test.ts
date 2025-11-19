import { describe, it, expect } from 'vitest';

import { buildAutosavePayload } from './assessmentService';
import type { AssessmentItem, ItemResponse } from '../types/api';

const buildItem = (itemId: string, order: number): AssessmentItem => ({
  item_id: itemId,
  order,
  prompt: `Prompt ${order}`,
  options: [
    { id: `${itemId}1`, option_code: 'CE', text: 'CE', dimension: 'CE' },
    { id: `${itemId}2`, option_code: 'RO', text: 'RO', dimension: 'RO' },
    { id: `${itemId}3`, option_code: 'AC', text: 'AC', dimension: 'AC' },
    { id: `${itemId}4`, option_code: 'AE', text: 'AE', dimension: 'AE' },
  ],
});

describe('buildAutosavePayload', () => {
  const items: AssessmentItem[] = [buildItem('1', 1), buildItem('2', 2)];

  it('maps completed responses into backend payload shape', () => {
    const responses: ItemResponse[] = [
      {
        item_id: '1',
        ranks: { CE: 1, RO: 2, AC: 3, AE: 4 },
      },
      {
        item_id: '2',
        ranks: { CE: 2, RO: 1, AC: 4, AE: 3 },
      },
    ];

    const payload = buildAutosavePayload(responses, items);

    expect(payload).toEqual({
      responses: [
        {
          item_id: 1,
          ranks: { 11: 1, 12: 2, 13: 3, 14: 4 },
        },
        {
          item_id: 2,
          ranks: { 21: 2, 22: 1, 23: 4, 24: 3 },
        },
      ],
    });
  });

  it('omits incomplete, duplicate, or unknown responses', () => {
    const responses: ItemResponse[] = [
      {
        item_id: '1',
        ranks: { CE: 1, RO: 2 },
      },
      {
        item_id: '2',
        ranks: { CE: 1, RO: 1, AC: 2, AE: 3 },
      },
      {
        item_id: '3',
        ranks: { CE: 1, RO: 2, AC: 3, AE: 4 },
      },
    ];

    const payload = buildAutosavePayload(responses, items);

    expect(payload).toEqual({ responses: [] });
  });
});

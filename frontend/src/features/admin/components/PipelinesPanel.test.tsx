import { describe, expect, it } from 'vitest'

import { validatePercentileOrder } from './PipelinesPanel'

const makeCsvFile = (content: string) => ({
  text: () => Promise.resolve(content),
} as unknown as File)

describe('validatePercentileOrder', () => {
  it('returns null when percentile column is monotonic', async () => {
    const file = makeCsvFile('percentile,value\n0,foo\n10,bar\n20,baz')
    await expect(validatePercentileOrder(file)).resolves.toBeNull()
  })

  it('flags when percentile decreases between rows', async () => {
    const file = makeCsvFile('percentile,value\n0,foo\n15,bar\n5,bad')
    const warning = await validatePercentileOrder(file)
    expect(warning).toMatch(/Row 4 percentile/)
  })

  it('warns when percentile column missing', async () => {
    const file = makeCsvFile('score,value\n0,foo\n5,bar')
    const warning = await validatePercentileOrder(file)
    expect(warning).toMatch(/percentile/i)
  })
})

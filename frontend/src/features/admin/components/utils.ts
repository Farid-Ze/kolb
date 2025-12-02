export async function validatePercentileOrder(file: File): Promise<string | null> {
  try {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length <= 1) {
      return null
    }

    const headers = lines[0]
      .split(',')
      .map((header) => header.trim().toLowerCase())
    const percentileIndex = headers.indexOf('percentile')

    if (percentileIndex === -1) {
      return 'Could not find a "percentile" column. Ensure the CSV exports the backend schema.'
    }

    let lastValue = -Infinity
    for (let i = 1; i < lines.length; i += 1) {
      const columns = lines[i].split(',')
      if (!columns[percentileIndex]) {
        continue
      }

      const rawValue = columns[percentileIndex].trim()
      if (!rawValue) {
        continue
      }

      const value = Number(rawValue)
      if (Number.isNaN(value)) {
        continue
      }

      if (value < lastValue) {
        return `Row ${i + 1} percentile (${value}) is lower than the previous row (${lastValue}). Sort ascending before uploading.`
      }

      lastValue = value
    }

    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return `Unable to pre-validate CSV: ${message}`
  }
}

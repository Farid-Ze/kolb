import { useMutation, useQuery } from '@tanstack/react-query'
import { Activity, RefreshCw, Upload } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '../../../shared/ui/Button'
import { clonePipeline, fetchPerfMetrics, importNorms, listPipelines } from '../api'

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

export function PipelinesPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [normGroup, setNormGroup] = useState('')
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [csvWarning, setCsvWarning] = useState<string | null>(null)
  const [isCheckingCsv, setIsCheckingCsv] = useState(false)
  const [instrumentCode, setInstrumentCode] = useState('klsi4')
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null)
  const [cloneVersion, setCloneVersion] = useState('')
  const [cloneCode, setCloneCode] = useState('')
  const [cloneDescription, setCloneDescription] = useState('')
  const [cloneStatus, setCloneStatus] = useState<string | null>(null)

  const { data: metrics, refetch: refetchMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => fetchPerfMetrics(),
  })

  const {
    data: pipelines,
    refetch: refetchPipelines,
    isLoading: isLoadingPipelines,
  } = useQuery({
    queryKey: ['admin-pipelines', instrumentCode],
    queryFn: () => listPipelines(instrumentCode),
  })

  const importMutation = useMutation({
    mutationFn: (data: { file: File; group: string }) => importNorms(data.file, data.group),
    onSuccess: () => {
      setUploadStatus('Norms imported successfully!')
      setFile(null)
      setNormGroup('')
      setCsvWarning(null)
    },
    onError: (err) => {
      setUploadStatus(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    },
  })

  const analyzeCsv = useCallback(async (selected: File | null) => {
    if (!selected) {
      setCsvWarning(null)
      return
    }
    setIsCheckingCsv(true)
    const warning = await validatePercentileOrder(selected)
    setCsvWarning(warning)
    setIsCheckingCsv(false)
  }, [])

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !normGroup) return
    if (csvWarning) {
      setUploadStatus(csvWarning)
      return
    }
    importMutation.mutate({ file, group: normGroup })
  }

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile)
    setUploadStatus(null)
    analyzeCsv(selectedFile)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-[var(--zen-text)]">Norms Import</h2>
          <p className="text-sm text-[var(--zen-text-muted)]">Upload CSV files to update scoring norms.</p>
        </div>

        <form onSubmit={handleImport} className="space-y-4 rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--zen-text)]">Norm Group</label>
            <input
              type="text"
              value={normGroup}
              onChange={(e) => setNormGroup(e.target.value)}
              placeholder="e.g., undergraduate_2025"
              className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--zen-text)]">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--zen-text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--zen-accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--zen-accent-hover)]"
            />
            {isCheckingCsv && <p className="mt-1 text-xs text-[var(--zen-text-muted)]">Checking percentile ordering…</p>}
            {!isCheckingCsv && csvWarning && (
              <p className="mt-1 text-xs text-amber-600">{csvWarning}</p>
            )}
          </div>
          <Button type="submit" disabled={!file || !normGroup || importMutation.isPending} className="w-full">
            {importMutation.isPending ? (
              'Importing...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Import Norms
              </>
            )}
          </Button>
          {uploadStatus && (
            <p className={`text-sm ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
              {uploadStatus}
            </p>
          )}
        </form>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--zen-text)]">Pipelines</h2>
              <p className="text-sm text-[var(--zen-text-muted)]">View and clone instrument pipelines.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--zen-text)]">Instrument Code</label>
                <input
                  type="text"
                  value={instrumentCode}
                  onChange={(e) => setInstrumentCode(e.target.value)}
                  className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] px-3 py-1.5 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-[var(--zen-text-muted)]">
                  <span>Available Pipelines</span>
                  <button
                    type="button"
                    onClick={() => refetchPipelines()}
                    className="text-[var(--zen-accent)] hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-2 text-xs">
                  {isLoadingPipelines && <p className="text-[var(--zen-text-muted)]">Loading pipelines…</p>}
                  {!isLoadingPipelines && pipelines && pipelines.pipelines.length === 0 && (
                    <p className="text-[var(--zen-text-muted)]">No pipelines found for this instrument.</p>
                  )}
                  {!isLoadingPipelines && pipelines &&
                    pipelines.pipelines.map((pipeline) => (
                      <button
                        type="button"
                        key={pipeline.id}
                        onClick={() => {
                          setSelectedPipelineId(pipeline.id)
                          setCloneCode(pipeline.pipelineCode ?? '')
                          setCloneDescription(pipeline.description ?? '')
                        }}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-[var(--zen-bg)] ${
                          selectedPipelineId === pipeline.id ? 'bg-[var(--zen-bg)]' : ''
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium text-[var(--zen-text)]">v{pipeline.version}</p>
                          {pipeline.description && (
                            <p className="text-[10px] text-[var(--zen-text-muted)]">{pipeline.description}</p>
                          )}
                        </div>
                        {pipeline.isActive && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <form
              className="space-y-3 rounded-md border border-dashed border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-3"
              onSubmit={(e) => {
                e.preventDefault()
                setCloneStatus(null)
                if (!selectedPipelineId || !cloneVersion) {
                  setCloneStatus('Select a source pipeline and provide a version.')
                  return
                }
                clonePipeline(instrumentCode, selectedPipelineId, {
                  version: cloneVersion,
                  pipelineCode: cloneCode || null,
                  description: cloneDescription || null,
                  metadata: null,
                })
                  .then(() => {
                    setCloneStatus('Pipeline cloned successfully.')
                    refetchPipelines()
                  })
                  .catch((err: unknown) => {
                    setCloneStatus(
                      `Clone failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    )
                  })
              }}
            >
              <p className="text-xs font-medium text-[var(--zen-text)]">Clone Selected Pipeline</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--zen-text-muted)]">
                    New Version
                  </label>
                  <input
                    type="text"
                    value={cloneVersion}
                    onChange={(e) => setCloneVersion(e.target.value)}
                    placeholder="e.g., 4.1.0-experiment-a"
                    className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg)] px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--zen-text-muted)]">
                    Pipeline Code (optional)
                  </label>
                  <input
                    type="text"
                    value={cloneCode}
                    onChange={(e) => setCloneCode(e.target.value)}
                    placeholder="e.g., klsi4_default_v4_1"
                    className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg)] px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--zen-text-muted)]">
                  Description (optional)
                </label>
                <textarea
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg)] px-2 py-1.5 text-xs"
                  placeholder="Short label for this experimental pipeline."
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full md:w-auto"
                disabled={!selectedPipelineId || !cloneVersion}
              >
                Clone Pipeline
              </Button>
              {cloneStatus && (
                <p className="text-xs text-[var(--zen-text-muted)]">{cloneStatus}</p>
              )}
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[var(--zen-text)]">System Metrics</h2>
            <p className="text-sm text-[var(--zen-text-muted)]">Performance counters and cache stats.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchMetrics()}>
            <RefreshCw className={`h-4 w-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          {isLoadingMetrics ? (
            <p className="text-sm text-[var(--zen-text-muted)]">Loading metrics...</p>
          ) : metrics ? (
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--zen-text)]">
                  <Activity className="h-4 w-4 text-[var(--zen-accent)]" />
                  Timing
                </h3>
                <pre className="mt-2 overflow-x-auto rounded bg-[var(--zen-bg-elevated)] p-2 text-xs text-[var(--zen-text-muted)]">
                  {JSON.stringify(metrics.timing, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[var(--zen-text)]">Counters</h3>
                <pre className="mt-2 overflow-x-auto rounded bg-[var(--zen-bg-elevated)] p-2 text-xs text-[var(--zen-text-muted)]">
                  {JSON.stringify(metrics.counters, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--zen-text-muted)]">No metrics available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

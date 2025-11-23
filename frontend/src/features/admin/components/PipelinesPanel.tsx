import { useMutation, useQuery } from '@tanstack/react-query'
import { Activity, Upload, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../../shared/ui/Button'
import { fetchPerfMetrics, importNorms } from '../api'

export function PipelinesPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [normGroup, setNormGroup] = useState('')
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const { data: metrics, refetch: refetchMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => fetchPerfMetrics(),
  })

  const importMutation = useMutation({
    mutationFn: (data: { file: File; group: string }) => importNorms(data.file, data.group),
    onSuccess: () => {
      setUploadStatus('Norms imported successfully!')
      setFile(null)
      setNormGroup('')
    },
    onError: (err) => {
      setUploadStatus(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    },
  })

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !normGroup) return
    importMutation.mutate({ file, group: normGroup })
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
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--zen-text-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--zen-accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--zen-accent-hover)]"
            />
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

import type { AssessmentResults } from '../model'

interface StrengthsBlindspotsProps {
  results: AssessmentResults
}

export function StrengthsBlindspots({ results }: StrengthsBlindspotsProps) {
  const strengths = results.strengths ?? []
  const blindspots = results.blindspots ?? []

  if (!strengths.length && !blindspots.length) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-400">
          <span className="text-lg">✨</span> Strengths
        </h3>
        <ul className="space-y-2">
          {strengths.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-emerald-100/80">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {item}
            </li>
          ))}
          {!strengths.length && <li className="text-sm italic text-emerald-100/40">No specific strengths identified yet.</li>}
        </ul>
      </div>

      <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-400">
          <span className="text-lg">⚠️</span> Blind Spots
        </h3>
        <ul className="space-y-2">
          {blindspots.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-amber-100/80">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {item}
            </li>
          ))}
          {!blindspots.length && <li className="text-sm italic text-amber-100/40">No specific blind spots identified yet.</li>}
        </ul>
      </div>
    </div>
  )
}

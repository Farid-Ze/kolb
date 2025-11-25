import type { UserAchievementOut } from '../../../shared/api/generated'

interface UserBadgeRowProps {
  achievements?: UserAchievementOut[] | null
}

export function UserBadgeRow({ achievements }: UserBadgeRowProps) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--zen-text-muted)]">
        <span>No badges yet.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="flex items-center gap-2 rounded-full border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] px-3 py-1"
          title={`Awarded on ${new Date(achievement.awardedAt).toLocaleDateString()}`}
        >
          <span className="text-lg">
            {achievement.badge.rarity === 'Legendary' ? '👑' : achievement.badge.rarity === 'Epic' ? '🌟' : '🏅'}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--zen-text)]">{achievement.badge.name}</span>
            <span className="text-[10px] uppercase text-[var(--zen-text-muted)]">{achievement.badge.rarity}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

import { BADGE_DEFS } from '../types'

interface Props {
  earnedBadges: string[]
}

const ALL_BADGES = Object.keys(BADGE_DEFS)

export default function BadgesPanel({ earnedBadges }: Props) {
  const earned = new Set(earnedBadges)

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Badges</h3>
      <div className="grid grid-cols-3 gap-2">
        {ALL_BADGES.map((key) => {
          const def = BADGE_DEFS[key]
          const isEarned = earned.has(key)
          return (
            <div
              key={key}
              title={isEarned ? def.desc : `Locked: ${def.desc}`}
              className={`flex flex-col items-center p-2 rounded-lg text-center transition-opacity ${
                isEarned
                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                  : 'bg-gray-50 dark:bg-gray-700/30 opacity-40'
              }`}
            >
              <span className="text-2xl">{def.icon}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 leading-tight">
                {def.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

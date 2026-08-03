interface Props {
  currentStreak: number
  longestStreak: number
  weeklyRate: number
}

export default function StreakCard({ currentStreak, longestStreak, weeklyRate }: Props) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Activity</h3>

      <div className="flex gap-4">
        <div className="flex-1 text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
          <div className="text-3xl font-bold text-orange-500">🔥 {currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Streak</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">days</div>
        </div>
        <div className="flex-1 text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
          <div className="text-3xl font-bold text-yellow-600">🏆 {longestStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Best Streak</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">days</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Weekly Progress</span>
          <span className="font-medium">{weeklyRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(weeklyRate, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Active days this week</p>
      </div>
    </div>
  )
}

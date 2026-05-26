export default function BadgeCard({ badge }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
      <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
        badge?.unlocked ? 'bg-yellow-400' : 'bg-gray-200'
      }`}>
        <span className="text-2xl">{badge?.icon || '🏆'}</span>
      </div>
      <h3 className="font-semibold mb-2">{badge?.name || 'Badge Name'}</h3>
      <p className="text-sm text-gray-600">{badge?.description || 'Badge description'}</p>
      {badge?.unlocked && (
        <span className="inline-block mt-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
          Unlocked
        </span>
      )}
    </div>
  )
}

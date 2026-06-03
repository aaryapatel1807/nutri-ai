export default function ExerciseCard({ exercise }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{exercise?.name || 'Exercise Name'}</h3>
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
          {exercise?.difficulty || 'Medium'}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{exercise?.description || 'Exercise description'}</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <span className="text-gray-500">Sets</span>
          <p className="font-semibold">{exercise?.sets || '3'}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Reps</span>
          <p className="font-semibold">{exercise?.reps || '12'}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Weight</span>
          <p className="font-semibold">{exercise?.weight || '50kg'}</p>
        </div>
      </div>
    </div>
  )
}

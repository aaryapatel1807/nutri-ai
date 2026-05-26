export default function RecipeCard({ recipe }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4">
      <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-gray-500">Recipe Image</span>
      </div>
      <h3 className="font-semibold text-lg mb-2">{recipe?.name || 'Recipe Name'}</h3>
      <p className="text-gray-600 text-sm mb-3">{recipe?.description || 'Recipe description'}</p>
      <div className="flex justify-between text-sm text-gray-500">
        <span>⏱️ {recipe?.time || '30 min'}</span>
        <span>🔥 {recipe?.calories || '250 cal'}</span>
      </div>
    </div>
  )
}

import { useState } from 'react'

export default function IngredientInput() {
  const [ingredients, setIngredients] = useState([])
  const [input, setInput] = useState('')
  
  const addIngredient = () => {
    if (input.trim()) {
      setIngredients([...ingredients, input.trim()])
      setInput('')
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
          placeholder="Add an ingredient..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={addIngredient}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient, index) => (
          <span
            key={index}
            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
          >
            {ingredient}
          </span>
        ))}
      </div>
    </div>
  )
}

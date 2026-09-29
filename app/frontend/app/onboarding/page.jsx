'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import NeonButton from '@/components/shared/NeonButton'
import GlassCard from '@/components/shared/GlassCard'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { auth } from '@/lib/api'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
    diet: '',
    activity: ''
  })

  const router = useRouter()

  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return 0
    const heightM = formData.height / 100
    return (formData.weight / (heightM * heightM)).toFixed(1)
  }

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#4FD3ED' }
    if (bmi < 25) return { label: 'Normal', color: '#15B2CF' }
    if (bmi < 30) return { label: 'Overweight', color: '#FFD700' }
    return { label: 'Obese', color: '#1FA8C9' }
  }

  const [stepError, setStepError] = useState('')
  const [finishing, setFinishing] = useState(false)

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.name.trim()) return 'Please tell us your name'
      const age = Number(formData.age)
      if (!formData.age || isNaN(age) || age < 10 || age > 120) return 'Enter a valid age (10–120)'
      if (!formData.gender) return 'Please pick an option'
    }
    if (step === 2) {
      const h = Number(formData.height), w = Number(formData.weight)
      if (!formData.height || isNaN(h) || h < 100 || h > 250) return 'Enter a valid height in cm (100–250)'
      if (!formData.weight || isNaN(w) || w < 30 || w > 300) return 'Enter a valid weight in kg (30–300)'
    }
    if (step === 3 && !formData.goal) return 'Pick a fitness goal to continue'
    if (step === 4 && !formData.diet) return 'Pick a diet preference to continue'
    if (step === 5 && !formData.activity) return 'Pick your activity level to continue'
    return ''
  }

  const finishOnboarding = async () => {
    setFinishing(true); setStepError('')
    try {
      await auth.updateProfile({
        name: formData.name.trim(),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        fitnessGoal: formData.goal,
        dietType: formData.diet,
        activityLevel: formData.activity,
      })
      try { localStorage.setItem('nutriai_onboarded', '1') } catch {}
    } catch (e) {
      // don't trap the user — keep going, the dashboard will use defaults
      console.error('Onboarding save failed:', e.message)
    } finally {
      window.location.href = '/dashboard'
    }
  }

  const nextStep = () => {
    const err = validateStep(currentStep)
    if (err) { setStepError(err); return }
    setStepError('')
    if (currentStep < 5) setCurrentStep(currentStep + 1)
    else finishOnboarding()
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-[#15B2CF] transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-2.5 h-2.5 rounded-full transition-all ${step < currentStep
                ? 'bg-[#15B2CF]'
                : step === currentStep
                  ? 'border-2 border-[#15B2CF] bg-transparent'
                  : 'bg-white/15'
                }`}
            >
              {step < currentStep && <span className="text-xs">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-[600px] w-full p-10"
      >
        <GlassCard className="w-full p-10">
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-8">
                  Let's get to know you 👋
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="input-dark"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => updateFormData('age', e.target.value)}
                    className="input-dark"
                  />
                  <div className="flex gap-3">
                    {['Male', 'Female', 'Other'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => updateFormData('gender', gender)}
                        className={`px-4 py-2 rounded-lg transition-all ${formData.gender === gender
                          ? 'bg-[#15B2CF] text-black'
                          : 'glass text-[var(--text-primary)]'
                          }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-8">
                  Your body metrics 📏
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Height (cm)"
                      value={formData.height}
                      onChange={(e) => updateFormData('height', e.target.value)}
                      className="input-dark"
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      value={formData.weight}
                      onChange={(e) => updateFormData('weight', e.target.value)}
                      className="input-dark"
                    />
                  </div>

                  {/* Live BMI Card */}
                  {formData.height && formData.weight && (
                    <div className="glass p-6 text-center">
                      <div
                        className="font-display text-4xl"
                        style={{ color: getBMIStatus(calculateBMI()).color }}
                      >
                        {calculateBMI()}
                      </div>
                      <div className="text-[var(--text-primary)] mt-2">
                        {getBMIStatus(calculateBMI()).label}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-8">
                  What's your mission? 🎯
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'lose', emoji: '🔥', title: 'Lose Weight', desc: 'Burn fat, feel lighter' },
                    { id: 'muscle', emoji: '💪', title: 'Build Muscle', desc: 'Get stronger, build mass' },
                    { id: 'healthy', emoji: '🧘', title: 'Stay Healthy', desc: 'Maintain & feel great' },
                    { id: 'fit', emoji: '🏃', title: 'Get Fit', desc: 'Boost stamina & energy' }
                  ].map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => updateFormData('goal', goal.id)}
                      className={`glass p-4 text-left transition-all ${formData.goal === goal.id
                        ? 'border-2 border-[#15B2CF] shadow-[0_0_20px_rgba(21, 178, 207,0.3)]'
                        : 'border border-white/10'
                        }`}
                    >
                      <div className={`text-2xl mb-2 ${formData.goal === goal.id ? 'scale-120' : ''
                        }`}>
                        {goal.emoji}
                      </div>
                      <div className="font-display text-[var(--text-primary)]">{goal.title}</div>
                      <div className="text-[var(--text-muted)] text-sm">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-8">
                  How do you eat? 🌿
                </h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'vegetarian', emoji: '🌱', label: 'Vegetarian' },
                    { id: 'vegan', emoji: '🌿', label: 'Vegan' },
                    { id: 'nonveg', emoji: '🍗', label: 'Non-Veg' },
                    { id: 'keto', emoji: '🥩', label: 'Keto' },
                    { id: 'any', emoji: '🍽️', label: 'Any' }
                  ].map((diet) => (
                    <button
                      key={diet.id}
                      onClick={() => updateFormData('diet', diet.id)}
                      className={`px-4 py-2 rounded-full transition-all ${formData.diet === diet.id
                        ? 'bg-[#15B2CF] text-black'
                        : 'glass text-[var(--text-primary)]'
                        }`}
                    >
                      <span className="mr-2">{diet.emoji}</span>
                      {diet.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5 */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl text-[var(--text-primary)] mb-8">
                  How active are you? ⚡
                </h2>
                <div className="space-y-4">
                  {[
                    { id: 'beginner', emoji: '🐣', label: 'Beginner' },
                    { id: 'intermediate', emoji: '⚡', label: 'Intermediate' },
                    { id: 'advanced', emoji: '🔥', label: 'Advanced' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => updateFormData('activity', level.id)}
                      className={`w-full glass p-4 text-left transition-all flex items-center gap-4 ${formData.activity === level.id
                        ? 'border-2 border-[#15B2CF] shadow-[0_0_20px_rgba(21, 178, 207,0.3)]'
                        : 'border border-white/10'
                        }`}
                    >
                      <span className="text-2xl">{level.emoji}</span>
                      <span className="font-display text-[var(--text-primary)]">{level.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <NeonButton variant="ghost" onClick={prevStep}>
                ← Back
              </NeonButton>
            )}
            <div className="flex-1" />
            {stepError && <span className="text-red-400 text-sm self-center mr-3">{stepError}</span>}
            <NeonButton onClick={nextStep} loading={finishing}>
              {finishing ? 'Saving...' : currentStep === 5 ? "Let's Go! →" : "Continue →"}
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { auth } from '../lib/api'
import { fadeInUp } from '../lib/animations'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const router = useRouter()

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`,
        { email: loginForm.email, password: loginForm.password }
      )

      const { token, user } = response.data

      // Save to localStorage
      localStorage.setItem('nutriai_token', token)
      localStorage.setItem('nutriai_user', JSON.stringify(user))

      console.log('Login success, redirecting...')

      // Force hard redirect to dashboard
      window.location.href = '/dashboard'

    } catch (err) {
      console.log('Login error:', err.response?.data)
      setError(err.response?.data?.error || 'Login failed')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setLoading(false)
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`,
        {
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password
        }
      )

      const { token, user } = response.data
      localStorage.setItem('nutriai_token', token)
      localStorage.setItem('nutriai_user', JSON.stringify(user))

      console.log('Register success, redirecting...')
      window.location.href = '/dashboard'

    } catch (err) {
      console.log('Register error:', err.response?.data)
      setError(err.response?.data?.error || 'Registration failed')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] overflow-hidden relative">

      {/* LEFT PANEL - HERO SECTION */}
      <div className="w-[60%] flex flex-col justify-center p-[80px_60px] relative">

        {/* Background Orbs */}
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,255,135,0.06)_0%,transparent_70%)] rounded-full animate-[float_8s_ease-in-out_infinite] pointer-events-none z-0" />
        <div className="absolute bottom-[20%] left-[25%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(123,97,255,0.05)_0%,transparent_70%)] rounded-full animate-[float_12s_ease-in-out_infinite_reverse] pointer-events-none z-0" />

        {/* Hero Content */}
        <div className="relative z-1">
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="font-['Clash_Display'] text-[5rem] font-bold text-[#F0F0FF] leading-[1.1] m-0"
          >
            YOUR BODY.
          </motion.h1>
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
            className="font-['Clash_Display'] text-[5rem] font-bold text-[#F0F0FF] leading-[1.1] m-0"
          >
            YOUR DATA.
          </motion.h1>
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
            className="font-['Clash_Display'] text-[5rem] font-bold text-[#00FF87] leading-[1.1] m-0 shadow-[0_0_40px_rgba(0,255,135,0.6)]"
          >
            YOUR AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-[#6B7280] text-[1.1rem] mt-6 max-w-[500px]"
          >
            Track nutrition. Predict health. Get fit with AI.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            {['🍕 Food Detection', '📈 AI Forecasting', '🤖 Health Chatbot'].map((feature, index) => (
              <motion.div
                key={feature}
                whileHover={{ scale: 1.05 }}
                className="bg-[rgba(22,22,31,0.7)] border border-[rgba(0,255,135,0.2)] rounded-[99px] px-4 py-2 text-white text-[0.85rem]"
              >
                {feature}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL - AUTH SECTION */}
      <div className="w-[40%] flex items-center justify-center p-10">

        {/* Auth Glass Card */}
        <div className="bg-[rgba(22,22,31,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-10 w-full max-w-[420px]">

          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="font-['Clash_Display'] text-[1.8rem] text-[#F0F0FF] m-0">🥗 NutriAI</h2>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-[rgba(255,255,255,0.05)] rounded-[99px] p-1 mb-7">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 px-2 font-bold border-0 rounded-[99px] cursor-pointer transition-all duration-200 ${
                activeTab === 'login' ? 'bg-[#00FF87] text-black' : 'bg-transparent text-[#6B7280]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 px-2 font-bold border-0 rounded-[99px] cursor-pointer transition-all duration-200 ${
                activeTab === 'signup' ? 'bg-[#00FF87] text-black' : 'bg-transparent text-[#6B7280]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] px-3 py-3 rounded-lg mb-4 text-[0.875rem] text-center">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleLogin} className="flex flex-col">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-3 box-border"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-5 box-border"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 font-bold border-0 rounded-xl text-base cursor-pointer mt-2 transition-all duration-200 bg-gradient-to-r from-[#00FF87] to-[#00D4FF] text-black ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'opacity-100'
                  }`}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* OR Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-[#6B7280] text-[0.875rem]">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                disabled={loading}
                className={`w-full py-3 font-semibold border border-white/20 rounded-xl text-[0.95rem] cursor-pointer transition-all duration-200 ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                } bg-transparent text-[#F0F0FF]`}
              >
                Continue with Google
              </button>
            </motion.div>
          )}

          {/* SIGNUP FORM */}
          {activeTab === 'signup' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSignup} className="flex flex-col">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-3 box-border"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  required
                  disabled={loading}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-3 box-border"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-3 box-border"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full bg-[#16161F] border border-white/10 rounded-xl px-4 py-3 text-[#F0F0FF] text-[0.95rem] outline-none mb-5 box-border"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 font-bold border-0 rounded-xl text-base cursor-pointer mt-2 transition-all duration-200 bg-gradient-to-r from-[#00FF87] to-[#00D4FF] text-black ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'opacity-100'
                  }`}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Footer */}
          <p className="text-center text-[#6B7280] text-[0.75rem] mt-6">
            No credit card required · Free forever
          </p>
        </div>
      </div>

    </div>
  )
}

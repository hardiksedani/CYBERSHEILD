import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Mail, User, Key } from 'lucide-react'
import { supabase } from '../supabaseClient'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, onAuth, currentLicense, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setError('')
      setSuccess('')
    }
  }, [isOpen, initialMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        })

        if (error) throw error

        setSuccess('Registration successful! Please log in.')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        return
      }

      // Login Mode
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Successful Login
      // We'll optionally fetch the user's tier from a custom users table later, 
      // but for now, we default to free or pro based on what is passed around.
      const license = {
        tier: 'free', // We will update this later in Razorpay step
        email: data.user.email,
        name: data.user.user_metadata?.full_name || 'User',
        activated: new Date().toISOString()
      }

      onAuth(license)
      onClose()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setSuccess('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="auth-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
          >
            <button className="auth-close" onClick={onClose}>
              <X size={24} />
            </button>

            <div className="auth-header">
              <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{mode === 'login' ? 'Enter your credentials to access your account' : 'Sign up to start securing your applications'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="auth-field">
                  <label>Full Name</label>
                  <div className="auth-input-group">
                    <User size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label>Email Address</label>
                <div className="auth-input-group">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-group">
                  <Key size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="auth-field">
                  <label>Confirm Password</label>
                  <div className="auth-input-group">
                    <Lock size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {success && (
                <motion.div
                  className="auth-success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    color: '#00ff88', fontSize: '14px', marginBottom: '16px', textAlign: 'center',
                    background: 'rgba(0,255,136,0.1)', padding: '10px', borderRadius: '4px',
                    border: '1px solid rgba(0,255,136,0.2)'
                  }}
                >
                  {success}
                </motion.div>
              )}

              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="btn-auth-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Register')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button type="button" className="auth-link" onClick={toggleMode}>
                  {mode === 'login' ? 'Register here' : 'Log in here'}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

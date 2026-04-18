import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import LegajoForm from './components/LegajoForm'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <p style={{ color:'var(--text3)' }}>Cargando...</p>
    </div>
  )

  return (
    <Routes>
      <Route path="/login"        element={!session ? <Login />      : <Navigate to="/" />} />
      <Route path="/"             element={ session  ? <Dashboard />  : <Navigate to="/login" />} />
      <Route path="/legajo/nuevo" element={ session  ? <LegajoForm /> : <Navigate to="/login" />} />
      <Route path="/legajo/:id"   element={ session  ? <LegajoForm /> : <Navigate to="/login" />} />
    </Routes>
  )
}
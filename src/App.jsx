import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import LegajoForm from './components/LegajoForm'
import Evaluacion from './grafogenesis/Evaluacion'
import Cuestionario from './grafogenesis/Cuestionario'
import AdminGrafo from './grafogenesis/AdminGrafo'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <p style={{ color:'var(--text3)' }}>Cargando...</p>
    </div>
  )

  return (
    <Routes>
      {/* PÚBLICAS — sin login */}
      <Route path="/evaluacion"              element={<Evaluacion />} />
      <Route path="/evaluacion/cuestionario" element={<Cuestionario />} />

      {/* PRIVADAS — requieren login */}
      <Route path="/login"         element={!session ? <Login />      : <Navigate to="/" />} />
      <Route path="/"              element={ session  ? <Dashboard />  : <Navigate to="/login" />} />
      <Route path="/legajo/nuevo"  element={ session  ? <LegajoForm /> : <Navigate to="/login" />} />
      <Route path="/legajo/:id"    element={ session  ? <LegajoForm /> : <Navigate to="/login" />} />
      <Route path="/grafogenesis"  element={ session  ? <AdminGrafo /> : <Navigate to="/login" />} />
    </Routes>
  )
}
import { Navigate, useLocation } from 'react-router-dom'
import Loading from './Loading'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Checking your session..." />
  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

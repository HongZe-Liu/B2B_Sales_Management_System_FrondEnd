import { useEffect } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  clearAuthSession,
  getDefaultAuthenticatedPath,
  getStoredUser,
  isAdminUser,
} from './api/auth.js'
import { getStoredAccessToken, setUnauthorizedHandler } from './api/http.js'
import Admin from './pages/Admin/Admin.jsx'
import Calculator from './pages/Calculator/Calculator.jsx'
import DataAnalysis from './pages/DataAnalysis/DataAnalysis.jsx'
import FormCollection from './pages/FormCollectionPage/FormCollection.jsx'
import Login from './pages/Login/Login.jsx'
import PersonalInformation from './pages/PersonalInformation/PersonalInformation.jsx'
import Quotation from './pages/Quotation/Quotation.jsx'

const DEFAULT_PUBLIC_PATH = '/login'

function isAuthenticated() {
  return Boolean(getStoredAccessToken())
}

function RootRedirect() {
  return (
    <Navigate
      replace
      to={
        isAuthenticated()
          ? getDefaultAuthenticatedPath()
          : DEFAULT_PUBLIC_PATH
      }
    />
  )
}

function PublicLoginRoute() {
  if (isAuthenticated()) {
    return (
      <Navigate
        replace
        to={getDefaultAuthenticatedPath()}
      />
    )
  }

  return <Login />
}

function ProtectedRoute() {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

function AdminProtectedRoute() {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!isAdminUser(getStoredUser())) {
    return <Navigate replace to={getDefaultAuthenticatedPath()} />
  }

  return <Outlet />
}

function UnauthorizedHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthSession()
      navigate('/login', {
        replace: true,
        state: { from: location },
      })
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [location, navigate])

  return null
}

function App() {
  return (
    <>
      <UnauthorizedHandler />
      <Routes>
        <Route element={<RootRedirect />} path="/" />
        <Route element={<PublicLoginRoute />} path="/login" />
        <Route element={<FormCollection />} path="/form-collection" />

        <Route element={<AdminProtectedRoute />}>
          <Route element={<Admin />} path="/admin" />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Quotation />} path="/dashboard/quotation" />
          <Route element={<Calculator />} path="/dashboard/calculator" />
          <Route element={<DataAnalysis />} path="/dashboard/data-analysis" />
          <Route element={<PersonalInformation />} path="/dashboard/profile" />
        </Route>

        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </>
  )
}

export default App

import { Navigate, createBrowserRouter } from 'react-router'

import AppLayout from '@/components/Layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/Auth/Login'
import RegisterPage from '@/pages/Auth/Register'
import AssessmentPage from '@/pages/Assessment/Assessment'
import HistoryPage from '@/pages/History/History'
import NotFoundPage from '@/pages/NotFound/NotFound'
import ProfilePage from '@/pages/Profile/Profile'
import SettingsPage from '@/pages/Settings/Settings'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/assessment" />,
          },
          {
            path: 'assessment',
            element: <AssessmentPage />,
          },
          {
            path: 'history',
            element: <HistoryPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

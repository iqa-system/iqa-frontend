import { createBrowserRouter, redirect } from 'react-router'

import { ProtectedLayout } from '@/layouts/protected-layout'
import { RootErrorBoundary } from '@/layouts/root-error-boundary'
import { RootLayout } from '@/layouts/root-layout'
import { Component as NotFoundPage } from '@/pages/not-found'

// 所有路由数组统一收敛在这里, 并使用 React Router 数据模式的 lazy 路由模块.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        index: true,
        loader: () => redirect('/assess'),
      },
      {
        path: 'auth',
        lazy: () => import('@/pages/auth'),
      },
      {
        Component: ProtectedLayout,
        children: [
          {
            path: 'assess',
            lazy: () => import('@/pages/assess'),
            handle: {
              keepAlive: true,
            },
          },
          {
            path: 'history',
            lazy: () => import('@/pages/history'),
            handle: {
              keepAlive: true,
            },
          },
          {
            path: 'profile',
            lazy: () => import('@/pages/profile'),
          },
        ],
      },
      {
        path: '*',
        Component: NotFoundPage,
      },
    ],
  },
])

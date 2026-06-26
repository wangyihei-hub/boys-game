import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/play" replace />
      },
      {
        path: 'play',
        element: <div>学科小勇士 - 游戏加载中...</div>
      }
    ]
  }
]);

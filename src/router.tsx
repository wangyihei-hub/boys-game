import { createHashRouter, Navigate } from 'react-router-dom';
import { PlayLayout } from './components/layout/PlayLayout';
import { ParentLayout } from './components/layout/ParentLayout';
import { PlayHome } from './pages/PlayHome';
import { ParentDashboard } from './pages/ParentDashboard';
import { GenerateQuestions } from './pages/GenerateQuestions';
import { QuestionBank } from './pages/QuestionBank';

export const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/play" replace />
  },
  {
    path: '/play',
    element: <PlayLayout />,
    children: [
      { index: true, element: <PlayHome /> }
    ]
  },
  {
    path: '/parent',
    element: <ParentLayout />,
    children: [
      { index: true, element: <ParentDashboard /> },
      { path: 'generate', element: <GenerateQuestions /> },
      { path: 'bank', element: <QuestionBank /> }
    ]
  }
]);

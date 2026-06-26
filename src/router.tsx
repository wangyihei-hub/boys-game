import { createHashRouter, Navigate } from 'react-router-dom';
import { PlayLayout } from './components/layout/PlayLayout';
import { ParentLayout } from './components/layout/ParentLayout';
import { PlayHome } from './pages/PlayHome';
import { WorldMap } from './pages/WorldMap';
import { Battle } from './pages/Battle';
import { BattleResult } from './pages/BattleResult';
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
      { index: true, element: <PlayHome /> },
      { path: 'map', element: <WorldMap /> },
      { path: 'battle/:subject/:stageId', element: <Battle /> },
      { path: 'battle-result', element: <BattleResult /> }
    ]
  },
  {
    path: '/parent',
    element: <ParentLayout />,
    children: [
      { index: true, element: <ParentDashboard /> },
      { path: 'questions', element: <QuestionBank /> },
      { path: 'questions/generate', element: <GenerateQuestions /> }
    ]
  }
]);

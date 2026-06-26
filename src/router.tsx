import { createHashRouter, Navigate } from 'react-router-dom';
import { PlayLayout } from './components/layout/PlayLayout';
import { ParentLayout } from './components/layout/ParentLayout';
import { PlayHome } from './pages/PlayHome';
import { WorldMap } from './pages/WorldMap';
import { Battle } from './pages/Battle';
import { BattleResult } from './pages/BattleResult';
import { RewardShop } from './pages/RewardShop';
import { WrongQuestions } from './pages/WrongQuestions';
import { Achievements } from './pages/Achievements';
import { DailyTasks } from './pages/DailyTasks';
import { Lottery } from './pages/Lottery';
import { Shop } from './pages/Shop';
import { EquipmentPanel } from './components/play/EquipmentPanel';
import { PetPanel } from './components/play/PetPanel';
import { ParentDashboard } from './pages/ParentDashboard';
import { GenerateQuestions } from './pages/GenerateQuestions';
import { QuestionBank } from './pages/QuestionBank';
import { ParentRewardPool } from './pages/ParentRewardPool';
import { ParentRedemptions } from './pages/ParentRedemptions';
import { ParentSettings } from './pages/parent/ParentSettings';

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
      { path: 'battle-result', element: <BattleResult /> },
      { path: 'rewards', element: <RewardShop /> },
      { path: 'wrong', element: <WrongQuestions /> },
      { path: 'achievements', element: <Achievements /> },
      { path: 'tasks', element: <DailyTasks /> },
      { path: 'lottery', element: <Lottery /> },
      { path: 'shop', element: <Shop /> },
      { path: 'equipment', element: <EquipmentPanel /> },
      { path: 'pet', element: <PetPanel /> }
    ]
  },
  {
    path: '/parent',
    element: <ParentLayout />,
    children: [
      { index: true, element: <ParentDashboard /> },
      { path: 'questions', element: <QuestionBank /> },
      { path: 'questions/generate', element: <GenerateQuestions /> },
      { path: 'rewards', element: <ParentRewardPool /> },
      { path: 'redemptions', element: <ParentRedemptions /> },
      { path: 'settings', element: <ParentSettings /> }
    ]
  }
]);

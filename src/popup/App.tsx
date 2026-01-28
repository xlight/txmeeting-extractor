/**
 * App 主组件
 */

import React from 'react';
import { MeetingDataProvider } from './contexts/MeetingDataContext';
import { UIStateProvider } from './contexts/UIStateContext';
import { TopBar } from './components/layout/TopBar';
import { MainLayout } from './components/layout/MainLayout';
import './styles/variables.css';
import './styles.css';

export default function App() {
  console.log('[App] App 组件正在渲染...');

  return (
    <MeetingDataProvider>
      <UIStateProvider>
        <div className="app">
          <TopBar />
          <MainLayout />
        </div>
      </UIStateProvider>
    </MeetingDataProvider>
  );
}

/**
 * ContentArea 组件 - 内容区域
 */

import React from 'react';
import { useUIState } from '../../contexts/UIStateContext';
import { OverviewView } from '../views/OverviewView';
import { TranscriptView } from '../views/TranscriptView';
import { ChaptersView } from '../views/ChaptersView';
import { MinutesView } from '../views/MinutesView';
import styles from './ContentArea.module.css';

export function ContentArea() {
  const { currentView } = useUIState();

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView />;
      case 'transcript':
        return <TranscriptView />;
      case 'chapters':
        return <ChaptersView />;
      case 'minutes':
        return <MinutesView />;
      default:
        return <OverviewView />;
    }
  };

  return <div className={styles.contentArea}>{renderView()}</div>;
}

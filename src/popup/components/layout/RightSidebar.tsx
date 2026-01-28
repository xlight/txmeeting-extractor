/**
 * RightSidebar 组件 - 右侧边栏
 */

import React, { useState } from 'react';
import { useUIState } from '../../contexts/UIStateContext';
import { TodoListPanel } from '../features/TodoListPanel';
import { KeyMomentsPanel } from '../features/KeyMomentsPanel';
import styles from './RightSidebar.module.css';

type PanelType = 'todo' | 'moments' | null;

export function RightSidebar() {
  const { rightSidebarCollapsed, toggleRightSidebar } = useUIState();
  const [activePanel, setActivePanel] = useState<PanelType>('todo');

  if (rightSidebarCollapsed) {
    return (
      <div className={styles.sidebarCollapsed}>
        <button
          className={styles.expandButton}
          onClick={toggleRightSidebar}
          aria-label="展开辅助面板"
        >
          ◀
        </button>
      </div>
    );
  }

  const togglePanel = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>辅助面板</h3>
        <button
          className={styles.collapseButton}
          onClick={toggleRightSidebar}
          aria-label="折叠辅助面板"
        >
          ▶
        </button>
      </div>

      <div className={styles.panelsContainer}>
        {/* 待办事项面板 */}
        <div className={styles.panelSection}>
          <button
            className={`${styles.panelToggle} ${
              activePanel === 'todo' ? styles.active : ''
            }`}
            onClick={() => togglePanel('todo')}
          >
            <span className={styles.panelIcon}>✓</span>
            <span className={styles.panelLabel}>待办事项</span>
            <span className={styles.toggleIcon}>
              {activePanel === 'todo' ? '▼' : '▶'}
            </span>
          </button>
          {activePanel === 'todo' && (
            <div className={styles.panelContent}>
              <TodoListPanel />
            </div>
          )}
        </div>

        {/* 关键时刻面板 */}
        <div className={styles.panelSection}>
          <button
            className={`${styles.panelToggle} ${
              activePanel === 'moments' ? styles.active : ''
            }`}
            onClick={() => togglePanel('moments')}
          >
            <span className={styles.panelIcon}>⭐</span>
            <span className={styles.panelLabel}>关键时刻</span>
            <span className={styles.toggleIcon}>
              {activePanel === 'moments' ? '▼' : '▶'}
            </span>
          </button>
          {activePanel === 'moments' && (
            <div className={styles.panelContent}>
              <KeyMomentsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

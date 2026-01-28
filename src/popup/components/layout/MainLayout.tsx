/**
 * MainLayout 组件 - 主布局容器
 */

import React from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { ContentArea } from './ContentArea';
import styles from './MainLayout.module.css';

export function MainLayout() {
  return (
    <div className={styles.mainLayout}>
      <LeftSidebar />
      <ContentArea />
      <RightSidebar />
    </div>
  );
}

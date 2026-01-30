/**
 * MainLayout 组件 - 主布局容器
 */

import React from 'react';
import { ContentArea } from './ContentArea';
import styles from './MainLayout.module.css';

export function MainLayout() {
  return (
    <div className={styles.mainLayout}>
      <ContentArea />
    </div>
  );
}

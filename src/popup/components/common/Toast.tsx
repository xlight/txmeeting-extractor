/**
 * Toast 通知组件
 */

import React from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.icon}>✓</span>
      <span className={styles.message}>{message}</span>
    </div>
  );
};

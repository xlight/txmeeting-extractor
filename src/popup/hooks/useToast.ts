/**
 * Toast 通知 Hook
 */

import { useState, useCallback } from 'react';

export interface ToastState {
  message: string;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    visible: false,
  });

  const showToast = useCallback((message: string, duration = 2000) => {
    setToast({ message, visible: true });

    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ message: '', visible: false });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}

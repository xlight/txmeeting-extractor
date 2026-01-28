/**
 * UIStateContext - UI 状态管理
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { ViewMode, UIState } from '../types/ui';

interface UIStateContextValue extends UIState {
  // 视图切换
  setCurrentView: (view: ViewMode) => void;

  // 搜索
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: number[]) => void;

  // 侧边栏
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;

  // 时间/章节导航
  setCurrentTime: (time: number) => void;
  setCurrentChapter: (id: string | number | null) => void;

  // 高亮
  setHighlightedTranscriptIndex: (index: number | null) => void;
}

const UIStateContext = createContext<UIStateContextValue | undefined>(
  undefined
);

const STORAGE_KEY = 'txmeeting-ui-state';

export function UIStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UIState>(() => {
    // 从 localStorage 恢复状态
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentView: parsed.currentView || 'overview',
          searchQuery: '',
          searchResults: [],
          leftSidebarCollapsed: parsed.leftSidebarCollapsed || false,
          rightSidebarCollapsed: parsed.rightSidebarCollapsed || false,
          currentTime: 0,
          currentChapterId: null,
          highlightedTranscriptIndex: null,
        };
      }
    } catch (err) {
      console.error('恢复 UI 状态失败:', err);
    }

    return {
      currentView: 'overview',
      searchQuery: '',
      searchResults: [],
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      currentTime: 0,
      currentChapterId: null,
      highlightedTranscriptIndex: null,
    };
  });

  // 保存状态到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentView: state.currentView,
          leftSidebarCollapsed: state.leftSidebarCollapsed,
          rightSidebarCollapsed: state.rightSidebarCollapsed,
        })
      );
    } catch (err) {
      console.error('保存 UI 状态失败:', err);
    }
  }, [
    state.currentView,
    state.leftSidebarCollapsed,
    state.rightSidebarCollapsed,
  ]);

  const setCurrentView = useCallback((view: ViewMode) => {
    setState((prev) => ({ ...prev, currentView: view }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSearchResults = useCallback((results: number[]) => {
    setState((prev) => ({ ...prev, searchResults: results }));
  }, []);

  const toggleLeftSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      leftSidebarCollapsed: !prev.leftSidebarCollapsed,
    }));
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rightSidebarCollapsed: !prev.rightSidebarCollapsed,
    }));
  }, []);

  const setLeftSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, leftSidebarCollapsed: collapsed }));
  }, []);

  const setRightSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, rightSidebarCollapsed: collapsed }));
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setCurrentChapter = useCallback((id: string | number | null) => {
    setState((prev) => ({ ...prev, currentChapterId: id }));
  }, []);

  const setHighlightedTranscriptIndex = useCallback((index: number | null) => {
    setState((prev) => ({ ...prev, highlightedTranscriptIndex: index }));

    // 3 秒后自动取消高亮
    if (index !== null) {
      setTimeout(() => {
        setState((prev) => ({ ...prev, highlightedTranscriptIndex: null }));
      }, 3000);
    }
  }, []);

  const value: UIStateContextValue = {
    ...state,
    setCurrentView,
    setSearchQuery,
    setSearchResults,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebarCollapsed,
    setRightSidebarCollapsed,
    setCurrentTime,
    setCurrentChapter,
    setHighlightedTranscriptIndex,
  };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
}

export function useUIState(): UIStateContextValue {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}

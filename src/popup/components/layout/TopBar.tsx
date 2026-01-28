/**
 * TopBar 组件 - 顶部导航栏
 */

import React, { useState, useRef, useEffect } from 'react';
import { useUIState } from '../../contexts/UIStateContext';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { generateMarkdownMinutes } from '../../utils/minutes';
import type { ViewMode } from '../../types/ui';
import styles from './TopBar.module.css';

export function TopBar() {
  const { currentView, setCurrentView, searchQuery, setSearchQuery } =
    useUIState();
  const { meetingData } = useMeetingData();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // 搜索框展开时自动聚焦
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // 同步外部 searchQuery 到本地状态
  useEffect(() => {
    setLocalSearchValue(searchQuery);
  }, [searchQuery]);

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器（300ms）
    debounceTimerRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      // 如果有搜索内容，自动切换到转写视图
      if (value.trim()) {
        setCurrentView('transcript');
      }
    }, 300);
  };

  const handleSearchClear = () => {
    setLocalSearchValue('');
    setSearchQuery('');
    setSearchExpanded(false);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleExport = () => {
    if (!meetingData) return;

    // 生成 Markdown 纪要
    const markdownContent = generateMarkdownMinutes(meetingData);
    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${meetingData.metadata.meeting_id || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewTabs: { key: ViewMode; label: string }[] = [
    { key: 'overview', label: '概览' },
    { key: 'transcript', label: '转写' },
    { key: 'chapters', label: '章节' },
    { key: 'minutes', label: '纪要' },
  ];

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📝</span>
          <span className={styles.logoText}>会议助手</span>
        </div>

        <div className={styles.viewTabs}>
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.viewTab} ${currentView === tab.key ? styles.active : ''}`}
              onClick={() => handleViewChange(tab.key)}
              aria-label={`切换到${tab.label}视图`}
              aria-current={currentView === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div
          className={`${styles.searchContainer} ${searchExpanded ? styles.expanded : ''}`}
        >
          {searchExpanded ? (
            <>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="搜索转写内容..."
                value={localSearchValue}
                onChange={handleSearchChange}
              />
              {localSearchValue && (
                <button
                  className={styles.searchClear}
                  onClick={handleSearchClear}
                  aria-label="清除搜索"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            <button
              className={styles.searchButton}
              onClick={() => setSearchExpanded(true)}
              aria-label="展开搜索"
            >
              🔍
            </button>
          )}
        </div>

        <button
          className={styles.exportButton}
          onClick={handleExport}
          aria-label="导出数据"
        >
          导出
        </button>
      </div>
    </div>
  );
}

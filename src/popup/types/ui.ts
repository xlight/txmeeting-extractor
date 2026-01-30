/**
 * UI 状态类型定义
 */

/**
 * 视图模式
 */
export type ViewMode = 'overview' | 'transcript' | 'chapters' | 'summary';

/**
 * UI 状态接口
 */
export interface UIState {
  // 视图状态
  currentView: ViewMode;

  // 搜索状态
  searchQuery: string;
  searchResults: number[]; // 转写项索引数组

  // 交互状态
  currentTime: number; // 当前查看的时间点 (ms)
  currentChapterId: string | number | null;

  // 高亮状态
  highlightedTranscriptIndex: number | null;
}

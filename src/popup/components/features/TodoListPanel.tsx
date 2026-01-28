/**
 * TodoListPanel 组件 - 待办事项面板
 * 显示在右侧边栏，展示会议中的待办事项
 */

import React from 'react';
import { useMeetingData } from '../../contexts/MeetingDataContext';
import { useUIState } from '../../contexts/UIStateContext';
import { formatTime } from '../../utils/format';
import styles from './TodoListPanel.module.css';

export function TodoListPanel() {
  const { meetingData } = useMeetingData();
  const { setCurrentTime, setCurrentView } = useUIState();

  if (!meetingData?.todo_list || meetingData.todo_list.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无待办事项</p>
      </div>
    );
  }

  // 按优先级排序：高优先级在前
  const sortedTodos = [...meetingData.todo_list].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    return priorityB - priorityA;
  });

  const handleTodoClick = (todoId: string) => {
    // 如果待办事项有关联的时间点，可以跳转
    // 目前 API 中待办事项没有直接的时间点，所以这里暂不处理跳转
    console.log('Todo clicked:', todoId);
  };

  const getPriorityLabel = (priority?: number): string => {
    if (!priority) return '';
    if (priority >= 3) return '高';
    if (priority === 2) return '中';
    return '低';
  };

  const getPriorityClass = (priority?: number): string => {
    if (!priority) return '';
    if (priority >= 3) return styles.priorityHigh;
    if (priority === 2) return styles.priorityMedium;
    return styles.priorityLow;
  };

  return (
    <div className={styles.todoPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>待办事项</h3>
        <span className={styles.count}>{meetingData.todo_list.length}</span>
      </div>

      <div className={styles.todoList}>
        {sortedTodos.map((todo) => (
          <div
            key={todo.todo_id}
            className={styles.todoItem}
            onClick={() => handleTodoClick(todo.todo_id)}
          >
            <div className={styles.todoHeader}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={todo.status === 1}
                readOnly
                onClick={(e) => e.stopPropagation()}
              />
              <span
                className={`${styles.todoContent} ${
                  todo.status === 1 ? styles.completed : ''
                }`}
              >
                {todo.content}
              </span>
            </div>

            <div className={styles.todoMeta}>
              {todo.priority && (
                <span
                  className={`${styles.priority} ${getPriorityClass(todo.priority)}`}
                >
                  {getPriorityLabel(todo.priority)}
                </span>
              )}
              {todo.assignee && (
                <span className={styles.assignee}>👤 {todo.assignee}</span>
              )}
              {todo.due_date && (
                <span className={styles.dueDate}>📅 {todo.due_date}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

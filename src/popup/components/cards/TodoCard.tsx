/**
 * TodoCard 组件 - 待办事项卡片
 */

import React, { useCallback, useMemo } from 'react';
import { TodoItemData } from '../../../types/meeting';
import { todosToMarkdown } from '../../utils/markdown';
import styles from './Card.module.css';

interface TodoCardProps {
  todos: TodoItemData[];
  onCopy?: () => void;
}

export const TodoCard = React.memo<TodoCardProps>(({ todos, onCopy }) => {
  // 缓存 Markdown 转换结果
  const markdown = useMemo(() => todosToMarkdown(todos), [todos]);

  // 复制处理函数
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      onCopy?.();
    } catch (error) {
      console.error('[TodoCard] 复制失败:', error);
    }
  }, [markdown, onCopy]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleWithBadge}>
          <h2 className={styles.cardTitle}>✅ 待办事项</h2>
          {todos && todos.length > 0 && (
            <span className={styles.badge}>{todos.length}</span>
          )}
        </div>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="复制待办事项"
        >
          📋 复制
        </button>
      </div>

      <div className={styles.cardContent}>
        {todos && todos.length > 0 ? (
          <div className={styles.todosList}>
            {todos.map((todo, index) => (
              <div key={todo.todo_id} className={styles.todoItem}>
                <div className={styles.todoHeader}>
                  <span className={styles.todoNumber}>{index + 1}</span>
                  <h3 className={styles.todoName}>{todo.todo_name}</h3>
                </div>

                <div className={styles.todoMeta}>
                  {/* 时间 */}
                  {todo.todo_time && (
                    <div className={styles.todoMetaItem}>
                      <span className={styles.metaIcon}>🕒</span>
                      <span className={styles.metaText}>{todo.todo_time}</span>
                    </div>
                  )}

                  {/* 相关人员 */}
                  {todo.persons && todo.persons.length > 0 && (
                    <div className={styles.todoMetaItem}>
                      <span className={styles.metaIcon}>👥</span>
                      <span className={styles.metaText}>
                        {todo.persons.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 背景说明 */}
                {todo.background && (
                  <div className={styles.todoBackground}>
                    <span className={styles.backgroundLabel}>背景: </span>
                    <span className={styles.backgroundText}>
                      {todo.background}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} role="status">
            暂无待办事项
          </div>
        )}
      </div>
    </div>
  );
});

TodoCard.displayName = 'TodoCard';

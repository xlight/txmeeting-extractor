import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

console.log('[Popup] 开始加载 Popup...');

const rootElement = document.getElementById('root');
console.log('[Popup] Root element:', rootElement);

if (!rootElement) {
  console.error('[Popup] 找不到 root 元素!');
} else {
  const root = ReactDOM.createRoot(rootElement);
  console.log('[Popup] React root 已创建，开始渲染...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[Popup] React 渲染已触发');
}

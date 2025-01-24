import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { PostContentComponent } from './PostContentComponent';
import './PostContent.less';
import type { PostContent } from '../types/forum';

// 获取vscode API
declare global {
  interface Window {
    acquireVsCodeApi: () => any;
  }
}

// 在组件外部获取 vscode API，确保只获取一次
const vscode = window.acquireVsCodeApi();

const App: React.FC = () => {
  const [content, setContent] = useState<(PostContent & { id: string }) | null>(null);
  const [hasValidCredentials, setHasValidCredentials] = useState(false);

  useEffect(() => {
    // 监听来自 VSCode 的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      console.log('Received message:', message);

      switch (message.type) {
        case 'setContent':
          console.log('Setting content:', message.content);
          setContent(message.content);
          break;
        case 'setCredentials':
          console.log('Setting credentials:', message.hasValidCredentials);
          setHasValidCredentials(message.hasValidCredentials);
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // 清理函数
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  if (!content) {
    return <div style={{ textAlign: 'center', marginTop: '20px' }}>Loading...</div>;
  }

  return (
    <React.StrictMode>
      <PostContentComponent
        content={content}
        vscode={vscode}
        hasValidCredentials={hasValidCredentials}
      />
    </React.StrictMode>
  );
};

// 等待 DOM 加载完成后再渲染
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting to render React component');

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  ReactDOM.render(<App />, rootElement);
});

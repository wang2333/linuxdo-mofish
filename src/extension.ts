// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ForumService, ForumPost } from './forumService';
import { ForumTreeDataProvider } from './forumTreeDataProvider';
import * as path from 'path';
import axios from 'axios';

console.log('扩展开始加载...');
console.log('当前时间:', new Date().toISOString());
console.log('VSCode版本:', vscode.version);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('扩展 "linuxdo" 已激活!');

  const forumService = ForumService.getInstance();
  const treeDataProvider = new ForumTreeDataProvider(forumService);

  // 注册帖子列表视图
  const treeView = vscode.window.createTreeView('linuxdoPosts', {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true
  });

  // 注册分页命令
  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.nextPage', (item: any) => {
      if (item && item.type) {
        treeDataProvider.handlePaging(item, true);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.prevPage', (item: any) => {
      if (item && item.type) {
        treeDataProvider.handlePaging(item, false);
      }
    })
  );

  // 注册重置命令
  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.resetPage', (item: any) => {
      if (item && item.type) {
        treeDataProvider.handleReset(item);
      }
    })
  );

  // 监听展开/折叠事件
  context.subscriptions.push(
    treeView.onDidExpandElement(async e => {
      if ('type' in e.element) {
        await treeDataProvider.handleGroupExpansion(e.element, true);
      }
    })
  );

  context.subscriptions.push(
    treeView.onDidCollapseElement(async e => {
      if ('type' in e.element) {
        await treeDataProvider.handleGroupExpansion(e.element, false);
      }
    })
  );

  // 注册打开帖子命令
  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.openPost', async (post: ForumPost) => {
      try {
        // 创建并显示新的webview
        const panel = vscode.window.createWebviewPanel(
          'postContent',
          post.title,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        const postContent = await forumService.getPostContent(post.id);

        // 获取 webview 的 html 内容
        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'postContent.js');
        const scriptUri = panel.webview.asWebviewUri(scriptPath);

        // 设置 webview 内容
        panel.webview.html = getWebviewContent(scriptUri);

        // 等待一小段时间后发送内容，确保 webview 已经加载完成
        setTimeout(() => {
          panel.webview.postMessage({
            type: 'setContent',
            content: { ...postContent, id: post.id }
          });
        }, 500);

        // 监听 webview 消息
        panel.webview.onDidReceiveMessage(
          async message => {
            console.log('Received message from webview:', message);
            if (message.type === 'loadMoreComments') {
              try {
                // 获取下一批评论的 ID
                const nextPostIds = await forumService.getNextCommentIds(
                  message.postId,
                  message.lastCommentId,
                  message.allPostIds
                );

                if (nextPostIds.length > 0) {
                  // 加载更多评论
                  const moreComments = await forumService.loadMoreComments(
                    message.postId,
                    nextPostIds
                  );

                  // 发送评论数据回 webview
                  panel.webview.postMessage({
                    type: 'moreComments',
                    comments: moreComments,
                    hasMoreComments: nextPostIds.length === 20 // 如果返回20条说明可能还有更多
                  });
                }
              } catch (error) {
                console.error('加载更多评论失败:', error);
                vscode.window.showErrorMessage('加载更多评论失败');
              }
            }
          },
          undefined,
          context.subscriptions
        );
      } catch (error) {
        console.error('打开帖子失败:', error);
        vscode.window.showErrorMessage('打开帖子失败');
      }
    })
  );

  console.log('命令注册完成');
}

function getWebviewContent(scriptUri: vscode.Uri): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: vscode-resource:; script-src 'unsafe-eval' 'unsafe-inline' vscode-resource: https:; style-src 'unsafe-inline';">
      <title>帖子内容</title>
      <script>
        window.process = {
          env: {
            NODE_ENV: 'production'
          }
        };
      </script>
  </head>
  <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
  </body>
  </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}

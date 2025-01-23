// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ForumService } from './services/forumService';
import { ForumPost } from './types/forum';
import { ForumTreeDataProvider } from './forumTreeDataProvider';

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

  // 注册登录命令
  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.login', async () => {
      const config = vscode.workspace.getConfiguration('linuxdo');
      const currentCookie = config.get<string>('cookie') || '';
      const currentToken = config.get<string>('csrfToken') || '';

      // 第一步：输入Cookie
      const cookie = await vscode.window.showInputBox({
        prompt: '请输入Linux.do网站的Cookie',
        placeHolder: '从浏览器开发者工具中复制Cookie，留空则保持现有设置',
        value: currentCookie
      });

      // cookie为undefined表示用户取消了输入
      if (cookie === undefined) {
        return;
      }

      // 第二步：输入CSRF Token
      const csrfToken = await vscode.window.showInputBox({
        prompt: '请输入Linux.do网站的CSRF Token',
        placeHolder: '从浏览器开发者工具中复制X-CSRF-Token，留空则保持现有设置',
        value: currentToken
      });

      // csrfToken为undefined表示用户取消了输入
      if (csrfToken === undefined) {
        return;
      }

      // 只有当输入了新值且不为空时才更新配置
      if (cookie !== currentCookie && cookie.trim() !== '') {
        await config.update('cookie', cookie, true);
      }
      if (csrfToken !== currentToken && csrfToken.trim() !== '') {
        await config.update('csrfToken', csrfToken, true);
      }

      vscode.window.showInformationMessage('设置已更新！');
      // 刷新帖子列表
      treeDataProvider.refresh();
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

  // 处理标题长度，超过指定长度时截断并添加省略号
  function truncateTitle(title: string, maxLength: number = 10): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 1) + '…';
  }

  // 注册打开帖子命令
  context.subscriptions.push(
    vscode.commands.registerCommand('linuxdo.openPost', async (post: ForumPost) => {
      try {
        // 创建并显示新的webview
        const panel = vscode.window.createWebviewPanel(
          'postContent',
          truncateTitle(post.title),
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
            } else if (message.type === 'reply') {
              try {
                // 发送回复
                await forumService.replyToPost(
                  message.postId,
                  message.content,
                  message.replyToId,
                  message.categoryId
                );

                // 回复成功后重新获取帖子内容
                const postContent = await forumService.getPostContent(message.postId);

                // 发送新的内容到webview
                panel.webview.postMessage({
                  type: 'setContent',
                  content: { ...postContent, id: message.postId }
                });

                vscode.window.showInformationMessage('回复成功！');
              } catch (error) {
                console.error('回复失败:', error);
                vscode.window.showErrorMessage('回复失败，请确保已登录并重试');
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
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: vscode-resource:; script-src 'unsafe-eval' 'unsafe-inline' vscode-resource: https:; style-src 'unsafe-inline'; connect-src https:;">
      <title>帖子内容</title>
      <script>
        window.process = {
          env: {
            NODE_ENV: 'production'
          }
        };
      </script>
      <style>
        .title-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .title {
          margin: 0;
          flex: 1;
        }
        .external-link {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          margin-left: 12px;
          color: #0366d6;
          text-decoration: none;
          border: 1px solid #0366d6;
          border-radius: 3px;
          font-size: 12px;
        }
        .external-link:hover {
          background-color: #0366d61a;
        }
      </style>
  </head>
  <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
  </body>
  </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}

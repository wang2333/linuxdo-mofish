import * as vscode from 'vscode';
import { ForumPost } from '../../types/forum';
import { ForumService } from '../../services/forumService';

export class PostWebviewManager {
  private currentPanel: vscode.WebviewPanel | undefined;
  private static instance: PostWebviewManager | undefined;
  private context: vscode.ExtensionContext;
  private forumService: ForumService;

  private constructor(context: vscode.ExtensionContext, forumService: ForumService) {
    this.context = context;
    this.forumService = forumService;
  }

  public static getInstance(
    context: vscode.ExtensionContext,
    forumService: ForumService
  ): PostWebviewManager {
    if (!PostWebviewManager.instance) {
      PostWebviewManager.instance = new PostWebviewManager(context, forumService);
    }
    return PostWebviewManager.instance;
  }

  /**
   * 打开帖子
   * @param post 帖子
   */
  async openPost(post: ForumPost): Promise<void> {
    // 如果已有打开的panel，先关闭它
    if (this.currentPanel) {
      this.currentPanel.dispose();
      this.currentPanel = undefined;
    }

    const panel = vscode.window.createWebviewPanel(
      'postContent',
      this.truncateTitle(post.title),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // 保存当前panel的引用
    this.currentPanel = panel;

    // 监听panel关闭事件
    panel.onDidDispose(() => {
      this.currentPanel = undefined;
    });

    const postContent = await this.forumService.getPostContent(post.id);
    const scriptPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'postContent.js');
    const scriptUri = panel.webview.asWebviewUri(scriptPath);

    panel.webview.html = this.getWebviewContent(scriptUri);

    setTimeout(() => {
      panel.webview.postMessage({
        type: 'setContent',
        content: { ...postContent, id: post.id }
      });
    }, 500);

    this.setupMessageHandlers(panel, Number(post.id));
  }

  /**
   * 截断标题
   * @param title 标题
   * @param maxLength 最大长度
   * @returns 截断后的标题
   */
  private truncateTitle(title: string, maxLength: number = 10): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 1) + '…';
  }

  /**
   * 获取Webview内容
   * @param scriptUri 脚本URI
   * @returns Webview内容
   */
  private getWebviewContent(scriptUri: vscode.Uri): string {
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
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * 设置消息处理器
   * @param panel 面板
   * @param postId 帖子ID
   */
  private setupMessageHandlers(panel: vscode.WebviewPanel, postId: number): void {
    panel.webview.onDidReceiveMessage(
      async message => {
        console.log('Received message from webview:', message);

        switch (message.type) {
          case 'loadMoreComments':
            await this.handleLoadMoreComments(panel, message);
            break;
          case 'reply':
            await this.handleReply(panel, message);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * 处理加载更多评论
   * @param panel 面板
   * @param message 消息
   */
  private async handleLoadMoreComments(panel: vscode.WebviewPanel, message: any): Promise<void> {
    try {
      const nextPostIds = await this.forumService.getNextCommentIds(
        message.lastCommentId,
        message.allPostIds
      );

      if (nextPostIds.length > 0) {
        const moreComments = await this.forumService.loadMoreComments(message.postId, nextPostIds);

        panel.webview.postMessage({
          type: 'moreComments',
          comments: moreComments,
          hasMoreComments: nextPostIds.length === 20
        });
      }
    } catch (error) {
      console.error('加载更多评论失败:', error);
      vscode.window.showErrorMessage('加载更多评论失败');
    }
  }

  /**
   * 处理回复
   * @param panel 面板
   * @param message 消息
   */
  private async handleReply(panel: vscode.WebviewPanel, message: any): Promise<void> {
    try {
      await this.forumService.replyToPost(
        message.postId,
        message.content,
        message.replyToId,
        message.categoryId
      );

      const postContent = await this.forumService.getPostContent(message.postId);

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
}

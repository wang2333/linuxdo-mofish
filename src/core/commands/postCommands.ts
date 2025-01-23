import * as vscode from 'vscode';
import { ForumPost } from '../../types/forum';
import { ForumService } from '../../services/forumService';
import { Settings } from '../config/settings';
import { PostWebviewManager } from '../webview/postWebviewManager';
export class PostCommands {
  /**
   * 构造函数
   * @param context 扩展上下文
   * @param forumService 论坛服务
   * @param treeDataProvider 树数据提供者
   */
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly forumService: ForumService,
    private readonly treeDataProvider: any
  ) {}

  /**
   * 注册帖子相关命令
   */
  register(): void {
    // 注册帖子相关命令
    this.context.subscriptions.push(
      vscode.commands.registerCommand('linuxdo.openPost', this.openPost.bind(this)),
      vscode.commands.registerCommand('linuxdo.nextPage', this.nextPage.bind(this)),
      vscode.commands.registerCommand('linuxdo.prevPage', this.prevPage.bind(this)),
      vscode.commands.registerCommand('linuxdo.resetPage', this.resetPage.bind(this)),
      vscode.commands.registerCommand('linuxdo.login', this.login.bind(this))
    );
  }

  /**
   * 打开帖子
   * @param post 帖子
   */
  private async openPost(post: ForumPost): Promise<void> {
    try {
      const webviewManager = PostWebviewManager.getInstance(this.context, this.forumService);
      await webviewManager.openPost(post);
    } catch (error) {
      console.error('打开帖子失败:', error);
      vscode.window.showErrorMessage('打开帖子失败');
    }
  }

  /**
   * 下一页
   * @param item 树节点
   */
  private async nextPage(item: any): Promise<void> {
    if (item && item.type) {
      this.treeDataProvider.handlePaging(item, true);
    }
  }

  /**
   * 上一页
   * @param item 树节点
   */
  private async prevPage(item: any): Promise<void> {
    if (item && item.type) {
      this.treeDataProvider.handlePaging(item, false);
    }
  }

  /**
   * 重置页码
   * @param item 树节点
   */
  private async resetPage(item: any): Promise<void> {
    if (item && item.type) {
      this.treeDataProvider.handleReset(item);
    }
  }

  /**
   * 登录
   */
  private async login(): Promise<void> {
    const cookie = await vscode.window.showInputBox({
      prompt: '请输入Linux.do网站的Cookie',
      placeHolder: '从浏览器开发者工具中复制Cookie，留空则保持现有设置',
      value: Settings.getCookie()
    });

    if (cookie === undefined) {
      return;
    }

    const csrfToken = await vscode.window.showInputBox({
      prompt: '请输入Linux.do网站的CSRF Token',
      placeHolder: '从浏览器开发者工具中复制X-CSRF-Token，留空则保持现有设置',
      value: Settings.getCsrfToken()
    });

    if (csrfToken === undefined) {
      return;
    }

    await Settings.updateLoginCredentials(cookie, csrfToken);
    vscode.window.showInformationMessage('设置已更新！');
    this.treeDataProvider.refresh();
  }
}

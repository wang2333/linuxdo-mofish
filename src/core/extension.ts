import * as vscode from 'vscode';
import { ForumService } from '../services/forumService';
import { ForumTreeDataProvider } from '../providers/forumTreeDataProvider';
import { PostCommands } from './commands/postCommands';

export function activate(context: vscode.ExtensionContext) {
  const forumService = ForumService.getInstance();
  const treeDataProvider = new ForumTreeDataProvider(forumService);

  // 注册帖子列表视图
  const treeView = vscode.window.createTreeView('linuxdoPosts', {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true
  });

  // 注册所有命令
  const postCommands = new PostCommands(context, forumService, treeDataProvider);
  postCommands.register();

  // 监听展开/折叠事件
  context.subscriptions.push(
    treeView.onDidExpandElement(async e => {
      if ('type' in e.element) {
        await treeDataProvider.handleGroupExpansion(e.element, true);
      }
    })
  );

  // 监听折叠事件
  context.subscriptions.push(
    treeView.onDidCollapseElement(async e => {
      if ('type' in e.element) {
        await treeDataProvider.handleGroupExpansion(e.element, false);
      }
    })
  );
}

export function deactivate() {}

import * as vscode from 'vscode';
import { ForumService, ForumPost, PostListType } from './forumService';
import { DEFAULT_GROUP_STATES, DEFAULT_PAGE, GROUP_ICONS } from './constants/forum';

interface PostGroup {
  label: string;
  type?: PostListType;
  collapsibleState: vscode.TreeItemCollapsibleState;
  children?: PostGroup[];
  contextValue?: string;
  page?: number;
}

type TreeItem = PostGroup | ForumPost;

export class ForumTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> =
    new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  // 分组状态管理
  private groupStates = new Map<string, any>();

  constructor(private forumService: ForumService) {
    this.initializeGroupStates();
  }

  private initializeGroupStates(): void {
    // 初始化每个分组的状态
    Object.entries(DEFAULT_GROUP_STATES).forEach(([groupId, isExpanded]) => {
      this.groupStates.set(groupId, {
        isExpanded,
        currentPage: DEFAULT_PAGE
      });
    });
  }

  refresh(): void {
    // 清除所有缓存的数据
    this.groupStates.forEach(state => {
      state.cachedData = undefined;
    });
    this._onDidChangeTreeData.fire(undefined);
  }

  async handleGroupExpansion(group: PostGroup, expanded: boolean): Promise<void> {
    const groupId = group.type || group.contextValue || '';
    const state = this.getGroupState(groupId);
    state.isExpanded = expanded;

    if (expanded && group.type) {
      // 展开时清除缓存并刷新
      state.cachedData = undefined;
      this._onDidChangeTreeData.fire(group);
    }
  }

  async handlePaging(group: PostGroup, isNext: boolean): Promise<void> {
    if (!group.type) {
      return;
    }

    const state = this.getGroupState(group.type);
    state.currentPage = isNext ? state.currentPage + 1 : Math.max(1, state.currentPage - 1);
    state.cachedData = undefined;
    this._onDidChangeTreeData.fire(group);
  }

  async handleReset(group: PostGroup): Promise<void> {
    if (!group.type) {
      return;
    }

    const state = this.getGroupState(group.type);
    state.currentPage = DEFAULT_PAGE;
    state.cachedData = undefined;
    this._onDidChangeTreeData.fire(group);
  }

  private getGroupState(groupId: string): GroupState {
    let state = this.groupStates.get(groupId);
    if (!state) {
      state = { isExpanded: false, currentPage: DEFAULT_PAGE };
      this.groupStates.set(groupId, state);
    }
    return state;
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    if (this.isPostGroup(element)) {
      return this.createGroupTreeItem(element);
    } else {
      return this.createPostTreeItem(element);
    }
  }

  private createGroupTreeItem(group: PostGroup): vscode.TreeItem {
    const groupId = group.type || group.contextValue || '';
    const state = this.getGroupState(groupId);

    const treeItem = new vscode.TreeItem(
      group.label,
      state.isExpanded
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    );

    treeItem.id = `group-${groupId}`;

    if (group.type) {
      treeItem.contextValue = `post-group-${group.type}`;
      treeItem.label = `${group.label} (第 ${state.currentPage} 页)`;
    } else {
      treeItem.contextValue = group.contextValue;
    }

    // 设置图标
    const iconName = GROUP_ICONS[groupId as keyof typeof GROUP_ICONS];
    if (iconName) {
      treeItem.iconPath = new vscode.ThemeIcon(iconName);
    }

    return treeItem;
  }

  private createPostTreeItem(post: ForumPost): vscode.TreeItem {
    const item = new vscode.TreeItem('');
    item.tooltip = `作者: ${post.author}\n发布时间: ${post.date}\n浏览量: ${post.views}`;
    item.label = {
      label: `${post.views}  ${post.title}`,
      highlights: []
    };
    item.description = post.author;
    item.command = {
      command: 'linuxdo.openPost',
      title: '打开帖子',
      arguments: [post]
    };
    item.iconPath = new vscode.ThemeIcon('eye', new vscode.ThemeColor('charts.foreground'));
    return item;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      return this.getRootGroups();
    }

    if (this.isPostGroup(element)) {
      return this.getGroupChildren(element);
    }

    return [];
  }

  private getRootGroups(): PostGroup[] {
    return [
      {
        label: '最新创建',
        type: 'latest',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: '热门话题',
        type: 'hot',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: '新话题',
        type: 'new',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      },
      {
        label: '未读话题',
        type: 'unread',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      }
    ];
  }

  private async getGroupChildren(group: PostGroup): Promise<TreeItem[]> {
    const groupId = group.type || group.contextValue || '';
    const state = this.getGroupState(groupId);

    if (!state.isExpanded) {
      return [];
    }

    if (group.contextValue === 'posts') {
      return group.children || [];
    }

    if (group.contextValue === 'favorites') {
      // TODO: 实现收藏帖子的获取
      return [];
    }

    if (group.type) {
      return await this.getPostsForGroup(group.type, state);
    }

    return [];
  }

  private async getPostsForGroup(type: PostListType, state: GroupState): Promise<ForumPost[]> {
    if (!state.cachedData) {
      try {
        state.cachedData = await this.forumService.getLatestPosts(type, state.currentPage);
      } catch (error: any) {
        vscode.window.showErrorMessage(error.response.data.errors.join(','));
        return [];
      }
    }
    return state.cachedData;
  }

  private isPostGroup(item: TreeItem): item is PostGroup {
    return ('type' in item || 'children' in item) && 'collapsibleState' in item;
  }
}

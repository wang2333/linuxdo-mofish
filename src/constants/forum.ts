export const DEFAULT_GROUP_STATES = {
  posts: true, // 帖子列表默认展开
  latest: true, // 最新创建默认展开
  new: false, // 新话题默认折叠
  unread: false, // 未读话题默认折叠
  hot: false, // 热门话题默认折叠
  favorites: false // 收藏默认折叠
};

export const DEFAULT_PAGE = 1;

export const GROUP_ICONS = {
  posts: 'list-tree',
  favorites: 'star'
} as const;

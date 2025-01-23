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

export const CATEGORIES = [
  {
    id: 34,
    name: '前沿快讯',
    color: 'BB8FCE',
    text_color: 'FFFFFF'
  },
  {
    id: 78,
    name: '前沿快讯, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF'
  },
  {
    id: 79,
    name: '前沿快讯, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF'
  },
  {
    id: 80,
    name: '前沿快讯, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF'
  },
  {
    id: 4,
    name: '开发调优',
    color: '33FFFF',
    text_color: 'FFFFFF'
  },
  {
    id: 20,
    name: '开发调优, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF'
  },
  {
    id: 31,
    name: '开发调优, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF'
  },
  {
    id: 88,
    name: '开发调优, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF'
  },
  {
    id: 46,
    name: '扬帆起航',
    color: 'ff9838',
    text_color: 'FFFFFF',
    slug: 'startup'
  },
  {
    id: 66,
    name: '扬帆起航, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'startup-lv1',
    parent_category_id: 46
  },
  {
    id: 67,
    name: '扬帆起航, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'startup-lv2',
    parent_category_id: 46
  },
  {
    id: 68,
    name: '扬帆起航, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'startup-lv3',
    parent_category_id: 46
  },
  {
    id: 11,
    name: '搞七捻三',
    color: '3AB54A',
    text_color: 'FFFFFF',
    slug: 'gossip'
  },
  {
    id: 35,
    name: '搞七捻三, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'gossip-lv1',
    parent_category_id: 11
  },
  {
    id: 89,
    name: '搞七捻三, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'gossip-lv2',
    parent_category_id: 11
  },
  {
    id: 21,
    name: '搞七捻三, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'gossip-lv3',
    parent_category_id: 11
  },
  {
    id: 42,
    name: '文档共建',
    color: 'ddf2fd',
    text_color: 'FFFFFF',
    slug: 'wiki'
  },
  {
    id: 75,
    name: '文档共建, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'wiki-lv1',
    parent_category_id: 42
  },
  {
    id: 76,
    name: '文档共建, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'wiki-lv2',
    parent_category_id: 42
  },
  {
    id: 77,
    name: '文档共建, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'wiki-lv3',
    parent_category_id: 42
  },
  {
    id: 45,
    name: '深海幽域',
    color: '45B7D1',
    text_color: 'FFFFFF',
    slug: 'muted'
  },
  {
    id: 57,
    name: '深海幽域, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'muted-lv1',
    parent_category_id: 45
  },
  {
    id: 58,
    name: '深海幽域, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'muted-lv2',
    parent_category_id: 45
  },
  {
    id: 59,
    name: '深海幽域, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'muted-lv3',
    parent_category_id: 45
  },
  {
    id: 36,
    name: '福利羊毛',
    color: 'E45735',
    text_color: 'FFFFFF',
    slug: 'welfare'
  },
  {
    id: 60,
    name: '福利羊毛, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'welfare-lv1',
    parent_category_id: 36
  },
  {
    id: 61,
    name: '福利羊毛, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'welfare-lv2',
    parent_category_id: 36
  },
  {
    id: 62,
    name: '福利羊毛, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'welfare-lv3',
    parent_category_id: 36
  },
  {
    id: 32,
    name: '读书成诗',
    color: 'f5ec00',
    text_color: 'FFFFFF',
    slug: 'reading'
  },
  {
    id: 69,
    name: '读书成诗, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'reading-lv1',
    parent_category_id: 32
  },
  {
    id: 70,
    name: '读书成诗, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'reading-lv2',
    parent_category_id: 32
  },
  {
    id: 71,
    name: '读书成诗, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'reading-lv3',
    parent_category_id: 32
  },
  {
    id: 14,
    name: '资源荟萃',
    color: '12A89D',
    text_color: 'FFFFFF',
    slug: 'resource'
  },
  {
    id: 83,
    name: '资源荟萃, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'resource-lv1',
    parent_category_id: 14
  },
  {
    id: 84,
    name: '资源荟萃, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'resource-lv2',
    parent_category_id: 14
  },
  {
    id: 85,
    name: '资源荟萃, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'resource-lv3',
    parent_category_id: 14
  },
  {
    id: 10,
    name: '跳蚤市场',
    color: 'ED207B',
    text_color: 'FFFFFF',
    slug: 'trade'
  },
  {
    id: 13,
    name: '跳蚤市场, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'trade-lv1',
    parent_category_id: 10
  },
  {
    id: 81,
    name: '跳蚤市场, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'trade-lv2',
    parent_category_id: 10
  },
  {
    id: 82,
    name: '跳蚤市场, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'trade-lv3',
    parent_category_id: 10
  },
  {
    id: 2,
    name: '运营反馈',
    color: '808281',
    text_color: 'FFFFFF',
    slug: 'feedback'
  },
  {
    id: 49,
    name: '公告',
    color: 'F1592A',
    text_color: 'FFFFFF',
    slug: 'announcement',
    parent_category_id: 2
  },
  {
    id: 30,
    name: '活动',
    color: '38571A',
    text_color: 'FFFFFF',
    slug: 'activity',
    parent_category_id: 2
  },
  {
    id: 63,
    name: '运营反馈, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'feedback-lv1',
    parent_category_id: 2
  },
  {
    id: 64,
    name: '运营反馈, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'feedback-lv2',
    parent_category_id: 2
  },
  {
    id: 65,
    name: '运营反馈, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'feedback-lv3',
    parent_category_id: 2
  },
  {
    id: 27,
    name: '非我莫属',
    color: 'a8c6fe',
    text_color: 'FFFFFF',
    slug: 'job'
  },
  {
    id: 72,
    name: '非我莫属, Lv1',
    color: '0088CC',
    text_color: 'FFFFFF',
    slug: 'job-lv1',
    parent_category_id: 27
  },
  {
    id: 73,
    name: '非我莫属, Lv2',
    color: '874EFE',
    text_color: 'FFFFFF',
    slug: 'job-lv2',
    parent_category_id: 27
  },
  {
    id: 74,
    name: '非我莫属, Lv3',
    color: 'FF0000',
    text_color: 'FFFFFF',
    slug: 'job-lv3',
    parent_category_id: 27
  }
];

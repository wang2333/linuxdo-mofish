/**
 * 论坛帖子
 */
export interface ForumPost {
  /** 帖子ID */
  id: string;
  /** 帖子标题 */
  title: string;
  /** 作者 */
  author: string;
  /** 发布时间 */
  date: string;
  /** 帖子URL */
  url?: string;
  /** 浏览量 */
  views?: number;
  /** 分类 */
  category?: string;
}

/**
 * 帖子内容
 */
export interface PostContent {
  /** 帖子标题 */
  title: string;
  /** 帖子URL */
  url: string;
  /** 分类ID */
  categoryId: number;
  /** 主帖子 */
  mainPost: {
    /** 作者 */
    username: string;
    /** 头像URL */
    avatarUrl: string;
    /** 内容 */
    content: string;
    /** 发布时间 */
    createdAt: string;
    /** 点赞数 */
    likeCount?: number;
    /** 用户标题 */
    userTitle?: string;
  };
  /** 评论 */
  comments: Comment[];
  /** 是否有更多评论 */
  hasMoreComments?: boolean;
  /** 评论总数 */
  totalComments?: number;
  /** 所有帖子ID */
  allPostIds?: number[];
  /** 浏览量 */
  views?: number;
  /** 点赞数 */
  likeCount?: number;
}

/**
 * 评论
 */
export interface Comment {
  /** 评论ID */
  id: number;
  /** 作者 */
  username: string;
  /** 头像URL */
  avatarUrl: string;
  /** 内容 */
  content: string;
  /** 发布时间 */
  createdAt: string;
  /** 点赞数 */
  likeCount?: number;
  /** 用户标题 */
  userTitle?: string;
  /** 帖子编号 */
  postNumber: number;
  /** 回复到 */
  replyTo?: {
    /** 作者 */
    username: string;
    /** 头像URL */
    avatarUrl: string;
    /** 帖子编号 */
    postNumber: number;
  };
}

/**
 * 帖子
 */
export interface Post {
  /** 帖子ID */
  id: number;
  /** 帖子标题 */
  title: string;
  /** 作者 */
  username: string;
  /** 用户标题 */
  user_title?: string;
  /** 发布时间 */
  created_at: string;
  /** 帖子编号 */
  post_number: number;
  /** 头像URL */
  avatar_template: string;
  /** 内容 */
  cooked: string;
  /** 点赞数 */
  like_count?: number;
  /** 浏览量 */
  views?: number;
  /** 是否为wiki */
  wiki?: boolean;
  /** 回复到帖子编号 */
  reply_to_post_number?: number;
  /** 回复到用户 */
  reply_to_user?: {
    /** 作者 */
    username: string;
    /** 头像URL */
    avatar_template: string;
  };
}

/**
 * 帖子列表类型
 */
export type PostListType = 'latest' | 'latest2' | 'new' | 'unseen' | 'unread' | 'top' | 'hot';

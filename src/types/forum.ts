export interface ForumPost {
  id: string;
  title: string;
  author: string;
  date: string;
  url?: string;
  views?: number;
  category?: string;
}

export interface PostContent {
  title: string;
  url: string;
  categoryId: number;
  mainPost: {
    username: string;
    avatarUrl: string;
    content: string;
    createdAt: string;
    likeCount?: number;
    userTitle?: string;
  };
  comments: Comment[];
  hasMoreComments?: boolean;
  totalComments?: number;
  allPostIds?: number[];
}

export interface Comment {
  id: number;
  username: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  likeCount?: number;
  userTitle?: string;
  replyTo?: {
    username: string;
    avatarUrl: string;
    postNumber: number;
  };
}

export interface Post {
  id: number;
  title: string;
  username: string;
  user_title?: string;
  created_at: string;
  post_number: number;
  avatar_template: string;
  cooked: string;
  like_count?: number;
  wiki?: boolean;
  reply_to_post_number?: number;
  reply_to_user?: {
    username: string;
    avatar_template: string;
  };
}

export type PostListType = 'latest' | 'new' | 'unseen' | 'unread' | 'top' | 'hot';

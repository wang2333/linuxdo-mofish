import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  date: string;
  url?: string;
  views?: number;
}

export interface PostContent {
  title: string;
  mainPost: {
    username: string;
    avatarUrl: string;
    content: string;
    createdAt: string;
    likeCount?: number;
  };
  comments: {
    id: number;
    username: string;
    avatarUrl: string;
    content: string;
    createdAt: string;
    likeCount?: number;
    replyTo?: {
      username: string;
      avatarUrl: string;
      postNumber: number;
    };
  }[];
  hasMoreComments?: boolean;
  totalComments?: number;
  allPostIds?: number[];
}

interface Post {
  id: number;
  title: string;
  username: string;
  created_at: string;
  post_number: number;
  avatar_template: string;
  cooked: string;
  like_count?: number;
  wiki?: boolean;
  reply_to_post_number?: number;
}

export type PostListType = 'latest' | 'new' | 'unseen' | 'unread' | 'top' | 'hot';

export class ForumService {
  private static instance: ForumService;
  private baseUrl = 'https://linux.do';
  private headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'X-Requested-With': 'XMLHttpRequest'
    // Cookie:
    //   '_t=JpKrWg7ZLImdW%2B%2FOahpHD5qq%2FhbSnuLKB6DqqyxE19yIHjc1XhMo%2FBujPcPtQVmEaWKR5iTol50m6fu7Hshi%2BjP5T%2BPC%2B6qp9IIvuBzTttVh6jV06DbjhfW9Gtndt03kD7ef1w2d%2Bl%2B%2F9hPlSr7VF9Bvv7KeGVTxYB3axgoHLPD1kRz2RAKy3vJkMBIxRPtPopYAw%2BjLi2YUt83can1Kyc9VFtX4TMwURfIrUtHYfguyh%2FpquJF54UjwVRTT6B%2FUHoP3%2F1Rdu%2FJvvRy27gKGi0hUmfgYJtl4o36h9dcIexoGUwdnYUZ27A%3D%3D--CYGUNR4O8%2BkbQXzL--66VZ2DyfRPVsT9TCYTX9Hw%3D%3D'
  };

  private constructor() {}

  public static getInstance(): ForumService {
    if (!ForumService.instance) {
      ForumService.instance = new ForumService();
    }
    return ForumService.instance;
  }

  private getAvatarUrl(username: string, avatarTemplate: string): string {
    if (!avatarTemplate) {
      return `${this.baseUrl}/images/avatar.png`;
    }
    return `${this.baseUrl}${avatarTemplate.replace('{size}', '45')}`;
  }

  public async getLatestPosts(
    type: PostListType = 'latest',
    page: number = 1
  ): Promise<ForumPost[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${type}.json`, {
        headers: this.headers,
        decompress: true,
        params: {
          order: type === 'latest' ? 'created' : '',
          page: page - 1
        }
      });

      const topicList = response.data.topic_list.topics;
      return topicList.map((topic: any) => ({
        id: topic.id.toString(),
        title: topic.title,
        author: topic.last_poster_username || topic.created_by?.username || '',
        date: new Date(type === 'latest' ? topic.created_at : topic.bumped_at).toLocaleString(
          'zh-CN'
        ),
        url: `${this.baseUrl}/t/${topic.slug}/${topic.id}`,
        views: topic.views || 0
      }));
    } catch (error: any) {
      console.error('获取帖子列表失败:', error.response.data);
      throw error;
    }
  }

  public async getPostContent(postId: string): Promise<PostContent> {
    try {
      const response = await axios.get(`${this.baseUrl}/t/${postId}.json`, {
        headers: this.headers,
        decompress: true,
        params: {
          track_visit: 'true',
          force_load_topic: 'true'
        }
      });

      const posts = response.data.post_stream.posts as Post[];
      const mainPost = posts[0];
      const comments = posts.slice(1);

      // 创建一个映射来存储所有评论，方便后续查找
      const commentsMap = new Map(posts.map(post => [post.post_number, post]));

      const postContent: PostContent = {
        title: response.data.title || '',
        mainPost: {
          username: mainPost.username || '',
          avatarUrl: this.getAvatarUrl(mainPost.username, mainPost.avatar_template),
          content: mainPost.cooked || '',
          createdAt: mainPost.created_at || new Date().toISOString(),
          likeCount: mainPost.like_count
        },
        comments: comments.map(comment => ({
          id: comment.id,
          username: comment.username || '',
          avatarUrl: this.getAvatarUrl(comment.username, comment.avatar_template),
          content: comment.cooked || '',
          createdAt: comment.created_at || new Date().toISOString(),
          likeCount: comment.like_count,
          replyTo: comment.reply_to_post_number
            ? {
                username: commentsMap.get(comment.reply_to_post_number)?.username || '',
                avatarUrl: this.getAvatarUrl(
                  commentsMap.get(comment.reply_to_post_number)?.username || '',
                  commentsMap.get(comment.reply_to_post_number)?.avatar_template || ''
                ),
                postNumber: comment.reply_to_post_number
              }
            : undefined
        })),
        hasMoreComments: response.data.post_stream.posts.length < response.data.posts_count,
        totalComments: response.data.posts_count,
        allPostIds: response.data.post_stream.stream
      };

      return postContent;
    } catch (error) {
      console.error('获取帖子内容失败:', error);
      throw error;
    }
  }

  public async loadMoreComments(
    postId: string,
    postNumbers: number[]
  ): Promise<PostContent['comments']> {
    try {
      // 构建查询参数，每个 post_id 作为单独的数组项
      const params = new URLSearchParams();
      postNumbers.forEach(id => {
        params.append('post_ids[]', id.toString());
      });
      params.append('include_suggested', 'false');

      const response = await axios.get(`${this.baseUrl}/t/${postId}/posts.json`, {
        headers: this.headers,
        decompress: true,
        params
      });

      const posts = response.data.post_stream.posts as Post[];
      const commentsMap = new Map(posts.map(post => [post.post_number, post]));

      return posts.map(comment => ({
        id: comment.id,
        username: comment.username || '',
        avatarUrl: this.getAvatarUrl(comment.username, comment.avatar_template),
        content: comment.cooked || '',
        createdAt: comment.created_at || new Date().toISOString(),
        likeCount: comment.like_count,
        replyTo: comment.reply_to_post_number
          ? {
              username: commentsMap.get(comment.reply_to_post_number)?.username || '',
              avatarUrl: this.getAvatarUrl(
                commentsMap.get(comment.reply_to_post_number)?.username || '',
                commentsMap.get(comment.reply_to_post_number)?.avatar_template || ''
              ),
              postNumber: comment.reply_to_post_number
            }
          : undefined
      }));
    } catch (error) {
      console.error('加载更多评论失败:', error);
      throw error;
    }
  }

  public async getNextCommentIds(
    postId: string,
    lastCommentId: number,
    allPostIds: number[]
  ): Promise<number[]> {
    const currentIndex = allPostIds.indexOf(lastCommentId);

    if (currentIndex !== -1 && currentIndex < allPostIds.length - 1) {
      // 获取下一批评论的 ID（最多20个）
      return allPostIds.slice(currentIndex + 1, currentIndex + 21);
    }

    return [];
  }
}

import { ForumPost, PostContent, Post, PostListType, Comment } from '../types/forum';
import { API_ENDPOINTS } from '../constants/api';
import { http } from '../utils/http';
import { CATEGORIES } from '../constants/forum';

/**
 * 论坛服务
 */
export class ForumService {
  private static instance: ForumService;

  private constructor() {}

  public static getInstance(): ForumService {
    if (!ForumService.instance) {
      ForumService.instance = new ForumService();
    }
    return ForumService.instance;
  }

  /**
   * 获取头像URL
   * @param username 用户名
   * @param avatarTemplate 头像模板
   * @returns 头像URL
   */
  private getAvatarUrl(avatarTemplate: string): string {
    if (!avatarTemplate) {
      return `${http['baseURL']}/images/avatar.png`;
    }
    return `${http['baseURL']}${avatarTemplate.replace('{size}', '45')}`;
  }

  /**
   * 获取最新帖子
   * @param type 帖子类型
   * @param page 页码
   * @returns 帖子
   */
  public async getLatestPosts(
    type: PostListType = 'latest',
    page: number = 1
  ): Promise<ForumPost[]> {
    try {
      const response = await http.get<{ topic_list: { topics: any[] }; users: any[] }>(
        API_ENDPOINTS.LATEST_POSTS(type === 'latest2' ? 'latest' : type),
        {
          params: {
            order: type === 'latest' ? 'created' : '',
            page: page - 1
          }
        }
      );

      const users = response.users;

      return response.topic_list.topics.map(topic => ({
        id: topic.id.toString(),
        title: topic.title,
        author: users.find(user => user.id === topic.posters[0].user_id)?.name || '',
        date: new Date(type === 'latest' ? topic.created_at : topic.bumped_at).toLocaleString(
          'zh-CN'
        ),
        url: `${http['baseURL']}/t/${topic.slug}/${topic.id}`,
        views: topic.views || 0,
        category: CATEGORIES.find(category => category.id === topic.category_id)?.name || ''
      }));
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取帖子内容
   * @param postId 帖子ID
   * @returns 帖子内容
   */
  public async getPostContent(postId: string): Promise<PostContent> {
    try {
      const response = await http.get<{
        title: string;
        post_stream: { posts: Post[]; stream: number[] };
        posts_count: number;
        category_id: number;
        like_count: number;
        views: number;
      }>(API_ENDPOINTS.POST_CONTENT(postId), {
        params: {
          track_visit: 'true',
          force_load_topic: 'true'
        }
      });

      const posts = response.post_stream.posts;
      const mainPost = posts[0];
      const comments = posts.slice(1);

      return {
        title: response.title || '',
        url: `${http['baseURL']}/t/${postId}`,
        categoryId: response.category_id,
        mainPost: {
          username: mainPost.username || '',
          userTitle: mainPost.user_title || '',
          avatarUrl: this.getAvatarUrl(mainPost.avatar_template),
          content: mainPost.cooked || '',
          createdAt: mainPost.created_at || new Date().toISOString()
        },
        comments: this.transformComments(comments),
        hasMoreComments: posts.length < response.posts_count - 1,
        totalComments: response.posts_count - 1,
        allPostIds: response.post_stream.stream,
        likeCount: response.like_count,
        views: response.views
      };
    } catch (error) {
      console.error('获取帖子内容失败:', error);
      throw error;
    }
  }

  /**
   * 转换评论
   * @param comments 评论
   * @param commentsMap 评论映射
   * @returns 转换后的评论
   */
  private transformComments(comments: Post[]): Comment[] {
    return comments.map(comment => ({
      id: comment.id,
      postNumber: comment.post_number,
      username: comment.username || '',
      avatarUrl: this.getAvatarUrl(comment.avatar_template),
      content: comment.cooked || '',
      createdAt: comment.created_at || new Date().toISOString(),
      likeCount: comment.like_count,
      userTitle: comment.user_title,
      replyTo: comment.reply_to_user
        ? {
            username: comment.reply_to_user.username,
            avatarUrl: this.getAvatarUrl(comment.reply_to_user.avatar_template),
            postNumber: comment.reply_to_post_number || 0
          }
        : undefined
    }));
  }

  /**
   * 加载更多评论
   * @param postId 帖子ID
   * @param postNumbers 帖子编号
   * @returns 评论
   */
  public async loadMoreComments(postId: string, postNumbers: number[]): Promise<Comment[]> {
    try {
      const params = new URLSearchParams();
      postNumbers.forEach(id => {
        params.append('post_ids[]', id.toString());
      });
      params.append('include_suggested', 'false');

      const response = await http.get<{ post_stream: { posts: Post[] } }>(
        API_ENDPOINTS.MORE_COMMENTS(postId),
        { params }
      );

      const posts = response.post_stream.posts;

      return this.transformComments(posts);
    } catch (error) {
      console.error('加载更多评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取下一个评论ID
   * @param lastCommentId 最后一个评论ID
   * @param allPostIds 所有帖子ID
   * @returns 下一个评论ID
   */
  public async getNextCommentIds(lastCommentId: number, allPostIds: number[]): Promise<number[]> {
    const currentIndex = allPostIds.indexOf(lastCommentId);
    if (currentIndex !== -1 && currentIndex < allPostIds.length - 1) {
      return allPostIds.slice(currentIndex + 1, currentIndex + 21);
    }
    return [];
  }

  /**
   * 回复帖子
   * @param postId 帖子ID
   * @param content 内容
   * @param replyToId 回复到ID
   * @param categoryId 分类ID
   */
  public async replyToPost(
    postId: string,
    content: string,
    replyToId?: number,
    categoryId?: number
  ): Promise<void> {
    try {
      await http.post<{
        id: number;
        name: string;
        username: string;
        avatar_template: string;
        created_at: string;
        cooked: string;
        post_number: number;
        reply_to_post_number?: number;
      }>(`/posts`, {
        raw: content,
        unlist_topic: false,
        category: categoryId,
        topic_id: postId,
        is_warning: false,
        archetype: 'regular',
        typing_duration_msecs: 2800,
        composer_open_duration_msecs: 6716,
        featured_link: '',
        shared_draft: false,
        draft_key: `topic_${postId}`,
        nested_post: true,
        reply_to_post_number: replyToId
      });
    } catch (error) {
      console.error('回复失败:', error);
      throw error;
    }
  }
}

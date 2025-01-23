import { ForumPost, PostContent, Post, PostListType, Comment } from '../types/forum';
import { API_ENDPOINTS } from '../constants/api';
import { http } from '../utils/http';
import { CATEGORIES } from '../constants/forum';

export class ForumService {
  private static instance: ForumService;

  private constructor() {}

  public static getInstance(): ForumService {
    if (!ForumService.instance) {
      ForumService.instance = new ForumService();
    }
    return ForumService.instance;
  }

  private getAvatarUrl(username: string, avatarTemplate: string): string {
    if (!avatarTemplate) {
      return `${http['baseURL']}/images/avatar.png`;
    }
    return `${http['baseURL']}${avatarTemplate.replace('{size}', '45')}`;
  }

  public async getLatestPosts(
    type: PostListType = 'latest',
    page: number = 1
  ): Promise<ForumPost[]> {
    try {
      const response = await http.get<{ topic_list: { topics: any[] }; users: any[] }>(
        API_ENDPOINTS.LATEST_POSTS(type),
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

  public async getPostContent(postId: string): Promise<PostContent> {
    try {
      const response = await http.get<{
        title: string;
        post_stream: { posts: Post[]; stream: number[] };
        posts_count: number;
        category_id: number;
      }>(API_ENDPOINTS.POST_CONTENT(postId), {
        params: {
          track_visit: 'true',
          force_load_topic: 'true'
        }
      });

      const posts = response.post_stream.posts;
      const mainPost = posts[0];
      const comments = posts.slice(1);
      const commentsMap = new Map(posts.map(post => [post.post_number, post]));

      return {
        title: response.title || '',
        url: `${http['baseURL']}/t/${postId}`,
        categoryId: response.category_id,
        mainPost: {
          username: mainPost.username || '',
          userTitle: mainPost.user_title || '',
          avatarUrl: this.getAvatarUrl(mainPost.username, mainPost.avatar_template),
          content: mainPost.cooked || '',
          createdAt: mainPost.created_at || new Date().toISOString(),
          likeCount: mainPost.like_count
        },
        comments: this.transformComments(comments, commentsMap),
        hasMoreComments: posts.length < response.posts_count,
        totalComments: response.posts_count,
        allPostIds: response.post_stream.stream
      };
    } catch (error) {
      console.error('获取帖子内容失败:', error);
      throw error;
    }
  }

  private transformComments(comments: Post[], commentsMap: Map<number, Post>): Comment[] {
    return comments.map(comment => ({
      id: comment.id,
      username: comment.username || '',
      avatarUrl: this.getAvatarUrl(comment.username, comment.avatar_template),
      content: comment.cooked || '',
      createdAt: comment.created_at || new Date().toISOString(),
      likeCount: comment.like_count,
      userTitle: comment.user_title,
      replyTo: comment.reply_to_user
        ? {
            username: comment.reply_to_user.username,
            avatarUrl: this.getAvatarUrl(
              comment.reply_to_user.username,
              comment.reply_to_user.avatar_template
            ),
            postNumber: comment.reply_to_post_number || 0
          }
        : undefined
    }));
  }

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
      const commentsMap = new Map(posts.map(post => [post.post_number, post]));

      return this.transformComments(posts, commentsMap);
    } catch (error) {
      console.error('加载更多评论失败:', error);
      throw error;
    }
  }

  public async getNextCommentIds(lastCommentId: number, allPostIds: number[]): Promise<number[]> {
    const currentIndex = allPostIds.indexOf(lastCommentId);
    if (currentIndex !== -1 && currentIndex < allPostIds.length - 1) {
      return allPostIds.slice(currentIndex + 1, currentIndex + 21);
    }
    return [];
  }

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

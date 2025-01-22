import React, { useState, useEffect } from 'react';
import './PostContent.less';
import type { PostContent } from '../forumService';

interface PostContentComponentProps {
  content: PostContent & { id: string };
  vscode: any;
}

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} 分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} 小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} 天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} 个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} 年前`;
};

export const PostContentComponent: React.FC<PostContentComponentProps> = ({ content, vscode }) => {
  const [comments, setComments] = useState(content.comments);
  const [hasMore, setHasMore] = useState(content.hasMoreComments);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreComments = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 发送消息给 extension 请求加载更多评论
      vscode.postMessage({
        type: 'loadMoreComments',
        postId: content.id,
        lastCommentId: comments[comments.length - 1].id,
        allPostIds: content.allPostIds
      });
    } catch (error) {
      console.error('请求加载更多评论失败:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 监听来自 extension 的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'moreComments') {
        setComments(prevComments => [...prevComments, ...message.comments]);
        setHasMore(message.hasMoreComments);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  return (
    <div className='post-container'>
      <h1 className='post-title'>{content.title}</h1>

      {/* 主帖 */}
      <div className='post-meta'>
        <div className='post-meta-left'>
          <img
            className='avatar'
            src={content.mainPost.avatarUrl}
            alt={content.mainPost.username}
          />
          <span className='username'>{content.mainPost.username}</span>
        </div>
        <div className='post-meta-right'>
          <span className='post-meta-item time-ago'>
            {formatTimeAgo(content.mainPost.createdAt)}
          </span>
          {content.mainPost.likeCount ? (
            <span className='like-count'>{content.mainPost.likeCount}</span>
          ) : null}
        </div>
      </div>
      <div
        className='post-content'
        dangerouslySetInnerHTML={{ __html: content.mainPost.content }}
      />

      {/* 评论 */}
      {comments.length > 0 && (
        <div className='comments-container'>
          <h2>评论 ({content.totalComments})</h2>
          {comments.map(comment => (
            <div key={comment.id} className='comment'>
              <div className='comment-header'>
                <div className='user-info'>
                  <img className='avatar' src={comment.avatarUrl} alt={comment.username} />
                  <span>{comment.username}</span>
                </div>
                <div className='comment-meta'>
                  {comment.replyTo && (
                    <div className='reply-info'>
                      <span className='reply-icon'>➜</span>
                      <div className='reply-to'>
                        <img
                          className='avatar'
                          src={comment.replyTo.avatarUrl}
                          alt={comment.replyTo.username}
                        />
                        <span className='username'>{comment.replyTo.username}</span>
                      </div>
                    </div>
                  )}
                  <span className='time-ago'>{formatTimeAgo(comment.createdAt)}</span>
                  {comment.likeCount ? (
                    <span className='like-count'>{comment.likeCount}</span>
                  ) : null}
                </div>
              </div>
              <div
                className='comment-content'
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>
          ))}
          {hasMore && (
            <div className='load-more'>
              <button onClick={loadMoreComments} disabled={isLoading} className='load-more-button'>
                {isLoading ? '加载中...' : '加载更多评论'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

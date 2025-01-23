import React, { useState, useEffect } from 'react';
import './PostContent.less';
import type { PostContent, Comment } from '../types/forum';

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
  const [comments, setComments] = useState<Comment[]>(content.comments);
  const [hasMore, setHasMore] = useState(content.hasMoreComments);
  const [isLoading, setIsLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const replyBoxRef = React.useRef<HTMLDivElement>(null);

  const loadMoreComments = async () => {
    if (isLoading || !hasMore) return;

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

  const handleReplyClick = (id: number, username: string) => {
    setReplyTo({ id, username });
    // 滚动到回复框
    if (replyBoxRef.current) {
      replyBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 聚焦到文本框
      const textarea = replyBoxRef.current.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      return;
    }

    try {
      vscode.postMessage({
        type: 'reply',
        postId: content.id,
        content: replyContent,
        replyToId: replyTo?.id,
        categoryId: content.categoryId
      });
      setReplyContent('');
      setReplyTo(null);
    } catch (error) {
      console.error('回复失败:', error);
    }
  };

  useEffect(() => {
    // 监听来自 extension 的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'moreComments') {
        setComments((prevComments: Comment[]) => [...prevComments, ...message.comments]);
        setHasMore(message.hasMoreComments);
        setIsLoading(false);
      } else if (message.type === 'setContent') {
        // 更新整个内容
        setComments(message.content.comments);
        setHasMore(message.content.hasMoreComments);
        setIsLoading(false);
        setReplyContent('');
        setReplyTo(null);
      }
    };

    // 添加滚动监听
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // 当滚动到距离底部100px时触发加载
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreComments();
      }
    };

    window.addEventListener('message', messageHandler);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [comments.length, hasMore, isLoading]); // 添加依赖项

  return (
    <div className='post-container'>
      <div className='title-container'>
        <h1 className='title'>{content.title}</h1>
        <a href={content.url} target='_blank' className='external-link'>
          在浏览器中打开
        </a>
      </div>

      {/* 主帖 */}
      <div className='post-meta'>
        <div className='post-meta-left'>
          <img
            className='avatar'
            src={content.mainPost.avatarUrl}
            alt={content.mainPost.username}
          />
          <div className='user-info'>
            <span className='username author'>{content.mainPost.username}</span>
            {content.mainPost.userTitle && (
              <span className='user-title'>{content.mainPost.userTitle}</span>
            )}
          </div>
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

      {/* 回复框 */}
      <div className='reply-box' ref={replyBoxRef}>
        {replyTo && (
          <div className='reply-to-info'>
            回复 {replyTo.username}
            <button className='cancel-reply' onClick={() => setReplyTo(null)}>
              取消回复
            </button>
          </div>
        )}
        <div className='reply-input-container'>
          <textarea
            className='reply-input'
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder='写下你的回复...'
            rows={4}
          />
          <button className='reply-button' onClick={handleReply} disabled={!replyContent.trim()}>
            发送回复
          </button>
        </div>
      </div>

      {/* 评论 */}
      {comments.length > 0 && (
        <div className='comments-container'>
          <h2>评论 ({content.totalComments})</h2>
          {comments.map(comment => (
            <div key={comment.id} className='comment'>
              <div className='comment-header'>
                <div className='user-info'>
                  <img className='avatar' src={comment.avatarUrl} alt={comment.username} />
                  <div className='user-info-text'>
                    <span
                      className={
                        comment.username === content.mainPost.username
                          ? 'username author'
                          : 'username'
                      }
                    >
                      {comment.username}
                    </span>
                    {comment.userTitle && <span className='user-title'>{comment.userTitle}</span>}
                  </div>
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
                        <span
                          className={
                            comment.replyTo.username === content.mainPost.username
                              ? 'username author'
                              : 'username'
                          }
                        >
                          {comment.replyTo.username}
                        </span>
                      </div>
                    </div>
                  )}
                  <span className='time-ago'>{formatTimeAgo(comment.createdAt)}</span>
                  {comment.likeCount ? (
                    <span className='like-count'>{comment.likeCount}</span>
                  ) : null}
                  <button
                    className='reply-link'
                    onClick={() => handleReplyClick(comment.id, comment.username)}
                  >
                    回复
                  </button>
                </div>
              </div>
              <div
                className='comment-content'
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            </div>
          ))}
          {isLoading && (
            <div className='loading-indicator'>
              <span>加载中...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

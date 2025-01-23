import * as vscode from 'vscode';

export const API_CONFIG = {
  BASE_URL: 'https://linux.do',
  HEADERS: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'X-Requested-With': 'XMLHttpRequest',
    get 'X-CSRF-Token'() {
      return vscode.workspace.getConfiguration('linuxdo').get('csrfToken') || '';
    },
    get Cookie() {
      return vscode.workspace.getConfiguration('linuxdo').get('cookie') || '';
    }
  }
};

export const API_ENDPOINTS = {
  LATEST_POSTS: (type: string) => `/${type}.json`,
  POST_CONTENT: (postId: string) => `/t/${postId}.json`,
  MORE_COMMENTS: (postId: string) => `/t/${postId}/posts.json`
};

import * as vscode from 'vscode';

export class Settings {
  private static readonly CONFIG_SECTION = 'linuxdo';

  /**
   * 更新登录凭证
   * @param cookie
   * @param csrfToken
   */
  static async updateLoginCredentials(cookie?: string, csrfToken?: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const currentCookie = config.get<string>('cookie') || '';
    const currentToken = config.get<string>('csrfToken') || '';

    if (cookie !== undefined && cookie !== currentCookie && cookie.trim() !== '') {
      await config.update('cookie', cookie, true);
    }
    if (csrfToken !== undefined && csrfToken !== currentToken && csrfToken.trim() !== '') {
      await config.update('csrfToken', csrfToken, true);
    }
  }

  static getCookie(): string {
    return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get<string>('cookie') || '';
  }

  static getCsrfToken(): string {
    return vscode.workspace.getConfiguration(this.CONFIG_SECTION).get<string>('csrfToken') || '';
  }
}

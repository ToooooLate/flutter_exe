import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    token: string;
    userId: string;
    firstName: string;
    name: string;
    username: string;
    roleCode: 'admin' | 'normal' | 'guest' | 'engineer';
    avatar?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 修改密码参数 */
  export interface ChangePasswordParams {
    username: string;
    oldPassword: string;
    newPassword: string;
    checkPassword: string;
  }

  /** 修改密码返回值（最小声明） */
  export interface ChangePasswordResult {
    status?: number;
    message?: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/api/sg/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/api/sg/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: AuthApi.ChangePasswordParams) {
  // 与后端约定：使用 /api/sg/change-password
  // 若开发环境未提供该路径，可按需在代理层映射
  return requestClient.post<AuthApi.ChangePasswordResult>('/api/sg/user/modify/password', data);
}

/**
 * 重置密码
 */
export async function resetUserPasswordApi(data: {
  username: string;
}) {
  return requestClient.post<AuthApi.ChangePasswordResult>('/api/sg/user/reset/password', data);
}
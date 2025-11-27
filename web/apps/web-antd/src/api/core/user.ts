import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

interface RoleItem {
  id: string;
  roleCode: string;
  roleName: string;
  enable: boolean;
  description: string;
}

interface UserAccountItem {
  id: string;
  username: string;
  password: string;
  roleCode: string;
  status: 0 | 1;
  description: string;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}

/**
 * 获取角色列表
 */
export async function getRoleListApi(data: {
  pageNo: number;
  pageSize: number;
}) {
  return requestClient.post<RoleItem[]>('/api/sg/role/list', data);  
}

/**
 * 获取用户账号列表
 */
export async function getUserAccountListApi(data: {
  pageNo: number;
  pageSize: number;
}) {
  return requestClient.post<UserAccountItem[]>('/api/sg/user/query', data);  
}

/**
 * 更新用户账号
 */
export async function updateUserAccountApi(data: UserAccountItem) {
  return requestClient.post<UserAccountItem>('/api/sg/user/edit', data);  
}

/**
 * 删除用户账号
 */
export async function deleteUserAccountApi(data: {
  id: string;
}) {
  return requestClient.post<UserAccountItem>('/api/sg/user/delete', data);  
}

/**
 * 新增用户账号
 */
export async function addUserAccountApi(data: UserAccountItem) {
  return requestClient.post<UserAccountItem>('/api/sg/user/add', data);  
}

/**
 * 延长用户账号访问权限
 */
export async function extendUserAccountAccessApi(data: {
  username: string;
  end: number;
}) {
  return requestClient.post<UserAccountItem>('/api/sg/user/renewal', data);  
}
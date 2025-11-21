import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore } from '@vben/stores';

import { useUserStore } from './user';
import { useWebSocketStore } from './websocket';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { loginApi, logoutApi } from '#/api/core/auth';
import { $t } from '#/locales';
import { clearExperimentFromStorage } from '#/composables/useExperimentStorage';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const webSocketStore = useWebSocketStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 根据角色获取权限代码
   * AC_100100 实验查看权限
   * AC_100110 实验操作权限
   * AC_200120 历史查看权限
   * AC_200130 历史操作权限
   * AC_300100 系统DUC读写权限
   * AC_400100 系统账号读写权限
   */
  function getAccessCodesByRole(role: 'admin' | 'normal' | 'guest' | 'engineer'): string[] {
    switch (role) {
      case 'admin':
        return ['AC_100100', 'AC_200120', 'AC_200130', 'AC_300100', 'AC_400100'];
      case 'engineer':
        return ['AC_100100', 'AC_100110', 'AC_200120', 'AC_200130', 'AC_300100'];
      case 'normal':
        return ['AC_100100', 'AC_200120'];
      case 'guest':
        return ['AC_100100'];
      default:
        return [];
    }
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);

      //正式加入角色后删除这行代码，当前后端为返回角色时，默认角色为admin
      loginResult.roleCode = loginResult.roleCode;
      console.log('登录结果:', loginResult);
      // 如果成功获取到 token
      if (loginResult.token) {
        accessStore.setAccessToken(loginResult.token);

        // 从登录结果中构建用户信息
        userInfo = {
          username: loginResult.username,
          realName: loginResult.name || loginResult.firstName || loginResult.username,
          avatar: loginResult.avatar || '',
          userId: loginResult.userId,
          roleCode: loginResult.roleCode,
          desc: '',
          homePath: preferences.app.defaultHomePath,
          token: loginResult.token,
        };

        userStore.setUserInfo(userInfo);
        console.log('登录成功:', { userInfo, token: loginResult.token });
        
        // 登录成功后连接WebSocket
        webSocketStore.connect();
        
        // 根据角色设置权限代码
        const accessCodes = getAccessCodesByRole(loginResult.roleCode);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    clearExperimentFromStorage();
    
    // 登出时断开WebSocket连接
    webSocketStore.disconnect();
    
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    loginLoading,
    logout,
  };
});

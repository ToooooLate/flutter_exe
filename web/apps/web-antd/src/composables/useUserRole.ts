import { computed } from 'vue';
import { useUserStore } from '#/store/user';

/**
 * 用户角色相关的composable函数
 */
export function useUserRole() {
  const userStore = useUserStore();

  /**
   * 判断当前用户是否为admin
   */
  const isAdmin = computed(() => {
    const role = userStore.userInfo?.roleCode;
    return role === 'admin';
  });

  /**
   * 判断当前用户是否为普通用户
   */
  const isNormal = computed(() => {
    const role = userStore.userInfo?.roleCode;
    return role === 'normal';
  });

  const isEngineer = computed(() => {
    const role = userStore.userInfo?.roleCode;
    return role === 'engineer';
  });

  /**
   * 判断当前用户是否为访客
   */
  const isGuest = computed(() => {  
    const role = userStore.userInfo?.roleCode;
    return role === 'guest';
  });

  /**
   * 判断当前用户是否为非admin用户（normal或guest）
   */
  const isNonAdmin = computed(() => {
    return !isAdmin.value;
  });

  /**
   * 获取当前用户的角色
   */
  const userRole = computed(() => {
    return userStore.userInfo?.roleCode || '';
  });

  /**
   * 检查用户是否具有指定角色
   * @param role 角色名称
   */
  const hasRole = (role: string) => {
    const roleCode = userStore.userInfo?.roleCode || '';
    return roleCode === role;
  };

  return {
    isAdmin,
    isNormal,
    isGuest,
    isNonAdmin,
    isEngineer,
    userRole,
    hasRole,
  };
}
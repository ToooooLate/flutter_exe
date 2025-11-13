import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'icon-park-twotone:setting',
      order: 40,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    children: [
      {
        meta: {
          icon: 'icon-park-twotone:user',
          title: '用户管理',
        },
        name: 'UserManagement',
        path: 'user',
        component: () => import('#/views/system/user/index.vue'),
      },
      {
        meta: {
          icon: 'icon-park-twotone:plug-one',
          title: 'DCU连接',
        },
        name: 'DCUConnection',
        path: 'dcu',
        component: () => import('#/views/system/dcu/index.vue'),
      },
    ],
  },
];

export default routes;
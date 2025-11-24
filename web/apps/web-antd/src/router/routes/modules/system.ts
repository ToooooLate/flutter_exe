import type { RouteRecordRaw } from 'vue-router';
import { $t } from '@vben/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'icon-park-twotone:setting',
      order: 40,
      title: $t('page.system.title'),
      authority: ['admin', 'engineer'], // admin和engineer角色可以访问
    },
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    children: [
      {
        meta: {
          icon: 'icon-park-twotone:user',
          title: $t('page.system.userManagement'),
          authority: ['admin'], // admin角色可以访问
        },
        name: 'UserManagement',
        path: 'user',
        component: () => import('#/views/system/user/index.vue'),
      },
      {
        meta: {
          icon: 'icon-park-twotone:plug-one',
          title: $t('page.system.dcuConnection'),
          authority: ['admin', 'engineer'], // admin和engineer角色可以访问
        },
        name: 'DCUConnection',
        path: 'dcu',
        component: () => import('#/views/system/dcu/index.vue'),
      },
    ],
  },
];

export default routes;
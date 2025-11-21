import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'icon-park-twotone:file-text',
      order: 30,
      title: $t('page.report.title'),
      hideInMenu: true, // 不在一级导航显示
      hideInBreadcrumb: false, // 在面包屑中显示
      authority: ['admin', 'normal', 'engineer'], // admin和normal角色可以访问
    },
    name: 'Report',
    path: '/report',
    component: () => import('#/views/report/index.vue'),
  },
];

export default routes;
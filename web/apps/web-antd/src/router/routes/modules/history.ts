import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'icon-park-twotone:history-query',
      order: 20,
      title: $t('page.history.title'),
      authority: ['admin', 'normal', 'engineer'], // admin和normal角色可以访问
    },
    name: 'History',
    path: '/history',
    component: () => import('#/views/history/index.vue'),
  },
];

export default routes;

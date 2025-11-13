import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'icon-park-twotone:experiment',
      order: 10,
      affixTab: true,
      title: $t('page.experiment.title'),
      // authority: ['admin'], // 只有admin角色可以访问
    },
    name: 'Experiment',
    path: '/experiment',
    component: () => import('#/views/experiment/current/index.vue'),
    // children: [
    //   {
    //     name: 'Current',
    //     path: '/current',
    //     meta: {
    //       affixTab: true,

    //     component: () => import('#/views/experiment/current/index.vue'),
    //       icon: 'game-icons:soap-experiment',
    //       title: $t('page.experiment.current'),
    //     },
    //   },
    // ],
  },
];

export default routes;

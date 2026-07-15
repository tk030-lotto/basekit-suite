import { PluginMeta } from '../core/src/types';

export const meta: PluginMeta = {
  id: 'plugin-bookkeeping',
  name: '複式簿記',
  route: '/plugins/bookkeeping',
  enabled: true,
  category: 'business',
  icon: 'book',
  requiredRole: 'member',
  networkRequired: false,
};

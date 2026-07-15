import { PluginMeta } from '../core/src/types';

export const meta: PluginMeta = {
  id: 'plugin-sns',
  name: '業務用SNS',
  route: '/plugins/sns',
  enabled: true,
  category: 'business',
  icon: 'chat',
  requiredRole: 'member',
  networkRequired: false,
};

import { PluginMeta } from '../core/src/types';

export const meta: PluginMeta = {
  id: 'plugin-personal-ops',
  name: '個人業務効率化',
  route: '/plugins/personal-ops',
  enabled: true,
  category: 'operation',
  icon: 'cog',
  requiredRole: 'member',
  networkRequired: false,
};

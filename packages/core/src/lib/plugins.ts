import { PluginMeta } from '../types';
import { meta as personalOpsMeta } from '@basekit/plugin-personal-ops/meta';
import { meta as bookkeepingMeta } from '@basekit/plugin-bookkeeping/meta';
import { meta as snsMeta } from '@basekit/plugin-sns/meta';
import dynamic from 'next/dynamic';
import React from 'react';

export interface RegisteredPlugin {
  meta: PluginMeta;
  Component: React.ComponentType<any>;
}

export const registeredPlugins: RegisteredPlugin[] = [
  {
    meta: personalOpsMeta,
    Component: dynamic(() => import('@basekit/plugin-personal-ops'), {
      ssr: false,
      loading: () => React.createElement('div', { style: { padding: '24px', color: '#94a3b8' } }, 'Loading plugin...'),
    }),
  },
  {
    meta: bookkeepingMeta,
    Component: dynamic(() => import('@basekit/plugin-bookkeeping'), {
      ssr: false,
      loading: () => React.createElement('div', { style: { padding: '24px', color: '#94a3b8' } }, 'Loading plugin...'),
    }),
  },
  {
    meta: snsMeta,
    Component: dynamic(() => import('@basekit/plugin-sns'), {
      ssr: false,
      loading: () => React.createElement('div', { style: { padding: '24px', color: '#94a3b8' } }, 'Loading plugin...'),
    }),
  },
];

export function getPluginById(id: string): RegisteredPlugin | undefined {
  return registeredPlugins.find(p => p.meta.id === id || p.meta.id.endsWith(id));
}

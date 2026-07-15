'use client';

import React from 'react';
import { getPluginById } from '../../../lib/plugins';
import { useParams } from 'next/navigation';

export default function PluginMountPage() {
  const params = useParams();
  const pluginId = params.pluginId as string;
  // Route pluginId might be "personal-ops", but plugin meta id might be "plugin-personal-ops"
  const plugin = getPluginById(pluginId);

  if (!plugin) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <h2 style={{ color: '#f43f5e', marginBottom: '16px' }}>プラグインが見つかりません</h2>
        <p style={{ color: '#94a3b8' }}>
          指定されたID <strong>{pluginId}</strong> は登録されていないか、正しくロードされませんでした。
        </p>
      </div>
    );
  }

  if (!plugin.meta.enabled) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <h2 style={{ color: '#eab308', marginBottom: '16px' }}>プラグインは無効化されています</h2>
        <p style={{ color: '#94a3b8' }}>
          このプラグイン <strong>{plugin.meta.name}</strong> は現在無効化されています。
        </p>
      </div>
    );
  }

  const { Component } = plugin;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <Component />
    </div>
  );
}

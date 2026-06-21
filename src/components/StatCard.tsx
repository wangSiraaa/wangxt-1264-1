import { Card, Statistic } from 'antd';
import type React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  suffix?: string;
}

export default function StatCard({ title, value, icon, color = '#0E7C7B', suffix }: StatCardProps) {
  return (
    <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(14,124,123,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic
          title={<span style={{ color: '#6b7280' }}>{title}</span>}
          value={value}
          valueStyle={{ color, fontWeight: 600, fontSize: 30 }}
          suffix={suffix}
        />
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 20 }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

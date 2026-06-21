import { Tag } from 'antd';
import { colorFor } from '@/utils/labels';

interface StatusTagProps {
  status: string;
  label: string;
}

export default function StatusTag({ status, label }: StatusTagProps) {
  const color = colorFor(status);
  return (
    <Tag
      color={color}
      style={{ color: '#fff', border: 'none', fontWeight: 500 }}
    >
      {label}
    </Tag>
  );
}

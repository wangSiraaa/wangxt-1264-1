import { statusColorMap } from '@/theme';

export const recordStatusLabel: Record<string, string> = {
  draft: '草稿',
  pending_consult: '待会诊',
  consulting: '会诊中',
  transferring: '转运中',
  received: '已接收',
  closed: '已闭环',
};

export const consultStatusLabel: Record<string, string> = {
  pending: '待处理',
  completed: '已完成',
};

export const transferStatusLabel: Record<string, string> = {
  pending_dispatch: '待派车',
  dispatched: '已派车',
  in_transit: '转运中',
  arrived: '已到达',
  received: '已接收',
  closed: '已闭环',
};

export const bedStatusLabel: Record<string, string> = {
  available: '空闲',
  occupied: '占用',
  cleaning: '清洁中',
};

export const ambulanceStatusLabel: Record<string, string> = {
  idle: '待命',
  on_mission: '执行中',
};

export const outcomeLabel: Record<string, string> = {
  admitted: '收治入院',
  transferred_icu: '转入ICU',
  discharged: '离院',
  deceased: '死亡',
};

export const imagingTypeLabel: Record<string, string> = {
  XRay: 'X光',
  CT: 'CT',
  MRI: 'MRI',
  Ultrasound: '超声',
};

export const roleLabel: Record<string, string> = {
  doctor: '乡镇医生',
  expert: '县医院专家',
  coordinator: '转运协调员',
  admin: '系统管理员',
};

export function colorFor(status: string): string {
  return statusColorMap[status] || '#8B949E';
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

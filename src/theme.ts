import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0E7C7B',
    colorSuccess: '#30A46C',
    colorWarning: '#F5A623',
    colorError: '#E5484D',
    colorInfo: '#0E7C7B',
    borderRadius: 8,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 60,
      siderBg: '#0A5453',
      bodyBg: '#F5F7F8',
      triggerBg: '#08403F',
    },
    Menu: {
      darkItemBg: '#0A5453',
      darkSubMenuItemBg: '#08403F',
      darkItemSelectedBg: '#0E7C7B',
      darkItemHoverBg: '#0E7C7B',
      darkItemColor: '#9FD3CF',
      darkItemSelectedColor: '#ffffff',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};

export const statusColorMap: Record<string, string> = {
  draft: '#8B949E',
  pending_consult: '#F5A623',
  consulting: '#0E7C7B',
  transferring: '#0969DA',
  received: '#1F6FEB',
  closed: '#30A46C',
  pending: '#F5A623',
  completed: '#30A46C',
  pending_dispatch: '#F5A623',
  dispatched: '#0969DA',
  in_transit: '#0969DA',
  arrived: '#1F6FEB',
  available: '#30A46C',
  occupied: '#E5484D',
  cleaning: '#F5A623',
  idle: '#30A46C',
  on_mission: '#0969DA',
};

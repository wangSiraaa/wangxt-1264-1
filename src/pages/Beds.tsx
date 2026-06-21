import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Spin, Typography, Space, Statistic, Empty, Button, Tag, message } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '@/api';
import StatusTag from '@/components/StatusTag';
import { bedStatusLabel } from '@/utils/labels';
import type { Bed, BedStatus } from '@/types';

const bedColor: Record<BedStatus, string> = {
  available: '#30A46C',
  occupied: '#E5484D',
  cleaning: '#F5A623',
};

export default function Beds() {
  const [loading, setLoading] = useState(true);
  const [beds, setBeds] = useState<Bed[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setBeds(await api.listBeds());
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Bed[]>();
    for (const b of beds) {
      if (!map.has(b.department)) map.set(b.department, []);
      map.get(b.department)!.push(b);
    }
    return [...map.entries()];
  }, [beds]);

  const counts = useMemo(() => {
    return {
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied: beds.filter((b) => b.status === 'occupied').length,
      cleaning: beds.filter((b) => b.status === 'cleaning').length,
    };
  }, [beds]);

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>床位看板</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="总床位" value={counts.total} valueStyle={{ color: '#0E7C7B' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="空闲" value={counts.available} valueStyle={{ color: '#30A46C' }} suffix="张" /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="占用" value={counts.occupied} valueStyle={{ color: '#E5484D' }} suffix="张" /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="清洁中" value={counts.cleaning} valueStyle={{ color: '#F5A623' }} suffix="张" /></Card></Col>
      </Row>

      {grouped.length === 0 ? (
        <Empty description="暂无床位数据" />
      ) : (
        grouped.map(([dept, list]) => (
          <Card key={dept} title={<Space><HomeOutlined />{dept}</Space>} styles={{ body: { paddingTop: 16 } }}>
            <Row gutter={[12, 12]}>
              {list.map((bed) => (
                <Col key={bed.id} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <div
                    style={{
                      border: `2px solid ${bedColor[bed.status]}`,
                      borderRadius: 12,
                      padding: 16,
                      background: `${bedColor[bed.status]}0D`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography.Title level={4} style={{ margin: 0, color: bedColor[bed.status] }}>{bed.bedNumber}</Typography.Title>
                    <div style={{ marginTop: 8 }}>
                      <StatusTag status={bed.status} label={bedStatusLabel[bed.status]} />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ))
      )}

      <Card>
        <Space>
          <Tag color="#30A46C" style={{ color: '#fff', border: 'none' }}>空闲</Tag>
          <Tag color="#E5484D" style={{ color: '#fff', border: 'none' }}>占用</Tag>
          <Tag color="#F5A623" style={{ color: '#fff', border: 'none' }}>清洁中</Tag>
        </Space>
      </Card>
    </Space>
  );
}

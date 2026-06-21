import { useEffect, useState } from 'react';
import { Card, Table, Space, Typography, Tag, Spin, Empty, Button } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { outcomeLabel, formatDateTime } from '@/utils/labels';
import type { AdmissionResult, Transfer } from '@/types';

export default function Admissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AdmissionResult[]>([]);
  const [pending, setPending] = useState<Transfer[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [list, transfers] = await Promise.all([api.listAdmissions(), api.listTransfers({})]);
      setResults(list as AdmissionResult[]);
      setPending(transfers.filter((t) => t.status === 'received'));
    } finally {
      setLoading(false);
    }
  };

  const outcomeColor: Record<string, string> = {
    admitted: 'blue',
    transferred_icu: 'red',
    discharged: 'green',
    deceased: 'default',
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>接诊结果回填</Typography.Title>

      {pending.length > 0 && (
        <Card title="待回填接诊结果（已接收）" size="small">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={pending}
            columns={[
              { title: '患者', dataIndex: 'patientName', width: 100 },
              { title: '床位', dataIndex: 'bedNumber', width: 120, render: (v, r) => v ? `${v}（${r.department}）` : '—' },
              { title: '接收时间', dataIndex: 'arrivalTime', render: formatDateTime },
              {
                title: '操作', width: 120,
                render: (_, r) => (
                  <Button type="primary" size="small" icon={<FormOutlined />} onClick={() => navigate(`/admissions/${r.id}`)}>
                    回填结果
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Card title="已完成接诊结果" styles={{ body: { padding: 0 } }}>
        <Spin spinning={loading}>
          {results.length === 0 ? (
            <Empty style={{ padding: 32 }} description="暂无已回填的接诊结果" />
          ) : (
            <Table
              rowKey="id"
              dataSource={results}
              columns={[
                { title: '患者', dataIndex: 'patientName', width: 100 },
                { title: '接诊诊断', dataIndex: 'admissionDiagnosis', ellipsis: true },
                { title: '处置', dataIndex: 'treatment', ellipsis: true, render: (v) => v || '—' },
                { title: '结局', dataIndex: 'outcome', width: 110, render: (v) => <Tag color={outcomeColor[v]}>{outcomeLabel[v]}</Tag> },
                { title: '接收人', dataIndex: 'receivedByName', width: 110 },
                { title: '回填时间', dataIndex: 'receivedAt', width: 150, render: formatDateTime },
              ]}
            />
          )}
        </Spin>
      </Card>
    </Space>
  );
}

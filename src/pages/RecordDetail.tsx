import { useEffect, useState } from 'react';
import {
  Card, Descriptions, Button, Space, Typography, Row, Col, List, Tag, Upload, Select, Empty, Spin, Alert, Modal, message, Statistic,
} from 'antd';
import {
  ArrowLeftOutlined, UploadOutlined, MessageOutlined, DeleteOutlined, FileImageOutlined, ThunderboltOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { recordStatusLabel, imagingTypeLabel, formatDateTime } from '@/utils/labels';
import type { ImagingIndex, ImagingType, MedicalRecord } from '@/types';

export default function RecordDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [images, setImages] = useState<ImagingIndex[]>([]);
  const [uploadType, setUploadType] = useState<ImagingType>('CT');
  const [uploading, setUploading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    void load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [rec, imgs] = await Promise.all([api.getRecord(id), api.listImages(id)]);
      setRecord(rec);
      setImages(imgs);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload: UploadProps['beforeUpload'] = (file) => {
    setUploading(true);
    api.uploadImage(id, uploadType, file.name)
      .then((img) => {
        setImages((prev) => [...prev, img]);
        message.success(`${imagingTypeLabel[uploadType]} 影像上传成功`);
        return api.getRecord(id);
      })
      .then((rec) => setRecord(rec))
      .catch((e) => message.error(e instanceof Error ? e.message : '上传失败'))
      .finally(() => setUploading(false));
    return false;
  };

  const handleDelete = (imgId: string) => {
    Modal.confirm({
      title: '确认删除该影像？',
      onOk: async () => {
        await api.deleteImage(imgId);
        setImages((prev) => prev.filter((i) => i.id !== imgId));
        const rec = await api.getRecord(id);
        setRecord(rec);
        message.success('已删除');
      },
    });
  };

  const handleRequestConsult = async () => {
    setRequesting(true);
    try {
      const { consultationId } = await api.requestConsult(id);
      message.success('已发起专家会诊');
      navigate(`/consultations/${consultationId}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '发起失败');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!record) return <Empty description="病历不存在" />;

  const canRequestConsult = user?.role === 'doctor' || user?.role === 'admin';
  const imagingMissing = !record.imagingComplete || images.length === 0;
  const alreadyConsulted = record.status !== 'draft' && record.status !== 'pending_consult';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/records')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {record.patientName} 的病历
        </Typography.Title>
        {record.greenChannel && record.status !== 'closed' && (
          <Tag icon={<ThunderboltOutlined />} color="error">绿色通道</Tag>
        )}
        <StatusTag status={record.status} label={recordStatusLabel[record.status]} />
      </Space>

      {record.greenChannel && record.isCritical && (
        <Alert type="error" banner showIcon icon={<ThunderboltOutlined />} message="该病例为危急值，已自动纳入绿色通道优先处置。" />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="病历详情">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="姓名">{record.patientName}</Descriptions.Item>
              <Descriptions.Item label="年龄/性别">{record.patientAge} 岁 / {record.patientGender}</Descriptions.Item>
              <Descriptions.Item label="体温" span={1}>{record.temperature ?? '—'} ℃</Descriptions.Item>
              <Descriptions.Item label="心率">{record.heartRate ?? '—'} 次/分</Descriptions.Item>
              <Descriptions.Item label="血压">{record.systolicBP && record.diastolicBP ? `${record.systolicBP}/${record.diastolicBP}` : '—'}</Descriptions.Item>
              <Descriptions.Item label="血氧">{record.spo2 ?? '—'} %</Descriptions.Item>
              <Descriptions.Item label="主诉" span={2}>{record.chiefComplaint}</Descriptions.Item>
              <Descriptions.Item label="现病史" span={2}>{record.presentIllness || '—'}</Descriptions.Item>
              <Descriptions.Item label="既往史" span={2}>{record.pastHistory || '—'}</Descriptions.Item>
              <Descriptions.Item label="录入医生">{record.doctorName}</Descriptions.Item>
              <Descriptions.Item label="录入机构">{record.orgName}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{formatDateTime(record.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <FileImageOutlined />
                <span>影像资料</span>
                {record.imagingComplete
                  ? <Tag color="success">已齐全</Tag>
                  : <Tag color="warning">缺失</Tag>}
              </Space>
            }
            extra={
              canRequestConsult && (
                <Space>
                  <Select
                    size="small"
                    value={uploadType}
                    onChange={(v) => setUploadType(v as ImagingType)}
                    style={{ width: 90 }}
                    options={Object.entries(imagingTypeLabel).map(([value, label]) => ({ value, label }))}
                  />
                  <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*,.dcm">
                    <Button size="small" icon={<UploadOutlined />} loading={uploading}>上传影像</Button>
                  </Upload>
                </Space>
              )
            }
          >
            {images.length === 0 ? (
              <Empty description="暂无影像，请先上传" />
            ) : (
              <List
                dataSource={images}
                renderItem={(img) => (
                  <List.Item
                    actions={
                      canRequestConsult
                        ? [<Button key="del" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(img.id)} />]
                        : undefined
                    }
                  >
                    <List.Item.Meta
                      avatar={<div style={{ width: 40, height: 40, borderRadius: 8, background: '#0E7C7B14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7C7B' }}><FileImageOutlined /></div>}
                      title={<Space><Tag color="default">{imagingTypeLabel[img.type]}</Tag>{img.fileName}</Space>}
                      description={formatDateTime(img.uploadedAt)}
                    />
                  </List.Item>
                )}
              />
            )}

            {imagingMissing && (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="影像资料缺失"
                description="需上传至少一份影像资料后方可发起专家会诊。"
              />
            )}
          </Card>
        </Col>
      </Row>

      {canRequestConsult && (
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size="large">
              <Statistic title="影像状态" value={imagingMissing ? '缺失' : '齐全'} valueStyle={{ color: imagingMissing ? '#E5484D' : '#30A46C', fontSize: 18 }} />
              <Statistic title="病历状态" value={recordStatusLabel[record.status]} valueStyle={{ fontSize: 18 }} />
            </Space>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<MessageOutlined />}
                loading={requesting}
                disabled={imagingMissing || alreadyConsulted}
                onClick={handleRequestConsult}
              >
                {alreadyConsulted ? '已发起会诊' : '发起专家会诊'}
              </Button>
              {imagingMissing && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <CheckCircleOutlined /> 影像齐全后自动启用
                </Typography.Text>
              )}
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
}

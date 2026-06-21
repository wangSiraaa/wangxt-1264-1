import type {
  AdmissionOutcome,
  AdmissionResult,
  Ambulance,
  Bed,
  Consultation,
  ImagingIndex,
  ImagingType,
  MedicalRecord,
  Organization,
  Transfer,
  User,
} from '@/types';

export const orgs: Organization[] = [
  { id: 'org-township', name: '青石乡卫生院', type: 'township', level: 1 },
  { id: 'org-county', name: '云岭县人民医院', type: 'county', level: 2 },
];

export const users: User[] = [
  { id: 'user-doctor', name: '王乡镇医生', role: 'doctor', orgId: 'org-township', orgName: '青石乡卫生院', phone: '13800000001' },
  { id: 'user-expert', name: '陈县医院专家', role: 'expert', orgId: 'org-county', orgName: '云岭县人民医院', phone: '13800000002' },
  { id: 'user-coord', name: '刘转运协调员', role: 'coordinator', orgId: 'org-county', orgName: '云岭县人民医院', phone: '13800000003' },
  { id: 'user-admin', name: '系统管理员', role: 'admin', orgId: 'org-county', orgName: '云岭县人民医院', phone: '13800000004' },
];

const passwords: Record<string, string> = {
  doctor1: '123456',
  expert1: '123456',
  coord1: '123456',
  admin1: '123456',
};
const usernameToUserId: Record<string, string> = {
  doctor1: 'user-doctor',
  expert1: 'user-expert',
  coord1: 'user-coord',
  admin1: 'user-admin',
};

export const ambulances: Ambulance[] = [
  { id: 'amb-1', plateNumber: '云A-12001', driver: '张师傅', status: 'idle', orgId: 'org-county' },
  { id: 'amb-2', plateNumber: '云A-12002', driver: '李师傅', status: 'idle', orgId: 'org-county' },
  { id: 'amb-3', plateNumber: '云A-12003', driver: '赵师傅', status: 'idle', orgId: 'org-county' },
];

export const beds: Bed[] = [
  { id: 'bed-1', bedNumber: '急诊-01', department: '急诊科', status: 'available', orgId: 'org-county' },
  { id: 'bed-2', bedNumber: '急诊-02', department: '急诊科', status: 'available', orgId: 'org-county' },
  { id: 'bed-3', bedNumber: '急诊-03', department: '急诊科', status: 'cleaning', orgId: 'org-county' },
  { id: 'bed-4', bedNumber: '心内-05', department: '心内科', status: 'occupied', orgId: 'org-county' },
  { id: 'bed-5', bedNumber: '心内-06', department: '心内科', status: 'available', orgId: 'org-county' },
  { id: 'bed-6', bedNumber: 'ICU-01', department: '重症监护', status: 'available', orgId: 'org-county' },
  { id: 'bed-7', bedNumber: 'ICU-02', department: '重症监护', status: 'occupied', orgId: 'org-county' },
];

export const records: MedicalRecord[] = [
  {
    id: 'rec-1',
    patientName: '李大山',
    patientAge: 67,
    patientGender: '男',
    chiefComplaint: '突发胸痛3小时，伴大汗、气促',
    history: '高血压病史10年，否认糖尿病。今晨劳作后突发胸骨后压榨样疼痛。',
    temperature: 36.8,
    heartRate: 112,
    bloodPressure: '160/95',
    spo2: 92,
    isCritical: true,
    greenChannel: true,
    status: 'pending_consult',
    doctorId: 'user-doctor',
    doctorName: '王乡镇医生',
    orgId: 'org-township',
    orgName: '青石乡卫生院',
    imagingComplete: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'rec-2',
    patientName: '张小花',
    patientAge: 34,
    patientGender: '女',
    chiefComplaint: '右下腹痛2天，低热',
    history: '既往体健，无手术史。',
    temperature: 37.8,
    heartRate: 88,
    bloodPressure: '118/76',
    spo2: 98,
    isCritical: false,
    greenChannel: false,
    status: 'consulting',
    doctorId: 'user-doctor',
    doctorName: '王乡镇医生',
    orgId: 'org-township',
    orgName: '青石乡卫生院',
    imagingComplete: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'rec-3',
    patientName: '孙老根',
    patientAge: 71,
    patientGender: '男',
    chiefComplaint: '咳嗽咳痰伴发热1周',
    history: '慢性阻塞性肺病5年。',
    temperature: 38.5,
    heartRate: 96,
    bloodPressure: '130/82',
    spo2: 90,
    isCritical: false,
    greenChannel: false,
    status: 'draft',
    doctorId: 'user-doctor',
    doctorName: '王乡镇医生',
    orgId: 'org-township',
    orgName: '青石乡卫生院',
    imagingComplete: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export const images: ImagingIndex[] = [
  { id: 'img-1', recordId: 'rec-1', type: 'CT', fileName: 'chest_ct_001.dcm', filePath: '/uploads/rec-1/chest_ct_001.dcm', uploadedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString() },
  { id: 'img-2', recordId: 'rec-1', type: 'XRay', fileName: 'chest_xray_001.dcm', filePath: '/uploads/rec-1/chest_xray_001.dcm', uploadedAt: new Date(Date.now() - 1000 * 60 * 84).toISOString() },
  { id: 'img-3', recordId: 'rec-2', type: 'Ultrasound', fileName: 'abdomen_us_001.dcm', filePath: '/uploads/rec-2/abdomen_us_001.dcm', uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
];

export const consultations: Consultation[] = [
  {
    id: 'con-1',
    recordId: 'rec-1',
    expertId: undefined,
    isCritical: false,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
  },
  {
    id: 'con-2',
    recordId: 'rec-2',
    expertId: 'user-expert',
    expertName: '陈县医院专家',
    opinion: '结合病史与超声，考虑急性阑尾炎可能，建议转入普外科进一步评估，必要时手术。',
    diagnosis: '急性阑尾炎（疑似）',
    recommendation: '禁食水，建立静脉通路，转运至县医院普外科，途中监测生命体征。',
    isCritical: false,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

export const transfers: Transfer[] = [];

export const admissions: AdmissionResult[] = [];

export const db = {
  orgs,
  users,
  passwords,
  usernameToUserId,
  ambulances,
  beds,
  records,
  images,
  consultations,
  transfers,
  admissions,
};

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type { ImagingType, AdmissionOutcome };

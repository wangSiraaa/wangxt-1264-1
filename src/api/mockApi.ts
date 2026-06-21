import { db, uid } from './mockData';
import type {
  AdmissionOutcome,
  AdmissionResult,
  Ambulance,
  Bed,
  Consultation,
  ImagingIndex,
  ImagingType,
  MedicalRecord,
  RecordStatus,
  Transfer,
  TransferChange,
  TransferStatus,
  User,
} from '@/types';

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function recomputeImaging(recordId: string): boolean {
  return db.images.some((img) => img.recordId === recordId);
}

function findUser(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export const mockApi = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    await delay();
    const userId = db.usernameToUserId[username];
    if (!userId || db.passwords[username] !== password) {
      throw new Error('用户名或密码错误');
    }
    const user = findUser(userId)!;
    return { token: `mock-token-${userId}`, user: clone(user) };
  },

  async listRecords(params: { status?: RecordStatus; critical?: boolean; greenChannel?: boolean }): Promise<MedicalRecord[]> {
    await delay();
    let list = [...db.records];
    if (params.status) list = list.filter((r) => r.status === params.status);
    if (params.critical) list = list.filter((r) => r.isCritical);
    if (params.greenChannel) list = list.filter((r) => r.greenChannel);
    list.sort((a, b) => (b.greenChannel ? 1 : 0) - (a.greenChannel ? 1 : 0) || +new Date(b.createdAt) - +new Date(a.createdAt));
    return clone(list);
  },

  async getRecord(id: string): Promise<MedicalRecord> {
    await delay();
    const rec = db.records.find((r) => r.id === id);
    if (!rec) throw new Error('病历不存在');
    return clone(rec);
  },

  async createRecord(input: Omit<MedicalRecord, 'id' | 'status' | 'doctorId' | 'doctorName' | 'orgId' | 'orgName' | 'imagingComplete' | 'greenChannel' | 'createdAt'>, doctor: User): Promise<MedicalRecord> {
    await delay();
    const rec: MedicalRecord = {
      ...input,
      id: uid('rec'),
      status: 'draft',
      doctorId: doctor.id,
      doctorName: doctor.name,
      orgId: doctor.orgId,
      orgName: doctor.orgName,
      imagingComplete: false,
      greenChannel: false,
      createdAt: new Date().toISOString(),
    };
    db.records.unshift(rec);
    return clone(rec);
  },

  async listImages(recordId: string): Promise<ImagingIndex[]> {
    await delay();
    return clone(db.images.filter((img) => img.recordId === recordId));
  },

  async uploadImage(recordId: string, type: ImagingType, fileName: string): Promise<ImagingIndex> {
    await delay(300);
    const rec = db.records.find((r) => r.id === recordId);
    if (!rec) throw new Error('病历不存在');
    const img: ImagingIndex = {
      id: uid('img'),
      recordId,
      type,
      fileName,
      filePath: `/uploads/${recordId}/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };
    db.images.push(img);
    rec.imagingComplete = recomputeImaging(recordId);
    return clone(img);
  },

  async deleteImage(id: string): Promise<void> {
    await delay();
    const idx = db.images.findIndex((img) => img.id === id);
    if (idx >= 0) {
      const [removed] = db.images.splice(idx, 1);
      const rec = db.records.find((r) => r.id === removed.recordId);
      if (rec) rec.imagingComplete = recomputeImaging(removed.recordId);
    }
  },

  async requestConsult(recordId: string): Promise<{ consultationId: string }> {
    await delay();
    const rec = db.records.find((r) => r.id === recordId);
    if (!rec) throw new Error('病历不存在');
    // 业务规则:影像资料缺失不能发起专家会诊
    if (!rec.imagingComplete || db.images.filter((img) => img.recordId === recordId).length === 0) {
      throw new Error('影像资料缺失，无法发起专家会诊。请先上传至少一份影像资料。');
    }
    if (rec.status !== 'draft' && rec.status !== 'pending_consult') {
      throw new Error('当前病历状态不允许发起会诊');
    }
    const existing = db.consultations.find((c) => c.recordId === recordId && c.status === 'pending');
    const consultationId = existing?.id ?? uid('con');
    if (!existing) {
      db.consultations.push({
        id: consultationId,
        recordId,
        expertId: undefined,
        isCritical: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    rec.status = 'pending_consult';
    return { consultationId };
  },

  async listConsultations(params: { status?: 'pending' | 'completed' }): Promise<Consultation[]> {
    await delay();
    let list = [...db.consultations];
    if (params.status) list = list.filter((c) => c.status === params.status);
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return clone(list);
  },

  async getConsultation(id: string): Promise<Consultation> {
    await delay();
    const con = db.consultations.find((c) => c.id === id);
    if (!con) throw new Error('会诊不存在');
    return clone(con);
  },

  async completeConsultation(id: string, input: { opinion: string; diagnosis: string; recommendation: string; isCritical: boolean }, expert: User): Promise<Consultation> {
    await delay();
    const con = db.consultations.find((c) => c.id === id);
    if (!con) throw new Error('会诊不存在');
    if (con.status === 'completed') throw new Error('该会诊已完成');
    con.expertId = expert.id;
    con.expertName = expert.name;
    con.opinion = input.opinion;
    con.diagnosis = input.diagnosis;
    con.recommendation = input.recommendation;
    con.isCritical = input.isCritical;
    con.status = 'completed';
    con.completedAt = new Date().toISOString();
    const rec = db.records.find((r) => r.id === con.recordId);
    if (rec) {
      rec.status = 'consulting';
      // 业务规则:危急值病例自动进入绿色通道
      if (input.isCritical) {
        rec.isCritical = true;
        rec.greenChannel = true;
      }
    }
    return clone(con);
  },

  async listTransfers(params: { status?: TransferStatus; greenChannel?: boolean; recordId?: string }): Promise<Transfer[]> {
    await delay();
    let list = [...db.transfers];
    if (params.status) list = list.filter((t) => t.status === params.status);
    if (params.greenChannel) list = list.filter((t) => t.greenChannel);
    if (params.recordId) list = list.filter((t) => t.recordId === params.recordId);
    list.sort((a, b) => (b.greenChannel ? 1 : 0) - (a.greenChannel ? 1 : 0) || +new Date(b.createdAt) - +new Date(a.createdAt));
    return clone(list);
  },

  async getTransfer(id: string): Promise<Transfer> {
    await delay();
    const t = db.transfers.find((x) => x.id === id);
    if (!t) throw new Error('转运单不存在');
    return clone(t);
  },

  async createTransfer(input: { recordId: string; ambulanceId: string; bedId: string; bedChangeRemark?: string }, coordinator: User): Promise<Transfer> {
    await delay();
    const rec = db.records.find((r) => r.id === input.recordId);
    if (!rec) throw new Error('病历不存在');
    const amb = db.ambulances.find((a) => a.id === input.ambulanceId);
    if (!amb) throw new Error('救护车不存在');
    if (amb.status !== 'idle') throw new Error('该救护车正在执行任务，请选择其他车辆');
    const bed = db.beds.find((b) => b.id === input.bedId);
    if (!bed) throw new Error('床位不存在');
    if (bed.status !== 'available') throw new Error('该床位不可用，请选择其他床位');
    amb.status = 'on_mission';
    bed.status = 'occupied';
    rec.status = 'transferring';
    const transfer: Transfer = {
      id: uid('trf'),
      recordId: rec.id,
      patientName: rec.patientName,
      coordinatorId: coordinator.id,
      coordinatorName: coordinator.name,
      ambulanceId: amb.id,
      ambulancePlate: amb.plateNumber,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      department: bed.department,
      status: 'dispatched',
      greenChannel: rec.greenChannel,
      bedChangeRemark: input.bedChangeRemark,
      changes: [],
      departureTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.transfers.unshift(transfer);
    return clone(transfer);
  },

  async updateTransferStatus(id: string, status: TransferStatus): Promise<Transfer> {
    await delay();
    const t = db.transfers.find((x) => x.id === id);
    if (!t) throw new Error('转运单不存在');
    t.status = status;
    if (status === 'in_transit' && !t.departureTime) t.departureTime = new Date().toISOString();
    if (status === 'arrived') t.arrivalTime = new Date().toISOString();
    if (status === 'received') {
      const rec = db.records.find((r) => r.id === t.recordId);
      if (rec) rec.status = 'received';
      const amb = db.ambulances.find((a) => a.id === t.ambulanceId);
      if (amb) amb.status = 'idle';
    }
    return clone(t);
  },

  async adjustTransfer(id: string, input: { ambulanceId?: string; bedId?: string; changeReason: string }, user: User): Promise<Transfer> {
    await delay();
    const t = db.transfers.find((x) => x.id === id);
    if (!t) throw new Error('转运单不存在');
    if (t.status === 'received' || t.status === 'closed') throw new Error('转运已完成，无法调整');
    if (!input.changeReason?.trim()) throw new Error('请填写调整原因');

    const changeAmbulance = input.ambulanceId && input.ambulanceId !== t.ambulanceId;
    const changeBed = input.bedId && input.bedId !== t.bedId;

    if (!changeAmbulance && !changeBed) throw new Error('没有需要调整的内容');

    const change: TransferChange = {
      id: uid('chg'),
      transferId: t.id,
      changeType: changeAmbulance && changeBed ? 'both' : changeAmbulance ? 'ambulance' : 'bed',
      oldAmbulancePlate: t.ambulancePlate,
      oldBedInfo: t.bedNumber ? `${t.bedNumber}（${t.department}）` : undefined,
      changeReason: input.changeReason,
      changedByName: user.name,
      createdAt: new Date().toISOString(),
    };

    if (changeAmbulance) {
      const oldAmb = t.ambulanceId ? db.ambulances.find((a) => a.id === t.ambulanceId) : null;
      const newAmb = db.ambulances.find((a) => a.id === input.ambulanceId);
      if (!newAmb) throw new Error('新救护车不存在');
      if (newAmb.status !== 'idle') throw new Error('新救护车正在执行任务，无法调度');
      if (oldAmb) oldAmb.status = 'idle';
      newAmb.status = 'on_mission';
      t.ambulanceId = newAmb.id;
      t.ambulancePlate = newAmb.plateNumber;
      change.newAmbulancePlate = newAmb.plateNumber;
    }

    if (changeBed) {
      const oldBed = t.bedId ? db.beds.find((b) => b.id === t.bedId) : null;
      const newBed = db.beds.find((b) => b.id === input.bedId);
      if (!newBed) throw new Error('新床位不存在');
      if (newBed.status !== 'available') throw new Error('新床位当前不可用');
      if (oldBed) oldBed.status = 'available';
      newBed.status = 'occupied';
      t.bedId = newBed.id;
      t.bedNumber = newBed.bedNumber;
      t.department = newBed.department;
      t.bedChangeRemark = input.changeReason;
      change.newBedInfo = `${newBed.bedNumber}（${newBed.department}）`;
    }

    db.transferChanges.unshift(change);
    if (!t.changes) t.changes = [];
    t.changes.unshift(change);
    return clone(t);
  },

  async getTransferChanges(id: string): Promise<TransferChange[]> {
    await delay();
    const changes = db.transferChanges.filter((c) => c.transferId === id);
    changes.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return clone(changes);
  },

  async listBeds(): Promise<Bed[]> {
    await delay();
    return clone(db.beds);
  },

  async listAmbulances(): Promise<Ambulance[]> {
    await delay();
    return clone(db.ambulances);
  },

  async listGreenChannel(): Promise<MedicalRecord[]> {
    await delay();
    const list = db.records.filter((r) => r.greenChannel && r.status !== 'closed');
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return clone(list);
  },

  async listAdmissions(): Promise<AdmissionResult[]> {
    await delay();
    return clone(db.admissions);
  },

  async createAdmission(input: { transferId: string; admissionDiagnosis: string; treatment?: string; outcome: AdmissionOutcome }, user: User): Promise<AdmissionResult> {
    await delay();
    const t = db.transfers.find((x) => x.id === input.transferId);
    if (!t) throw new Error('转运单不存在');
    // 业务规则:转运确认接收后才可回填接诊结果
    if (t.status !== 'received' && t.status !== 'closed') {
      throw new Error('转运单尚未确认接收，无法回填接诊结果');
    }
    const rec = db.records.find((r) => r.id === t.recordId);
    const result: AdmissionResult = {
      id: uid('adm'),
      transferId: t.id,
      recordId: t.recordId,
      patientName: t.patientName,
      admissionDiagnosis: input.admissionDiagnosis,
      treatment: input.treatment,
      outcome: input.outcome,
      receivedBy: user.id,
      receivedByName: user.name,
      receivedAt: new Date().toISOString(),
    };
    db.admissions.unshift(result);
    // 业务规则:回填接诊结果后关闭转诊闭环,释放床位
    t.status = 'closed';
    if (rec) rec.status = 'closed';
    const bed = db.beds.find((b) => b.id === t.bedId);
    if (bed && bed.status === 'occupied') bed.status = 'cleaning';
    return clone(result);
  },

  async dashboardStats(): Promise<{
    pendingConsult: number;
    consulting: number;
    inTransit: number;
    greenChannelActive: number;
    completedToday: number;
    availableBeds: number;
  }> {
    await delay();
    const today = new Date().setHours(0, 0, 0, 0);
    return {
      pendingConsult: db.consultations.filter((c) => c.status === 'pending').length,
      consulting: db.records.filter((r) => r.status === 'consulting').length,
      inTransit: db.transfers.filter((t) => t.status === 'dispatched' || t.status === 'in_transit' || t.status === 'arrived').length,
      greenChannelActive: db.records.filter((r) => r.greenChannel && r.status !== 'closed').length,
      completedToday: db.admissions.filter((a) => +new Date(a.receivedAt) >= today).length,
      availableBeds: db.beds.filter((b) => b.status === 'available').length,
    };
  },
};

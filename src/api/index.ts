import { mockApi } from './mockApi';
import { useAuthStore } from '@/store/auth';
import type {
  AdmissionOutcome,
  AdmissionResult,
  Ambulance,
  Bed,
  Consultation,
  DashboardStats,
  ImagingIndex,
  ImagingType,
  MedicalRecord,
  RecordStatus,
  Transfer,
  TransferStatus,
  User,
} from '@/types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(url, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      msg = body.message || body.title || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get useMock() {
    return USE_MOCK;
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    if (USE_MOCK) return mockApi.login(username, password);
    const res = await http<{ token: string; user: { id: string; username: string; fullName: string; role: string; phone?: string; orgId: string; orgName: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    );
    return {
      token: res.token,
      user: {
        id: res.user.id,
        username: res.user.username,
        name: res.user.fullName,
        role: res.user.role as User['role'],
        phone: res.user.phone,
        orgId: res.user.orgId,
        orgName: res.user.orgName,
      },
    };
  },

  async listRecords(params: { status?: RecordStatus; critical?: boolean; greenChannel?: boolean }): Promise<MedicalRecord[]> {
    if (USE_MOCK) return mockApi.listRecords(params);
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.critical) qs.set('critical', 'true');
    if (params.greenChannel) qs.set('greenChannel', 'true');
    return http(`/api/records?${qs}`);
  },

  async getRecord(id: string): Promise<MedicalRecord> {
    if (USE_MOCK) return mockApi.getRecord(id);
    return http(`/api/records/${id}`);
  },

  async createRecord(input: Omit<MedicalRecord, 'id' | 'status' | 'doctorId' | 'doctorName' | 'orgId' | 'orgName' | 'imagingComplete' | 'greenChannel' | 'createdAt'>, doctor: User): Promise<MedicalRecord> {
    if (USE_MOCK) return mockApi.createRecord(input, doctor);
    return http('/api/records', { method: 'POST', body: JSON.stringify(input) });
  },

  async listImages(recordId: string): Promise<ImagingIndex[]> {
    if (USE_MOCK) return mockApi.listImages(recordId);
    return http(`/api/records/${recordId}/images`);
  },

  async uploadImage(recordId: string, type: ImagingType, fileName: string): Promise<ImagingIndex> {
    if (USE_MOCK) return mockApi.uploadImage(recordId, type, fileName);
    const form = new FormData();
    form.append('type', type);
    form.append('fileName', fileName);
    const res = await fetch(`/api/records/${recordId}/images`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    });
    if (!res.ok) {
      let msg = '影像上传失败';
      try {
        const body = await res.json();
        msg = body.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  async deleteImage(id: string): Promise<void> {
    if (USE_MOCK) return mockApi.deleteImage(id);
    await http(`/api/images/${id}`, { method: 'DELETE' });
  },

  async requestConsult(recordId: string): Promise<{ consultationId: string }> {
    if (USE_MOCK) return mockApi.requestConsult(recordId);
    return http(`/api/records/${recordId}/request-consult`, { method: 'POST' });
  },

  async listConsultations(params: { status?: 'pending' | 'completed' }): Promise<Consultation[]> {
    if (USE_MOCK) return mockApi.listConsultations(params);
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    return http(`/api/consultations?${qs}`);
  },

  async getConsultation(id: string): Promise<Consultation> {
    if (USE_MOCK) return mockApi.getConsultation(id);
    return http(`/api/consultations/${id}`);
  },

  async completeConsultation(id: string, input: { opinion: string; diagnosis: string; recommendation: string; isCritical: boolean }, expert: User): Promise<Consultation> {
    if (USE_MOCK) return mockApi.completeConsultation(id, input, expert);
    return http(`/api/consultations/${id}/complete`, { method: 'POST', body: JSON.stringify(input) });
  },

  async listTransfers(params: { status?: TransferStatus; greenChannel?: boolean; recordId?: string }): Promise<Transfer[]> {
    if (USE_MOCK) return mockApi.listTransfers(params);
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.greenChannel) qs.set('greenChannel', 'true');
    if (params.recordId) qs.set('recordId', params.recordId);
    return http(`/api/transfers?${qs}`);
  },

  async getTransfer(id: string): Promise<Transfer> {
    if (USE_MOCK) return mockApi.getTransfer(id);
    return http(`/api/transfers/${id}`);
  },

  async createTransfer(input: { recordId: string; ambulanceId: string; bedId: string; bedChangeRemark?: string }, coordinator: User): Promise<Transfer> {
    if (USE_MOCK) return mockApi.createTransfer(input, coordinator);
    return http('/api/transfers', { method: 'POST', body: JSON.stringify(input) });
  },

  async updateTransferStatus(id: string, status: TransferStatus): Promise<Transfer> {
    if (USE_MOCK) return mockApi.updateTransferStatus(id, status);
    return http(`/api/transfers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async adjustTransfer(id: string, input: { ambulanceId?: string; bedId?: string; changeReason: string }, user: User): Promise<Transfer> {
    if (USE_MOCK) return mockApi.adjustTransfer(id, input, user);
    return http(`/api/transfers/${id}/adjust`, { method: 'POST', body: JSON.stringify(input) });
  },

  async getTransferChanges(id: string): Promise<TransferChange[]> {
    if (USE_MOCK) return mockApi.getTransferChanges(id);
    return http(`/api/transfers/${id}/changes`);
  },

  async listBeds(): Promise<Bed[]> {
    if (USE_MOCK) return mockApi.listBeds();
    return http<Bed[]>('/api/beds');
  },

  async listAmbulances(): Promise<Ambulance[]> {
    if (USE_MOCK) return mockApi.listAmbulances();
    return http<Ambulance[]>('/api/ambulances');
  },

  async listGreenChannel(): Promise<MedicalRecord[]> {
    if (USE_MOCK) return mockApi.listGreenChannel();
    return http<MedicalRecord[]>('/api/records?greenChannel=true');
  },

  async listAdmissions(): Promise<AdmissionResult[]> {
    if (USE_MOCK) return mockApi.listAdmissions();
    return http<AdmissionResult[]>('/api/admissions');
  },

  async createAdmission(input: { transferId: string; admissionDiagnosis: string; treatment?: string; outcome: AdmissionOutcome }, user: User): Promise<AdmissionResult> {
    if (USE_MOCK) return mockApi.createAdmission(input, user);
    return http<AdmissionResult>('/api/admissions', { method: 'POST', body: JSON.stringify(input) });
  },

  async dashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) return mockApi.dashboardStats();
    return http<DashboardStats>('/api/dashboard/stats');
  },
};

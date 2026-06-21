export type UserRole = 'doctor' | 'expert' | 'coordinator' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'township' | 'county';
  level: number;
  parentId?: string;
}

export type RecordStatus =
  | 'draft'
  | 'pending_consult'
  | 'consulting'
  | 'transferring'
  | 'received'
  | 'closed';

export interface MedicalRecord {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  chiefComplaint: string;
  presentIllness?: string;
  pastHistory?: string;
  temperature?: number;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  isCritical: boolean;
  greenChannel: boolean;
  status: RecordStatus;
  doctorId: string;
  doctorName: string;
  orgId: string;
  orgName: string;
  imagingComplete: boolean;
  createdAt: string;
}

export type ImagingType = 'XRay' | 'CT' | 'MRI' | 'Ultrasound';

export interface ImagingIndex {
  id: string;
  recordId: string;
  type: ImagingType;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export type ConsultationStatus = 'pending' | 'completed';

export interface Consultation {
  id: string;
  recordId: string;
  expertId?: string;
  expertName?: string;
  opinion?: string;
  diagnosis?: string;
  recommendation?: string;
  isCritical: boolean;
  status: ConsultationStatus;
  createdAt: string;
  completedAt?: string;
}

export type AmbulanceStatus = 'idle' | 'on_mission';

export interface Ambulance {
  id: string;
  plateNumber: string;
  driver: string;
  status: AmbulanceStatus;
  orgId: string;
}

export type BedStatus = 'available' | 'occupied' | 'cleaning';

export interface Bed {
  id: string;
  bedNumber: string;
  department: string;
  status: BedStatus;
  orgId: string;
}

export type TransferStatus =
  | 'pending_dispatch'
  | 'dispatched'
  | 'in_transit'
  | 'arrived'
  | 'received'
  | 'closed';

export interface Transfer {
  id: string;
  recordId: string;
  patientName: string;
  coordinatorId: string;
  coordinatorName: string;
  ambulanceId?: string;
  ambulancePlate?: string;
  bedId?: string;
  bedNumber?: string;
  department?: string;
  status: TransferStatus;
  greenChannel: boolean;
  departureTime?: string;
  arrivalTime?: string;
  createdAt: string;
}

export type AdmissionOutcome =
  | 'admitted'
  | 'transferred_icu'
  | 'discharged'
  | 'deceased';

export interface AdmissionResult {
  id: string;
  transferId: string;
  recordId: string;
  patientName: string;
  admissionDiagnosis: string;
  treatment?: string;
  outcome: AdmissionOutcome;
  receivedBy: string;
  receivedByName: string;
  receivedAt: string;
}

export interface DashboardStats {
  pendingConsult: number;
  consulting: number;
  inTransit: number;
  greenChannelActive: number;
  completedToday: number;
  availableBeds: number;
}

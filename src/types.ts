/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DepartmentId =
  | 'secretarial'
  | 'operation'
  | 'survey'
  | 'gpr'
  | 'geotechnical'
  | 'materials'
  | 'pile'
  | 'account'
  | 'closed';

export interface StageUpdate {
  id: string;
  timestamp: string;
  text: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  percentage: number;
}

export interface DepartmentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
  docType?: string; // 'Report' | 'Drawing' | 'Receipt' | 'Data Sheet' | 'Other'
}

export interface DepartmentStageState {
  confirmed: boolean;
  confirmedAt: string | null;
  progressPercentage: number;
  timelineNotes: string;
  updates: StageUpdate[];
  attachments?: DepartmentAttachment[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNo: string;
}

export interface FieldTestItem {
  id: string;
  testName: string;
  targetCount: number;
  progressPercentage: number;
  deptId?: DepartmentId;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  entryData?: string; // Manual data entries or test measurements
  remarks?: string; // Remarks or results summary
}

export interface Project {
  id: string;
  proposalNo: string;
  projectNo: string;
  projectName: string;
  clientName: string;
  location: string;
  createdDate: string;
  mobilizationStartDate?: string;
  mobilizationEndDate?: string;
  fieldworkDurationDays?: number;
  reportDueDaysAfterFieldwork?: number;
  fieldworkCompletedDate?: string;
  reportDueDate?: string;
  currentStage: DepartmentId;
  totalCost: number;
  isInvoiceIssued: boolean;
  invoiceDate: string | null;
  payments: PaymentRecord[];
  
  // Operations section custom fieldwork & tests list
  fieldworkType?: string;
  fieldTests?: FieldTestItem[];
  
  // New requirements from Departmental Flow Split & Config
  assignedDepartments: DepartmentId[]; // e.g. ['survey', 'gpr']
  isSplitWork: boolean; // True if assigned to multiple departments
  projectValueInput: number; // Set by Secretariat
  paymentStagesConfig: Array<{
    id: string;
    stageName: string;
    percentage: number;
    amount: number;
    status: 'pending' | 'received';
  }>;
  departmentSpecializations: Record<string, Record<string, string>>; // Specialization details mapped by department id
  departmentReceipts: Record<string, { received: boolean; receivedAt: string | null }>; // Department specific receipt confirmation
  activityLogs: Array<{
    id: string;
    timestamp: string;
    deptId: DepartmentId;
    text: string;
    category: string; // 'receipt' | 'progress' | 'log' | 'billing' | 'system'
  }>;

  // Tracks state for each department
  departmentStates: Record<Exclude<DepartmentId, 'closed'>, DepartmentStageState>;
  stageHistory: Array<{
    stage: DepartmentId;
    enteredAt: string;
    exitedAt: string | null;
  }>;
}

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  icon: string; // FontAwesome icon class
  color: string; // Theme styling color
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

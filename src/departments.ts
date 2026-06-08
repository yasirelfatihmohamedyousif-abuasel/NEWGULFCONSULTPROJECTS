/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DepartmentId, DepartmentInfo, Project, DepartmentStageState } from './types';

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'secretarial',
    name: 'Secretarial',
    icon: 'fa-solid fa-file-signature',
    color: 'blue',
    bgClass: 'bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    description: 'Project archiving, proposal evaluation & unique project registration.'
  },
  {
    id: 'operation',
    name: 'Operation',
    icon: 'fa-solid fa-clipboard-list',
    color: 'slate',
    bgClass: 'bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-50',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    description: 'Project overall planning, resource allocation & coordination.'
  },
  {
    id: 'survey',
    name: 'Survey',
    icon: 'fa-solid fa-map-location-dot',
    color: 'teal',
    bgClass: 'bg-teal-50/50 text-teal-700 border-teal-200 hover:bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-300',
    description: 'Topographic surveying, boundary mapping & control point setup.'
  },
  {
    id: 'gpr',
    name: 'GPR Department',
    icon: 'fa-solid fa-satellite-dish',
    color: 'emerald',
    bgClass: 'bg-emerald-50/50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    description: 'Ground Penetrating Radar sounding & utility detection.'
  },
  {
    id: 'geotechnical',
    name: 'Geotechnical',
    icon: 'fa-solid fa-mountain',
    color: 'amber',
    bgClass: 'bg-amber-50/50 text-amber-700 border-amber-200 hover:bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    description: 'Subsurface soil exploration, rock coring & borehole logging.'
  },
  {
    id: 'materials',
    name: 'Materials Lab',
    icon: 'fa-solid fa-flask',
    color: 'purple',
    bgClass: 'bg-purple-50/50 text-purple-700 border-purple-200 hover:bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300',
    description: 'Laboratory compressive tests, soil classification & analysis.'
  },
  {
    id: 'pile',
    name: 'Pile Foundation',
    icon: 'fa-solid fa-helmet-safety',
    color: 'orange',
    bgClass: 'bg-orange-50/50 text-orange-700 border-orange-200 hover:bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    description: 'Pile construction control, concrete pouring & pile integrity testing.'
  },
  {
    id: 'account',
    name: 'Account & Billing',
    icon: 'fa-solid fa-file-invoice-dollar',
    color: 'red',
    bgClass: 'bg-red-50/50 text-red-700 border-red-200 hover:bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
    description: 'Billing, partial/full payment tracking, invoicing & project closure.'
  }
];

export const DEPARTMENT_SEQUENCE: DepartmentId[] = [
  'secretarial',
  'operation',
  'survey',
  'gpr',
  'geotechnical',
  'materials',
  'pile',
  'account'
];

export function getNextDepartment(current: DepartmentId): DepartmentId | null {
  const index = DEPARTMENT_SEQUENCE.indexOf(current);
  if (index === -1) return null;
  if (index === DEPARTMENT_SEQUENCE.length - 1) return 'closed';
  return DEPARTMENT_SEQUENCE[index + 1];
}

export function createEmptyDepartmentState(): Record<Exclude<DepartmentId, 'closed'>, DepartmentStageState> {
  const map: Partial<Record<Exclude<DepartmentId, 'closed'>, DepartmentStageState>> = {};
  
  DEPARTMENT_SEQUENCE.forEach((deptId) => {
    map[deptId] = {
      confirmed: false,
      confirmedAt: null,
      progressPercentage: 0,
      timelineNotes: '',
      updates: []
    };
  });
  
  return map as Record<Exclude<DepartmentId, 'closed'>, DepartmentStageState>;
}

export function generateProjectId(): string {
  return 'proj_' + Math.random().toString(36).substr(2, 9);
}

// Generates a nice professional sequence number of the form GT-2026-X
export function generateProjectNo(index: number): string {
  const year = new Date().getFullYear();
  const serial = String(index).padStart(3, '0');
  return `GT-${year}-${serial}`;
}

export const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-1',
    proposalNo: 'PROP-26-402',
    projectNo: 'GT-2026-001',
    projectName: 'Skyline Residential Tower Foundation Survey',
    clientName: 'Al-Bayan Development Ltd',
    location: 'Marina Heights Block A, Sector 4',
    createdDate: '2026-06-01',
    mobilizationStartDate: '2026-06-01',
    mobilizationEndDate: '2026-07-01',
    currentStage: 'survey',
    totalCost: 28500,
    isInvoiceIssued: false,
    invoiceDate: null,
    payments: [],
    assignedDepartments: ['operation', 'survey'],
    isSplitWork: false,
    projectValueInput: 28500,
    paymentStagesConfig: [
      { id: 's1', stageName: 'Upon Mobilization', percentage: 30, amount: 8550, status: 'pending' },
      { id: 's2', stageName: 'Partial Completion', percentage: 40, amount: 11400, status: 'pending' },
      { id: 's3', stageName: 'Project Handover', percentage: 30, amount: 8550, status: 'pending' }
    ],
    departmentSpecializations: {
      operation: { 'Planning Type': 'Urgent Field Logistics', 'Safety Officer Assigned': 'Eng. Omar Radwan' },
      survey: { 'Method': 'RTK Differential GPS', 'Accuracy Requirement': '±15mm', 'Bench Marks Needed': '3' }
    },
    departmentReceipts: {
      operation: { received: true, receivedAt: '2026-06-02T09:30:00Z' },
      survey: { received: true, receivedAt: '2026-06-03T11:20:00Z' }
    },
    activityLogs: [
      { id: 'act-1', timestamp: '2026-06-01T08:00:00Z', deptId: 'secretarial', text: 'Project GT-2026-001 initiated and setup completed by Secretariat.', category: 'system' },
      { id: 'act-2', timestamp: '2026-06-02T09:30:00Z', deptId: 'operation', text: 'Receipt acknowledged by Operations. Specialization metrics mapped.', category: 'receipt' },
      { id: 'act-3', timestamp: '2026-06-03T11:20:00Z', deptId: 'survey', text: 'Receipt acknowledged by Survey.', category: 'receipt' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: {
        confirmed: true,
        confirmedAt: '2026-06-01T08:00:00Z',
        progressPercentage: 100,
        timelineNotes: 'Project registered successfully under number GT-2026-001.',
        updates: [
          {
            id: 'u-1',
            timestamp: '2026-06-01T08:05:00Z',
            text: 'Registered proposal reference PROP-26-402 into direct workflow.',
            status: 'Completed',
            percentage: 100
          }
        ]
      },
      operation: {
        confirmed: true,
        confirmedAt: '2026-06-02T09:30:00Z',
        progressPercentage: 100,
        timelineNotes: 'Field logistics planned; Mobilization date scheduled for June 5th.',
        updates: [
          {
            id: 'u-2',
            timestamp: '2026-06-02T10:00:00Z',
            text: 'Completed logistics chart. Allocated Survey Team 2 and GPR Rig B.',
            status: 'Completed',
            percentage: 100
          }
        ]
      },
      survey: {
        confirmed: true,
        confirmedAt: '2026-06-03T11:20:00Z',
        progressPercentage: 45,
        timelineNotes: 'Topographic mapping ongoing. Control points setup successfully.',
        updates: [
          {
            id: 'u-3',
            timestamp: '2026-06-04T14:00:00Z',
            text: 'Foresight and backsight benchmarks calculated and placed.',
            status: 'In Progress',
            percentage: 45
          }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-06-01T08:00:00Z', exitedAt: '2026-06-02T09:15:00Z' },
      { stage: 'operation', enteredAt: '2026-06-02T09:15:00Z', exitedAt: '2026-06-03T11:00:00Z' },
      { stage: 'survey', enteredAt: '2026-06-03T11:00:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-2',
    proposalNo: 'PROP-26-588',
    projectNo: 'GT-2026-002',
    projectName: 'Metro Rail Subsurface Cavity Mapping',
    clientName: 'Municipal Transport Authority',
    location: 'Metro Line Extension, Zone C Subsurface',
    createdDate: '2026-06-03',
    mobilizationStartDate: '2026-06-03',
    mobilizationEndDate: '2026-07-03',
    currentStage: 'gpr',
    totalCost: 42000,
    isInvoiceIssued: true,
    invoiceDate: '2026-06-04',
    payments: [
      {
        id: 'pay-1',
        amount: 15000,
        date: '2026-06-05',
        paymentMethod: 'Bank Wire',
        referenceNo: 'TXN-902188432'
      }
    ],
    assignedDepartments: ['survey', 'gpr'],
    isSplitWork: true,
    projectValueInput: 42000,
    paymentStagesConfig: [
      { id: 's4', stageName: 'Upon Mobilization', percentage: 50, amount: 21000, status: 'pending' },
      { id: 's5', stageName: 'Project Handover', percentage: 50, amount: 21000, status: 'pending' }
    ],
    departmentSpecializations: {
      survey: { 'Sectors': 'Zone C & D Subsurface', 'Benchmark': 'MTA-GPS-09' },
      gpr: { 'Antenna Frequency': '400 MHz High Res', 'Grid Step': '0.5 meters density' }
    },
    departmentReceipts: {
      survey: { received: true, receivedAt: '2026-06-04T08:30:00Z' },
      gpr: { received: true, receivedAt: '2026-06-05T09:00:00Z' }
    },
    activityLogs: [
      { id: 'act-4', timestamp: '2026-06-03T10:00:00Z', deptId: 'secretarial', text: 'Project registered with Split Work between SURVEY & GPR.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: {
        confirmed: true,
        confirmedAt: '2026-06-03T10:00:00Z',
        progressPercentage: 100,
        timelineNotes: 'Urgent municipal project setup complete.',
        updates: []
      },
      operation: {
        confirmed: true,
        confirmedAt: '2026-06-03T14:00:00Z',
        progressPercentage: 100,
        timelineNotes: 'Express bypass authorization signed.',
        updates: []
      },
      survey: {
        confirmed: true,
        confirmedAt: '2026-06-04T08:30:00Z',
        progressPercentage: 100,
        timelineNotes: 'Boundary constraints identified and exported into GIS vectors.',
        updates: []
      },
      gpr: {
        confirmed: true,
        confirmedAt: '2026-06-05T09:00:00Z',
        progressPercentage: 15,
        timelineNotes: 'GPR soundings using 400 MHz antenna begun near Sector 3.',
        updates: [
          {
            id: 'u-4',
            timestamp: '2026-06-06T11:00:00Z',
            text: 'First GPR grid scan lines gathered; raw radargrams sent for baseline filtering.',
            status: 'In Progress',
            percentage: 15
          }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-06-03T10:00:00Z', exitedAt: '2026-06-03T13:45:00Z' },
      { stage: 'operation', enteredAt: '2026-06-03T13:45:00Z', exitedAt: '2026-06-04T08:00:00Z' },
      { stage: 'survey', enteredAt: '2026-06-04T08:00:05Z', exitedAt: '2026-06-05T08:45:00Z' },
      { stage: 'gpr', enteredAt: '2026-06-05T08:45:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-3',
    proposalNo: 'PROP-26-118',
    projectNo: 'GT-2026-003',
    projectName: 'Coastal Highway Soil Liquefaction Assessment',
    clientName: 'Department of Roads & Bridges',
    location: 'Coastal Highway Section Km 12 to 18',
    createdDate: '2026-05-15',
    mobilizationStartDate: '2026-05-15',
    mobilizationEndDate: '2026-06-14',
    currentStage: 'account',
    totalCost: 55000,
    isInvoiceIssued: true,
    invoiceDate: '2026-05-20',
    payments: [
      {
        id: 'pay-2',
        amount: 55000,
        date: '2026-06-04',
        paymentMethod: 'Corporate Check',
        referenceNo: 'CHK-002194'
      }
    ],
    assignedDepartments: ['geotechnical', 'materials'],
    isSplitWork: true,
    projectValueInput: 55000,
    paymentStagesConfig: [
      { id: 's6', stageName: 'Upon Mobilization', percentage: 20, amount: 11000, status: 'received' },
      { id: 's7', stageName: 'Partial Completion', percentage: 40, amount: 22000, status: 'received' },
      { id: 's8', stageName: 'Project Handover', percentage: 40, amount: 22000, status: 'received' }
    ],
    departmentSpecializations: {
      geotechnical: { 'Borehole Drilling Type': 'Wash Boring', 'Target Boreholes': '12 boreholes' },
      materials: { 'Lab Tests Required': 'Atterberg Limits, Soil Compaction & Sieve Analysis' }
    },
    departmentReceipts: {
      geotechnical: { received: true, receivedAt: '2026-05-23T09:00:00Z' },
      materials: { received: true, receivedAt: '2026-05-28T09:00:00Z' }
    },
    activityLogs: [
      { id: 'act-5', timestamp: '2026-05-15T09:00:00Z', deptId: 'secretarial', text: 'Project registered with value $55,000.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: { confirmed: true, confirmedAt: '2025-05-15T09:00:00Z', progressPercentage: 100, timelineNotes: 'Archived and numbered.', updates: [] },
      operation: { confirmed: true, confirmedAt: '2026-05-16T09:00:00Z', progressPercentage: 100, timelineNotes: 'Schedules established.', updates: [] },
      survey: { confirmed: true, confirmedAt: '2026-05-18T09:00:00Z', progressPercentage: 100, timelineNotes: 'Grid mapping generated.', updates: [] },
      gpr: { confirmed: true, confirmedAt: '2026-05-20T09:00:00Z', progressPercentage: 100, timelineNotes: 'Underground voids located.', updates: [] },
      geotechnical: { confirmed: true, confirmedAt: '2026-05-23T09:00:00Z', progressPercentage: 100, timelineNotes: 'Standard Penetration Testing (SPT) samples extracted.', updates: [] },
      materials: { confirmed: true, confirmedAt: '2026-05-28T09:00:00Z', progressPercentage: 100, timelineNotes: 'Triaxial and water retention tests compiled.', updates: [] },
      pile: { confirmed: true, confirmedAt: '2026-06-02T09:00:00Z', progressPercentage: 100, timelineNotes: 'Load calculations approved.', updates: [] },
      account: {
        confirmed: true,
        confirmedAt: '2026-06-04T10:00:00Z',
        progressPercentage: 100,
        timelineNotes: 'Awaiting final payment closure review.',
        updates: [
          {
            id: 'u-5',
            timestamp: '2026-06-04T10:30:00Z',
            text: 'Full amount of $55,000 received. Ready for formal audit and closure.',
            status: 'Completed',
            percentage: 100
          }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-05-15T09:00:00Z', exitedAt: '2026-05-16T08:50:00Z' },
      { stage: 'operation', enteredAt: '2026-05-16T08:50:00Z', exitedAt: '2026-05-18T08:40:00Z' },
      { stage: 'survey', enteredAt: '2026-05-18T08:40:00Z', exitedAt: '2026-05-20T08:30:00Z' },
      { stage: 'gpr', enteredAt: '2026-05-20T08:30:00Z', exitedAt: '2026-05-23T08:20:00Z' },
      { stage: 'geotechnical', enteredAt: '2026-05-23T08:20:00Z', exitedAt: '2026-05-28T08:10:00Z' },
      { stage: 'materials', enteredAt: '2026-05-28T08:10:00Z', exitedAt: '2026-06-02T08:00:00Z' },
      { stage: 'pile', enteredAt: '2026-06-02T08:00:00Z', exitedAt: '2026-06-04T10:00:00Z' },
      { stage: 'account', enteredAt: '2026-06-04T10:00:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-4',
    proposalNo: 'PROP-26-105',
    projectNo: 'GT-2026-004',
    projectName: 'Emaar Boulevard Soil Investigation & Boring',
    clientName: 'Emaar Properties PJSC',
    location: 'Sector 5, Boulevard Marina South',
    createdDate: '2026-06-08',
    mobilizationStartDate: '2026-06-08',
    mobilizationEndDate: '2026-07-08',
    currentStage: 'secretarial',
    totalCost: 19500,
    isInvoiceIssued: false,
    invoiceDate: null,
    payments: [],
    assignedDepartments: ['operation', 'survey', 'geotechnical'],
    isSplitWork: false,
    projectValueInput: 19500,
    paymentStagesConfig: [
      { id: 's9', stageName: 'Upon Mobilization', percentage: 40, amount: 7800, status: 'pending' },
      { id: 's10', stageName: 'Project Handover', percentage: 60, amount: 11700, status: 'pending' }
    ],
    departmentSpecializations: {},
    departmentReceipts: {},
    activityLogs: [
      { id: 'act-6', timestamp: '2026-06-08T09:00:00Z', deptId: 'secretarial', text: 'Project submitted for technical verification & assignment.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 10,
        timelineNotes: 'Under technical compliance audit.',
        updates: []
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-06-08T09:00:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-5',
    proposalNo: 'PROP-26-890',
    projectNo: 'GT-2026-005',
    projectName: 'Airport Runway Subgrade Compaction Evaluation',
    clientName: 'National Aviation Authority',
    location: 'Runway 3L Extension, Cargo Terminal',
    createdDate: '2026-06-05',
    mobilizationStartDate: '2026-06-05',
    mobilizationEndDate: '2026-07-05',
    currentStage: 'operation',
    totalCost: 34000,
    isInvoiceIssued: false,
    invoiceDate: null,
    payments: [],
    assignedDepartments: ['operation', 'survey', 'materials'],
    isSplitWork: false,
    projectValueInput: 34000,
    paymentStagesConfig: [
      { id: 's11', stageName: 'Upon Mobilization', percentage: 50, amount: 17000, status: 'pending' },
      { id: 's12', stageName: 'Final Delivery', percentage: 50, amount: 17000, status: 'pending' }
    ],
    departmentSpecializations: {
      operation: { 'Planning Type': 'Aviation Logistics Protocol', 'Safety Officer Assigned': 'Eng. Khalil Salim' }
    },
    departmentReceipts: {},
    activityLogs: [
      { id: 'act-7', timestamp: '2026-06-05T08:00:00Z', deptId: 'secretarial', text: 'Registered and assigned to Operations.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: { confirmed: true, confirmedAt: '2026-06-05T08:00:00Z', progressPercentage: 100, timelineNotes: 'Approved & assigned.', updates: [] },
      operation: {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 5,
        timelineNotes: 'Awaiting resource planning confirmation.',
        updates: []
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-06-05T08:00:00Z', exitedAt: '2026-06-05T09:30:00Z' },
      { stage: 'operation', enteredAt: '2026-06-05T09:30:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-6',
    proposalNo: 'PROP-26-340',
    projectNo: 'GT-2026-006',
    projectName: 'Downtown Commercial Mall Deep Boring & SPT',
    clientName: 'United Retail Properties',
    location: 'Crossroads Blvd, Central business district',
    createdDate: '2026-05-28',
    mobilizationStartDate: '2026-05-28',
    mobilizationEndDate: '2026-06-27',
    currentStage: 'geotechnical',
    totalCost: 48000,
    isInvoiceIssued: true,
    invoiceDate: '2026-05-30',
    payments: [
      { id: 'pay-3', amount: 20000, date: '2026-06-01', paymentMethod: 'Bank Wire', referenceNo: 'TXN-7740212' }
    ],
    assignedDepartments: ['operation', 'survey', 'geotechnical'],
    isSplitWork: false,
    projectValueInput: 48000,
    paymentStagesConfig: [
      { id: 's13', stageName: 'Mobilization', percentage: 30, amount: 14400, status: 'received' },
      { id: 's14', stageName: 'Deep SPT Completion', percentage: 40, amount: 19200, status: 'pending' },
      { id: 's15', stageName: 'Handover', percentage: 30, amount: 14400, status: 'pending' }
    ],
    departmentSpecializations: {
      geotechnical: { 'Borehole Drilling Type': 'Cable Tool percussion', 'Target Boreholes': '8 deep shafts' }
    },
    departmentReceipts: {
      geotechnical: { received: true, receivedAt: '2026-06-02T10:00:00Z' }
    },
    activityLogs: [
      { id: 'act-8', timestamp: '2026-05-28T09:00:00Z', deptId: 'secretarial', text: 'Project registered successfully.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: { confirmed: true, confirmedAt: '2026-05-28T09:00:00Z', progressPercentage: 100, timelineNotes: 'Approved.', updates: [] },
      operation: { confirmed: true, confirmedAt: '2026-05-29T09:00:00Z', progressPercentage: 100, timelineNotes: 'Rig B allocated.', updates: [] },
      survey: { confirmed: true, confirmedAt: '2026-06-01T09:00:00Z', progressPercentage: 100, timelineNotes: 'Control lines laid out.', updates: [] },
      geotechnical: {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 35,
        timelineNotes: 'Completed borehole 1 and 2 to 30m depth. High water table identified.',
        updates: [
          { id: 'u-gt-1', timestamp: '2026-06-04T11:00:00Z', text: 'Extracted soil samples from Sand layers.', status: 'In Progress', percentage: 35 }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-05-28T09:00:00Z', exitedAt: '2026-05-28T14:50:00Z' },
      { stage: 'operation', enteredAt: '2026-05-28T14:50:00Z', exitedAt: '2026-06-01T08:40:00Z' },
      { stage: 'survey', enteredAt: '2026-06-01T08:40:00Z', exitedAt: '2026-06-02T09:50:00Z' },
      { stage: 'geotechnical', enteredAt: '2026-06-02T09:50:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-7',
    proposalNo: 'PROP-26-224',
    projectNo: 'GT-2026-007',
    projectName: 'Wastewater Treatment Plant Core Strength Testing',
    clientName: 'Sancon Systems & Infrastructure',
    location: 'Industrial District Segment 3B',
    createdDate: '2026-05-24',
    mobilizationStartDate: '2026-05-24',
    mobilizationEndDate: '2026-06-23',
    currentStage: 'materials',
    totalCost: 15200,
    isInvoiceIssued: false,
    invoiceDate: null,
    payments: [],
    assignedDepartments: ['operation', 'survey', 'materials'],
    isSplitWork: false,
    projectValueInput: 15200,
    paymentStagesConfig: [
      { id: 's16', stageName: 'Upon Mobilization', percentage: 30, amount: 4560, status: 'pending' },
      { id: 's17', stageName: 'Reports Delivery', percentage: 70, amount: 10640, status: 'pending' }
    ],
    departmentSpecializations: {
      materials: { 'Lab Tests Required': 'Core Compressive Resistance & Shear Stress analysis' }
    },
    departmentReceipts: {
      materials: { received: true, receivedAt: '2026-05-29T08:00:00Z' }
    },
    activityLogs: [
      { id: 'act-9', timestamp: '2026-05-24T08:00:00Z', deptId: 'secretarial', text: 'Setup core test logging project.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: { confirmed: true, confirmedAt: '2026-05-24T08:00:00Z', progressPercentage: 100, timelineNotes: 'Setup complete.', updates: [] },
      operation: { confirmed: true, confirmedAt: '2026-05-25T08:00:00Z', progressPercentage: 100, timelineNotes: 'Approved.', updates: [] },
      survey: { confirmed: true, confirmedAt: '2026-05-27T08:00:00Z', progressPercentage: 100, timelineNotes: 'Coordinates targeted.', updates: [] },
      geotechnical: { confirmed: true, confirmedAt: '2026-05-29T08:00:00Z', progressPercentage: 100, timelineNotes: 'Standard coring done.', updates: [] },
      materials: {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 40,
        timelineNotes: 'Casting compression test blocks started.',
        updates: [
          { id: 'u-mat-1', timestamp: '2026-06-03T14:00:00Z', text: 'Finished 7-day curing compression testing.', status: 'In Progress', percentage: 40 }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-05-24T08:00:00Z', exitedAt: '2026-05-25T07:50:00Z' },
      { stage: 'operation', enteredAt: '2026-05-25T07:50:00Z', exitedAt: '2026-05-27T07:45:00Z' },
      { stage: 'survey', enteredAt: '2026-05-27T07:45:00Z', exitedAt: '2026-05-29T07:40:00Z' },
      { stage: 'materials', enteredAt: '2026-05-29T07:40:00Z', exitedAt: null }
    ]
  },
  {
    id: 'seed-8',
    proposalNo: 'PROP-26-712',
    projectNo: 'GT-2026-008',
    projectName: 'High-Rise Tower Foundation Pile Load Testing',
    clientName: 'Al-Majid Structures Corp',
    location: 'Business Circle Sector 12, Plot 4A',
    createdDate: '2026-05-20',
    mobilizationStartDate: '2026-05-20',
    mobilizationEndDate: '2026-06-19',
    currentStage: 'pile',
    totalCost: 75000,
    isInvoiceIssued: true,
    invoiceDate: '2026-05-21',
    payments: [
      { id: 'pay-4', amount: 37500, date: '2026-05-25', paymentMethod: 'Corporate Check', referenceNo: 'CHK-00109' }
    ],
    assignedDepartments: ['operation', 'survey', 'pile', 'account'],
    isSplitWork: false,
    projectValueInput: 75000,
    paymentStagesConfig: [
      { id: 's18', stageName: 'Mobilization', percentage: 50, amount: 37500, status: 'received' },
      { id: 's19', stageName: 'Reports & Testing Submission', percentage: 50, amount: 37500, status: 'pending' }
    ],
    departmentSpecializations: {
      pile: { 'Pile Drilling Method': 'Bored Piles 1200mm dia', 'Testing Method': 'Static Load Testing up to 1500 Tons' }
    },
    departmentReceipts: {
      pile: { received: true, receivedAt: '2026-05-28T09:00:00Z' }
    },
    activityLogs: [
      { id: 'act-10', timestamp: '2026-05-20T09:00:00Z', deptId: 'secretarial', text: 'Registered pile development tracker.', category: 'system' }
    ],
    departmentStates: {
      ...createEmptyDepartmentState(),
      secretarial: { confirmed: true, confirmedAt: '2026-05-20T09:00:00Z', progressPercentage: 100, timelineNotes: 'Approved.', updates: [] },
      operation: { confirmed: true, confirmedAt: '2026-05-22T09:00:00Z', progressPercentage: 100, timelineNotes: 'Approved.', updates: [] },
      survey: { confirmed: true, confirmedAt: '2026-05-24T09:00:00Z', progressPercentage: 100, timelineNotes: 'Layed out pile coordinates grid.', updates: [] },
      geotechnical: { confirmed: true, confirmedAt: '2026-05-26T09:00:00Z', progressPercentage: 100, timelineNotes: 'Soil stratification verified.', updates: [] },
      materials: { confirmed: true, confirmedAt: '2026-05-28T09:00:00Z', progressPercentage: 100, timelineNotes: 'High-strength concrete formula checked.', updates: [] },
      pile: {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 60,
        timelineNotes: 'Static load hydraulic jack setup completed on Pile No 14.',
        updates: [
          { id: 'u-pile-1', timestamp: '2026-06-04T15:00:00Z', text: 'Initial 250 ton load pressure steps held successfully.', status: 'In Progress', percentage: 60 }
        ]
      }
    },
    stageHistory: [
      { stage: 'secretarial', enteredAt: '2026-05-20T09:00:00Z', exitedAt: '2026-05-22T08:50:00Z' },
      { stage: 'operation', enteredAt: '2026-05-22T08:50:00Z', exitedAt: '2026-05-24T08:45:00Z' },
      { stage: 'survey', enteredAt: '2026-05-24T08:45:00Z', exitedAt: '2026-05-26T08:40:00Z' },
      { stage: 'geotechnical', enteredAt: '2026-05-26T08:40:00Z', exitedAt: '2026-05-28T08:30:00Z' },
      { stage: 'materials', enteredAt: '2026-05-28T08:30:00Z', exitedAt: '2026-05-28T09:00:00Z' },
      { stage: 'pile', enteredAt: '2026-05-28T09:00:00Z', exitedAt: null }
    ]
  }
];

export function getProjectLastUpdated(project: Project): { lastUpdated: Date; daysSinceUpdate: number; isStalled: boolean } {
  const dates: Date[] = [];

  const addDate = (str: string | null | undefined) => {
    if (!str) return;
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      dates.push(d);
    }
  };

  addDate(project.createdDate);

  project.activityLogs?.forEach(log => {
    addDate(log.timestamp);
  });

  if (project.departmentStates) {
    Object.values(project.departmentStates).forEach(state => {
      if (state) {
        addDate(state.confirmedAt);
        state.updates?.forEach(upd => {
          addDate(upd.timestamp);
        });
      }
    });
  }

  project.stageHistory?.forEach(hist => {
    addDate(hist.enteredAt);
    addDate(hist.exitedAt);
  });

  if (project.departmentReceipts) {
    Object.values(project.departmentReceipts).forEach(receipt => {
      if (receipt) {
        addDate(receipt.receivedAt);
      }
    });
  }

  project.payments?.forEach(pay => {
    addDate(pay.date);
  });

  const lastUpdated = dates.length > 0 
    ? new Date(Math.max(...dates.map(d => d.getTime()))) 
    : new Date();

  const diffMs = Date.now() - lastUpdated.getTime();
  const daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStalled = daysSinceUpdate >= 7;

  return {
    lastUpdated,
    daysSinceUpdate: Math.max(0, daysSinceUpdate),
    isStalled
  };
}


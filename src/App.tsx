/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DepartmentId, Project, PaymentRecord, DepartmentAttachment } from './types';
import { DEPARTMENTS, SEED_PROJECTS, getNextDepartment, DEPARTMENT_SEQUENCE, getProjectLastUpdated } from './departments';
import Sidebar from './components/Sidebar';
import ProjectForm from './components/ProjectForm';
import ProjectCard from './components/ProjectCard';
import AccountControls from './components/AccountControls';
import ProjectDetailsModal from './components/ProjectDetailsModal';
import ArchiveDashboard from './components/ArchiveDashboard';
import DepartmentReportModal from './components/DepartmentReportModal';
import GulfConsultLogo from './components/GulfConsultLogo';
import CalendarView from './components/CalendarView';

const STORAGE_KEY = 'get_workflow_projects_store_v1';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeDept, setActiveDept] = useState<DepartmentId | 'archive'>('secretarial');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedProject, setInspectedProject] = useState<Project | null>(null);
  const [activeReportDept, setActiveReportDept] = useState<DepartmentId | 'archive' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStalledOnly, setShowStalledOnly] = useState(false);
  const [isFinancialAuthorized, setIsFinancialAuthorized] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');


  // 1. Core State Restorability via LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProjects(JSON.parse(raw));
      } else {
        // Seeding initial corporate records
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROJECTS));
        setProjects(SEED_PROJECTS);
      }
    } catch (e) {
      console.error('Failed reading custom localstorage store:', e);
      setProjects(SEED_PROJECTS);
    }
  }, []);

  const persistState = (latestProjects: Project[]) => {
    setProjects(latestProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latestProjects));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm("Are you sure you want to reset the database and restore default example projects? This will replace your custom projects with standard geotechnical demo records.")) {
      persistState(SEED_PROJECTS);
      setActiveDept('secretarial');
      setSearchQuery('');
      setShowStalledOnly(false);
    }
  };

  // 2. Compute dynamic counters for active projects in each department
  const projectCounts = useMemo(() => {
    const counts: Record<DepartmentId, number> = {
      secretarial: 0,
      operation: 0,
      survey: 0,
      gpr: 0,
      geotechnical: 0,
      materials: 0,
      pile: 0,
      account: 0,
      closed: 0
    };
    
    projects.forEach(p => {
      // Secretarial (Secretariat sees and tracks all active, non-closed projects they assigned)
      if (p.currentStage !== 'closed') {
        counts.secretarial++;
      }
      
      // Account (Account sees all active, non-closed projects immediately)
      if (p.currentStage !== 'closed') {
        counts.account++;
      } else {
        counts.closed++;
      }

      // Operational Departments
      const eligibleDepts: DepartmentId[] = ['operation', 'survey', 'gpr', 'geotechnical', 'materials', 'pile'];
      eligibleDepts.forEach(deptId => {
        const assigned = p.assignedDepartments || [];
        if (p.currentStage !== 'closed') {
          if (assigned.length > 0) {
            if (assigned.includes(deptId)) {
              counts[deptId]++;
            }
          } else {
            if (p.currentStage === deptId) {
              counts[deptId]++;
            }
          }
        }
      });
    });
    
    return counts;
  }, [projects]);

  // 3. Project Creation
  const handleAddProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    persistState(updated);
  };

  // 4. Confirm Stage Receipt
  const handleConfirmReceipt = (projectId: string, stage: DepartmentId) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      
      const newStates = { ...p.departmentStates };
      const currentVal = newStates[stage as Exclude<DepartmentId, 'closed'>];
      
      if (currentVal) {
        newStates[stage as Exclude<DepartmentId, 'closed'>] = {
          ...currentVal,
          confirmed: true,
          confirmedAt: new Date().toISOString()
        };
      }

      // Initialize/Update the department receipts dictionary status
      const receipts = { ...(p.departmentReceipts || {}) };
      receipts[stage] = { received: true, receivedAt: new Date().toISOString() };

      const deptName = DEPARTMENTS.find(d => d.id === stage)?.name || stage;
      const receiptMsg = `${deptName} Department officially confirmed receipt of the files and registered details. Ready for execution.`;

      // Centralized activity logs stream sync
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: stage,
          text: receiptMsg,
          category: 'receipt'
        },
        ...(p.activityLogs || [])
      ];

      // Add timeline update log for department state
      const logId = 'log_' + Math.random().toString(36).substr(2, 9);
      if (currentVal) {
        newStates[stage as Exclude<DepartmentId, 'closed'>] = {
          ...newStates[stage as Exclude<DepartmentId, 'closed'>]!,
          updates: [
            {
              id: logId,
              timestamp: new Date().toISOString(),
              text: `Receipt confirmed. Work package initialised.`,
              status: 'In Progress',
              percentage: currentVal.progressPercentage || 0
            },
            ...currentVal.updates
          ]
        };
      }

      return {
        ...p,
        departmentReceipts: receipts,
        departmentStates: newStates,
        activityLogs: newLogs
      };
    });

    persistState(updated);
  };

  // 5. Update slider progress & notes
  const handleUpdateProgress = (projectId: string, stage: DepartmentId, percentage: number, notes: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const newStates = { ...p.departmentStates };
      const currentVal = newStates[stage as Exclude<DepartmentId, 'closed'>];
      if (currentVal) {
        newStates[stage as Exclude<DepartmentId, 'closed'>] = {
          ...currentVal,
          progressPercentage: percentage,
          timelineNotes: notes
        };
      }

      const deptName = DEPARTMENTS.find(d => d.id === stage)?.name || stage;
      const progressMsg = `${deptName} progressive threshold adjusted to ${percentage}%. Note: "${notes || 'No description provided.'}"`;

      // Broadcast update log
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: stage,
          text: progressMsg,
          category: 'progress'
        },
        ...(p.activityLogs || [])
      ];

      let fieldworkCompletedDate = p.fieldworkCompletedDate;
      let reportDueDate = p.reportDueDate;
      if (percentage === 100) {
        if (!fieldworkCompletedDate) {
          fieldworkCompletedDate = new Date().toISOString().split('T')[0];
        }
        const comp = new Date(fieldworkCompletedDate);
        if (!isNaN(comp.getTime())) {
          const limit = p.reportDueDaysAfterFieldwork ?? 7;
          comp.setDate(comp.getDate() + limit);
          reportDueDate = comp.toISOString().split('T')[0];
        }
      } else if (p.currentStage === stage) {
        fieldworkCompletedDate = undefined;
        reportDueDate = undefined;
      }

      return {
        ...p,
        departmentStates: newStates,
        activityLogs: newLogs,
        fieldworkCompletedDate,
        reportDueDate
      };
    });

    persistState(updated);
  };

  // 6. Record sub-logs
  const handleAddProgressLog = (
    projectId: string,
    stage: DepartmentId,
    text: string,
    status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed'
  ) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const newStates = { ...p.departmentStates };
      const currentVal = newStates[stage as Exclude<DepartmentId, 'closed'>];
      const logId = 'log_' + Math.random().toString(36).substr(2, 9);
      if (currentVal) {
        const newLogVal = {
          id: logId,
          timestamp: new Date().toISOString(),
          text,
          status,
          percentage: currentVal.progressPercentage
        };
        newStates[stage as Exclude<DepartmentId, 'closed'>] = {
          ...currentVal,
          updates: [newLogVal, ...currentVal.updates]
        };
      }

      const deptName = DEPARTMENTS.find(d => d.id === stage)?.name || stage;
      const bulletinMsg = `[Status: ${status}] Posted progress report: "${text}"`;

      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: stage,
          text: `${deptName}: ${bulletinMsg}`,
          category: 'log'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        departmentStates: newStates,
        activityLogs: newLogs
      };
    });

    persistState(updated);
  };

  // 7. Workflow Movement (Pass deliverables / advanced stage)
  const handleMoveToNext = (projectId: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const currentStage = p.currentStage;
      let nextStage: DepartmentId = 'account';

      if (p.isSplitWork) {
        // In split work, we check if all assigned departments has progress = 100%
        const assigned = p.assignedDepartments || [];
        const allCompleted = assigned.every(d => (p.departmentStates[d]?.progressPercentage ?? 0) === 100);
        
        if (allCompleted) {
          nextStage = 'account';
        } else {
          // If not all departments are at 100% yet, log progress, but don't move overall stage to 'account' still.
          const newLogs = [
            {
              id: 'log_' + Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toISOString(),
              deptId: currentStage,
              text: `${DEPARTMENTS.find(d => d.id === currentStage)?.name || currentStage} division filed completion deliverables. Pipeline awaiting other concurrent split segments.`,
              category: 'system'
            },
            ...(p.activityLogs || [])
          ];
          return {
            ...p,
            activityLogs: newLogs
          };
        }
      } else {
        nextStage = getNextDepartment(currentStage) || 'account';
      }

      // Perform state transition
      const now = new Date().toISOString();
      const updatedHistory = p.stageHistory.map(h => {
        if (h.stage === currentStage && h.exitedAt === null) {
          return { ...h, exitedAt: now };
         }
        return h;
      });

      updatedHistory.push({
        stage: nextStage,
        enteredAt: now,
        exitedAt: null
      });

      const nextStageName = DEPARTMENTS.find(d => d.id === nextStage)?.name || nextStage;
      const transitionMsg = `Phase transition completed. Work package routed from ${currentStage.toUpperCase()} to ${nextStageName.toUpperCase()} list.`;

      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: now,
          deptId: currentStage,
          text: transitionMsg,
          category: 'system'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        currentStage: nextStage,
        stageHistory: updatedHistory,
        activityLogs: newLogs
      };
    });

    persistState(updated);
  };

  // 8. Account department controls
  const handleSetCost = (projectId: string, cost: number) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, totalCost: cost };
    });
    persistState(updated);
  };

  const handleToggleInvoice = (projectId: string, isIssued: boolean, invoiceDate: string | null) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, isInvoiceIssued: isIssued, invoiceDate };
    });
    persistState(updated);
  };

  const handleRecordPayment = (projectId: string, payment: PaymentRecord) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: 'account' as DepartmentId,
          text: `Ledger reference transaction recorded. Added $${payment.amount.toLocaleString()} via ${payment.paymentMethod} (Ref: ${payment.referenceNo}).`,
          category: 'billing'
        },
        ...(p.activityLogs || [])
      ];
      return { 
        ...p, 
        payments: [payment, ...p.payments],
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  const handleDeletePayment = (projectId: string, paymentId: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const itemToDrop = p.payments.find(pay => pay.id === paymentId);
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: 'account' as DepartmentId,
          text: `Ledger transaction worth $${itemToDrop?.amount.toLocaleString() || 'unknown'} (Ref: ${itemToDrop?.referenceNo || paymentId}) was deleted/revoked.`,
          category: 'billing'
        },
        ...(p.activityLogs || [])
      ];
      return { 
        ...p, 
        payments: p.payments.filter(pay => pay.id !== paymentId),
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  const handleCloseProject = (projectId: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const now = new Date().toISOString();
      const updatedHistory = p.stageHistory.map(h => {
        if (h.stage === 'account' && h.exitedAt === null) {
          return { ...h, exitedAt: now };
        }
        return h;
      });

      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: now,
          deptId: 'account' as DepartmentId,
          text: `Full budget cleared and contract closed out formally. Project records archived.`,
          category: 'system'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        currentStage: 'closed' as DepartmentId,
        stageHistory: updatedHistory,
        activityLogs: newLogs
      };
    });

    persistState(updated);
  };

  // Additional customized callbacks
  const handleUpdateSpecialization = (projectId: string, deptId: string, key: string, val: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const specs = { ...(p.departmentSpecializations || {}) };
      const currentDeptSpecs = { ...(specs[deptId] || {}) };
      currentDeptSpecs[key] = val;
      specs[deptId] = currentDeptSpecs;
      
      return {
        ...p,
        departmentSpecializations: specs
      };
    });
    persistState(updated);
  };

  const handleApplyPreset = (projectId: string, deptId: string, specs: Record<string, string>, workflowSteps: string[]) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      
      const allSpecs = { ...(p.departmentSpecializations || {}) };
      const newSpecs: Record<string, string> = {};
      
      // Copy over specifications
      Object.entries(specs).forEach(([k, v]) => {
        newSpecs[k] = v;
      });
      
      // Load workflow steps as initialized pending checklists
      workflowSteps.forEach(step => {
        newSpecs[`_wf_step:${step}`] = 'pending';
      });
      
      allSpecs[deptId] = newSpecs;
      
      const deptName = DEPARTMENTS.find(d => d.id === deptId)?.name || deptId;
      const logText = `Acknowledge loading and mapping "${deptName}" preset template instructions and workflow checklist task milestones.`;
      
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          deptId: deptId as DepartmentId,
          text: logText,
          category: 'system'
        },
        ...(p.activityLogs || [])
      ];
      
      return {
        ...p,
        departmentSpecializations: allSpecs,
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  const handleUpdateProjectFields = (projectId: string, fields: Partial<Project>) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const merged = { ...p, ...fields };
      
      // Calculate Mobilization End Date if Start Date was updated
      if (fields.mobilizationStartDate && fields.mobilizationStartDate !== p.mobilizationStartDate) {
        const start = new Date(fields.mobilizationStartDate);
        if (!isNaN(start.getTime())) {
          const duration = p.fieldworkDurationDays ?? 30;
          start.setDate(start.getDate() + duration);
          merged.mobilizationEndDate = start.toISOString().split('T')[0];
        }
      }
      
      // Calculate Report Due Date if Fieldwork Completed Date was updated
      if (fields.fieldworkCompletedDate !== undefined && fields.fieldworkCompletedDate !== p.fieldworkCompletedDate) {
        if (fields.fieldworkCompletedDate) {
          const comp = new Date(fields.fieldworkCompletedDate);
          if (!isNaN(comp.getTime())) {
            const limit = p.reportDueDaysAfterFieldwork ?? 7;
            comp.setDate(comp.getDate() + limit);
            merged.reportDueDate = comp.toISOString().split('T')[0];
          }
        } else {
          merged.reportDueDate = undefined;
        }
      }
      
      return merged;
    });
    persistState(updated);
  };

  const handleAddAttachment = (
    projectId: string,
    deptId: string,
    fileName: string,
    fileUrl: string,
    fileSize?: string,
    docType?: string,
    uploadedBy?: string
  ) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const dKey = deptId as Exclude<DepartmentId, 'closed'>;
      const deptState = p.departmentStates[dKey] || {
        confirmed: false,
        confirmedAt: null,
        progressPercentage: 0,
        timelineNotes: '',
        updates: []
      };

      const currentAttachments = deptState.attachments || [];
      const newAttachment: DepartmentAttachment = {
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        fileName,
        fileUrl,
        fileSize: fileSize || 'Unknown size',
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy || 'Staff Member',
        docType: docType || 'Other'
      };

      const updatedAttachments = [...currentAttachments, newAttachment];

      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          deptId: deptId as DepartmentId,
          text: `Linked internal document: "${fileName}" (${docType || 'Other'})`,
          category: 'log'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        departmentStates: {
          ...p.departmentStates,
          [dKey]: {
            ...deptState,
            attachments: updatedAttachments
          }
        },
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  const handleRemoveAttachment = (projectId: string, deptId: string, attachmentId: string) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;

      const dKey = deptId as Exclude<DepartmentId, 'closed'>;
      const deptState = p.departmentStates[dKey];
      if (!deptState || !deptState.attachments) return p;

      const targetFile = deptState.attachments.find(a => a.id === attachmentId);
      const updatedAttachments = deptState.attachments.filter(a => a.id !== attachmentId);

      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          deptId: deptId as DepartmentId,
          text: `Removed attached reference doc: "${targetFile?.fileName || 'Attachment'}"`,
          category: 'log'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        departmentStates: {
          ...p.departmentStates,
          [dKey]: {
            ...deptState,
            attachments: updatedAttachments
          }
        },
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  const handleToggleStagePayStatus = (projectId: string, stageId: string, isPaid: boolean) => {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const configs = (p.paymentStagesConfig || []).map(s => {
        if (s.id !== stageId) return s;
        return { ...s, status: (isPaid ? 'received' : 'pending') as 'received' | 'pending' };
      });
      
      const matchedStage = configs.find(s => s.id === stageId);
      const newLogs = [
        {
          id: 'log_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          deptId: 'account' as DepartmentId,
          text: `Payment milestone "${matchedStage?.stageName || stageId}" flagged as ${isPaid ? 'RECEIVED / CLEARED' : 'PENDING'}.`,
          category: 'billing'
        },
        ...(p.activityLogs || [])
      ];

      return {
        ...p,
        paymentStagesConfig: configs,
        activityLogs: newLogs
      };
    });
    persistState(updated);
  };

  // 9. Filtering logic by search criteria
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      let matchesStage = false;
      if (activeDept === 'archive') {
        matchesStage = true;
      } else if (activeDept === 'secretarial') {
        matchesStage = p.currentStage !== 'closed';
      } else if (activeDept === 'account') {
        matchesStage = p.currentStage !== 'closed';
      } else {
        const assigned = p.assignedDepartments || [];
        if (p.currentStage !== 'closed') {
          if (assigned.length > 0) {
            matchesStage = assigned.includes(activeDept);
          } else {
            matchesStage = p.currentStage === activeDept;
          }
        }
      }
      
      if (showStalledOnly) {
        const { isStalled } = getProjectLastUpdated(p);
        if (!isStalled) return false;
      }
      
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStage;
      
      const matchesText = 
         p.projectNo.toLowerCase().includes(query) ||
         p.proposalNo.toLowerCase().includes(query) ||
         p.projectName.toLowerCase().includes(query) ||
         p.clientName.toLowerCase().includes(query) ||
         p.location.toLowerCase().includes(query);
         
      return matchesStage && matchesText;
    });
  }, [projects, activeDept, searchQuery, showStalledOnly]);

  const existingProjectNos = useMemo(() => {
    return projects.map(p => p.projectNo);
  }, [projects]);

  const currentHeaderInfo = useMemo(() => {
    if (activeDept === 'archive') {
      return {
        name: 'All Projects Index',
        description: 'Global register of active, ongoing, and archived geotechnical projects.',
        icon: 'fa-box-archive',
        color: 'slate'
      };
    }
    const dept = DEPARTMENTS.find(d => d.id === activeDept);
    return dept ? {
      name: `${dept.name} Department`,
      description: dept.description,
      icon: dept.icon.replace('fa-solid ', ''),
      color: dept.color
    } : { name: '', description: '', icon: '', color: '' };
  }, [activeDept]);

  const isFinancialVisible = activeDept === 'secretarial' || activeDept === 'account' || isFinancialAuthorized;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Header Nav bar */}
      <header className="lg:hidden bg-[#10193e] border-b border-[#1e2a5d] p-3 flex items-center justify-between z-20 animate-fade-in text-white">
        <div className="flex items-center gap-2.5">
          <GulfConsultLogo className="w-8 h-8 bg-white p-0.5 rounded-lg border border-slate-200" />
          <div>
            <span className="text-sm font-bold text-white tracking-wider uppercase font-sans">GULF CONSULT</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-teal-200 hover:text-white p-2 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <i className="fa-solid fa-xmark text-lg"></i>
          ) : (
            <i className="fa-solid fa-bars-staggered text-lg"></i>
          )}
        </button>
      </header>

      {/* Sidebar drawer wrapping overlay */}
      <div className={`fixed lg:relative inset-y-0 left-0 transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 lg:z-10 flex w-72 shrink-0 h-full`}>
        <Sidebar
          activeDept={activeDept}
          onDeptChange={(deptId) => {
            setActiveDept(deptId);
            setMobileMenuOpen(false);
          }}
          projectCounts={projectCounts}
          onResetDemoData={handleResetDemoData}
        />
        
        {/* Mobile tap outside overlay backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden -z-10 left-72 w-screen h-screen"
          ></div>
        )}
      </div>

      {/* Main viewport Container (100% space - Sidebar width) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 h-full relative overflow-hidden">
        
        {/* Dynamic header panel */}
        <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-805 border border-slate-800 flex items-center justify-center text-xs text-teal-400 font-bold">
                <i className={`fa-solid ${currentHeaderInfo.icon}`}></i>
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">{currentHeaderInfo.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-tight">{currentHeaderInfo.description}</p>
          </div>

          {/* Controls Panel wrapping search and personnel authorization */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 animate-fade-in">
            {/* Division Report Executive Generator */}
            <button
              type="button"
              onClick={() => setActiveReportDept(activeDept)}
              className="text-[11px] px-3.5 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-mono font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-teal-500/5 hover:-translate-y-0.5 active:translate-y-0"
              title={`Generate real-time executive progress report, spreadsheets, and downloadable PDFs for the ${currentHeaderInfo.name} Division.`}
            >
              <i className="fa-solid fa-file-pdf text-teal-400 animate-pulse"></i>
              <span>📊 PDF Progress Report</span>
            </button>

            {/* Personnel Authorization Shield Toggle */}
            <button
              type="button"
              onClick={() => setIsFinancialAuthorized(!isFinancialAuthorized)}
              className={`text-[11px] px-3.5 py-1.5 rounded-lg border transition-all duration-150 flex items-center justify-center gap-2 font-mono font-bold focus:outline-none cursor-pointer ${
                isFinancialAuthorized
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/5 hover:bg-amber-500/25'
                  : 'bg-slate-905 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-750'
              }`}
              title="Toggle Personnel Secure Authorization Override to view financial information across any department."
            >
              <i className={`fa-solid ${isFinancialAuthorized ? 'fa-shield-halved text-amber-400 animate-pulse' : 'fa-shield text-slate-500'}`}></i>
              <span>{isFinancialAuthorized ? '🔓 Authorized View Active' : '🔒 Personnel Authorization'}</span>
            </button>

            {/* Persistent global search input */}
            <div className="relative w-full md:w-64">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                type="text"
                placeholder="Search projects, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 font-mono transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <i className="fa-solid fa-circle-xmark text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Create project form (Only Secretarial view - feature 1) */}
          {activeDept === 'secretarial' && !searchQuery && (
            <ProjectForm
              onAddProject={handleAddProject}
              existingProjectNos={existingProjectNos}
            />
          )}

          {/* New Analytics Bottleneck Dashboard (Only Archive view) */}
          {activeDept === 'archive' && !searchQuery && (
            <ArchiveDashboard
              projects={projects}
              onProjectClick={(p) => setInspectedProject(p)}
              isFinancialVisible={isFinancialVisible}
            />
          )}

          {/* Active section header with WIP indicator */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span>Work Items Filter Listing ({filteredProjects.length})</span>
              {projects.filter(p => p.currentStage !== 'closed' && getProjectLastUpdated(p).isStalled).length > 0 && (
                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse select-none font-bold font-mono">
                  {projects.filter(p => p.currentStage !== 'closed' && getProjectLastUpdated(p).isStalled).length} stalled
                </span>
              )}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Tab Selector Mode Toggle controls */}
              <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#23357a] text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show interactive list of collapsible work items"
                >
                  <i className="fa-solid fa-list-check mr-1.5 text-[9px]"></i>
                  List Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-[#23357a] text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Show timeline calendar visualization of project start/end dates and upcoming milestone deadlines"
                >
                  <i className="fa-solid fa-calendar mr-1.5 text-[9px]"></i>
                  Calendar
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowStalledOnly(!showStalledOnly)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all duration-150 flex items-center gap-1.5 focus:outline-none cursor-pointer font-mono font-bold ${
                  showStalledOnly 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-550/5' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <i className="fa-solid fa-triangle-exclamation text-amber-500 font-bold"></i>
                <span>Stalled Projects Only</span>
              </button>

              {(searchQuery || showStalledOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowStalledOnly(false);
                  }}
                  className="text-xs text-teal-400 hover:underline cursor-pointer font-mono"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Conditional rendering for List/Calendar viewMode */}
          {viewMode === 'calendar' ? (
            <CalendarView
              projects={filteredProjects}
              activeDept={activeDept}
              onInspectProject={(p) => setInspectedProject(p)}
            />
          ) : (
            /* Grid Layout of active items */
            filteredProjects.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-850 flex items-center justify-center mx-auto text-slate-600 border border-slate-805 text-lg">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">No Projects Found</p>
                  <p className="text-xs text-slate-500 mt-1 leading-normal max-w-sm mx-auto">
                    {searchQuery 
                      ? `No current records matching query "${searchQuery}" inside this section.` 
                      : `There are currently no projects parked inside the ${currentHeaderInfo.name}.`}
                  </p>
                </div>

                {projects.length === 0 ? (
                  <div className="pt-4 border-t border-slate-850 max-w-xs mx-auto space-y-2.5">
                    <p className="text-[10px] text-slate-400 font-sans leading-snug">
                      Your workspace database is currently empty. Initialize Gulf Consult's standard geotechnical workflow example projects!
                    </p>
                    <button
                      type="button"
                      onClick={() => persistState(SEED_PROJECTS)}
                      className="px-4 py-2 bg-[#23357a] hover:bg-[#2d4399] border border-blue-500/20 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm flex items-center justify-center gap-2 mx-auto mt-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-rotate-left text-[11px]"></i>
                      Load Sample Projects
                    </button>
                  </div>
                ) : (
                  activeDept === 'secretarial' && !searchQuery && (
                    <p className="text-[11px] text-teal-500 font-mono">
                      Use the registration form above to setup and archive a brand new engineering project.
                    </p>
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
                {filteredProjects.map((proj) => {
                  const isUnderAccountDept = activeDept === 'account' && proj.currentStage === 'account';

                  return (
                    <div key={proj.id} className="space-y-4">
                      {/* Primary Interactive Department Card */}
                      <ProjectCard
                        project={proj}
                        viewingDept={activeDept}
                        onConfirmReceipt={handleConfirmReceipt}
                        onUpdateProgress={handleUpdateProgress}
                        onAddProgressLog={handleAddProgressLog}
                        onMoveToNext={handleMoveToNext}
                        onInspect={(p) => setInspectedProject(p)}
                        onUpdateSpecialization={handleUpdateSpecialization}
                        onApplyPreset={handleApplyPreset}
                        onUpdateProjectFields={handleUpdateProjectFields}
                        onAddAttachment={handleAddAttachment}
                        onRemoveAttachment={handleRemoveAttachment}
                      />

                      {/* Ledger bookkeeping interface embed (rendered only on active Account Dept tab - feature 3) */}
                      {isUnderAccountDept && (
                        <AccountControls
                          project={proj}
                          onSetCost={handleSetCost}
                          onToggleInvoice={handleToggleInvoice}
                          onRecordPayment={handleRecordPayment}
                          onDeletePayment={handleDeletePayment}
                          onCloseProject={handleCloseProject}
                          onToggleStagePayStatus={handleToggleStagePayStatus}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>

      {/* Comprehensive details vertical timing timeline inspector modal (feature 3 / 6) */}
      {inspectedProject && (
        <ProjectDetailsModal
          project={inspectedProject}
          onClose={() => setInspectedProject(null)}
          isFinancialVisible={isFinancialVisible}
        />
      )}

      {/* Real-time executive progress report modal */}
      {activeReportDept && (
        <DepartmentReportModal
          deptId={activeReportDept}
          projects={projects}
          isFinancialVisible={isFinancialVisible}
          onClose={() => setActiveReportDept(null)}
        />
      )}
    </div>
  );
}

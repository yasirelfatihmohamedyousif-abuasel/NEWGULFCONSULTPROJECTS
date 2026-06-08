/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, DepartmentId, FieldTestItem } from '../types';
import { DEPARTMENTS, getNextDepartment, getProjectLastUpdated } from '../departments';
import { DEPARTMENT_PRESETS } from '../specializationPresets';

interface ProjectCardProps {
  project: Project;
  viewingDept: DepartmentId | 'archive';
  onConfirmReceipt: (projectId: string, deptId: DepartmentId) => void;
  onUpdateProgress: (projectId: string, deptId: DepartmentId, percentage: number, notes: string) => void;
  onAddProgressLog: (projectId: string, deptId: DepartmentId, text: string, status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed') => void;
  onMoveToNext: (projectId: string) => void;
  onInspect: (project: Project) => void;
  onUpdateSpecialization?: (projectId: string, deptId: string, key: string, val: string) => void;
  onApplyPreset?: (projectId: string, deptId: string, specs: Record<string, string>, workflowSteps: string[]) => void;
  onUpdateProjectFields?: (projectId: string, fields: Partial<Project>) => void;
  onAddAttachment?: (
    projectId: string,
    deptId: string,
    fileName: string,
    fileUrl: string,
    fileSize?: string,
    docType?: string,
    uploadedBy?: string
  ) => void;
  onRemoveAttachment?: (projectId: string, deptId: string, attachmentId: string) => void;
}

export default function ProjectCard({
  project,
  viewingDept,
  onConfirmReceipt,
  onUpdateProgress,
  onAddProgressLog,
  onMoveToNext,
  onInspect,
  onUpdateSpecialization,
  onApplyPreset,
  onUpdateProjectFields,
  onAddAttachment,
  onRemoveAttachment
}: ProjectCardProps) {
  // Determine which department context this card is operating under
  // In the archive tab, display the overall project current stage; otherwise, context matches active tab
  const activeDeptContext: DepartmentId = (viewingDept === 'archive' || viewingDept === 'account')
    ? project.currentStage
    : viewingDept;

  const currentDeptState = project.departmentStates[activeDeptContext as Exclude<DepartmentId, 'closed'>];
  
  // Local state managers
  const [percent, setPercent] = useState(currentDeptState?.progressPercentage || 0);
  const [notes, setNotes] = useState(currentDeptState?.timelineNotes || '');
  const [newLogText, setNewLogText] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<'Pending' | 'In Progress' | 'Completed' | 'Delayed'>('In Progress');
  const [showLogsCollapse, setShowLogsCollapse] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mobilization editing states
  const [isEditingMobilization, setIsEditingMobilization] = useState(false);
  const [editMobStart, setEditMobStart] = useState(project.mobilizationStartDate || '');
  const [editMobEnd, setEditMobEnd] = useState(project.mobilizationEndDate || '');

  // Attachment local states
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachUrl, setNewAttachUrl] = useState('');
  const [newAttachType, setNewAttachType] = useState('Report');
  const [newAttachSize, setNewAttachSize] = useState('1.2 MB');

  // Sync state with incoming project updates
  useEffect(() => {
    if (currentDeptState) {
      setPercent(currentDeptState.progressPercentage);
      setNotes(currentDeptState.timelineNotes || '');
    }
    setEditMobStart(project.mobilizationStartDate || '');
    setEditMobEnd(project.mobilizationEndDate || '');
  }, [project, activeDeptContext, currentDeptState]);

  const SCOPES_OF_WORK_PRESETS = [
    {
      name: "Geotechnical Exploration Scope",
      fieldworkType: "Standard Geotechnical Site Investigation",
      tests: [
        { testName: "SPT Split-spoon Soil Boring", targetCount: 5, progressPercentage: 0 },
        { testName: "Rotary Diamond Bedrock Coring", targetCount: 2, progressPercentage: 0 },
        { testName: "Standard Proctor Laboratory Compaction Test", targetCount: 3, progressPercentage: 0 }
      ]
    },
    {
      name: "Topographic & Cadastral Survey Scope",
      fieldworkType: "High-precision Boundary Mapping",
      tests: [
        { testName: "RTK Differential GPS Benchmark Setup", targetCount: 3, progressPercentage: 0 },
        { testName: "Laser Total Station Boundary Mapping Traverse", targetCount: 8, progressPercentage: 0 }
      ]
    },
    {
      name: "Subsurface GPR Utility Detection Scope",
      fieldworkType: "GPR Void Sounding & Utility Trace",
      tests: [
        { testName: "400 MHz Shallow Grid Radar Profiles", targetCount: 12, progressPercentage: 0 },
        { testName: "200 MHz Low Frequency Cavity mapping", targetCount: 4, progressPercentage: 0 }
      ]
    },
    {
      name: "Pile Design & Integrity Testing Scope",
      fieldworkType: "Cast-in-place Bored Pile Integrity Verification",
      tests: [
        { testName: "Concrete Tremie Pouring Inspection Logs", targetCount: 15, progressPercentage: 0 },
        { testName: "PIT Low-strain Acoustic Wave Integrity check", targetCount: 48, progressPercentage: 0 }
      ]
    }
  ];

  const handleUpdateFieldworkType = (val: string) => {
    if (onUpdateProjectFields) {
      onUpdateProjectFields(project.id, { fieldworkType: val });
    }
  };

  const handleAddFieldTest = () => {
    const currentTests = project.fieldTests || [];
    const newTest: FieldTestItem = {
      id: 'test_' + Math.random().toString(36).substr(2, 9),
      testName: 'Standard Penetration Test (SPT)',
      targetCount: 5,
      progressPercentage: 0,
      deptId: activeDeptContext,
      status: 'Pending',
      entryData: '',
      remarks: ''
    };
    if (onUpdateProjectFields) {
      onUpdateProjectFields(project.id, { fieldTests: [...currentTests, newTest] });
    }
  };

  const handleUpdateFieldTest = (testId: string, updatedFields: Partial<FieldTestItem>) => {
    const currentTests = project.fieldTests || [];
    const changed = currentTests.map(t => {
      if (t.id !== testId) return t;
      return { ...t, ...updatedFields } as FieldTestItem;
    });
    if (onUpdateProjectFields) {
      onUpdateProjectFields(project.id, { fieldTests: changed });
    }
  };

  const handleRemoveFieldTest = (testId: string) => {
    const currentTests = project.fieldTests || [];
    const filtered = currentTests.filter(t => t.id !== testId);
    if (onUpdateProjectFields) {
      onUpdateProjectFields(project.id, { fieldTests: filtered });
    }
  };

  const handleImportPreset = (presetIndex: number) => {
    const chosen = SCOPES_OF_WORK_PRESETS[presetIndex];
    if (!chosen) return;
    const currentTests = project.fieldTests || [];
    const formatted: FieldTestItem[] = chosen.tests.map(t => ({
      id: 'test_' + Math.random().toString(36).substr(2, 9),
      testName: t.testName,
      targetCount: t.targetCount,
      progressPercentage: t.progressPercentage,
      deptId: activeDeptContext,
      status: 'Pending',
      entryData: '',
      remarks: ''
    }));
    
    if (onUpdateProjectFields) {
      onUpdateProjectFields(project.id, {
        fieldworkType: chosen.fieldworkType,
        fieldTests: [...currentTests, ...formatted]
      });
      
      onAddProgressLog(
        project.id,
        activeDeptContext,
        `Imported Scope of Work: "${chosen.name}" with fieldwork type "${chosen.fieldworkType}" and ${chosen.tests.length} field tests.`,
        'In Progress'
      );
    }
  };

  const currentDeptInfo = DEPARTMENTS.find(d => d.id === activeDeptContext);

  // Department-specific standard presets
  const getQuickMilestones = (): string[] => {
    switch (activeDeptContext) {
      case 'secretarial':
        return ['Proposal verified', 'Unique project ID sequence generated', 'Registry file established'];
      case 'operation':
        return ['Mobilization schedules synchronized', 'Field crews assigned', 'Borehole drilling equipment dispatched'];
      case 'survey':
        return ['Site boundary mapping completed', 'GPS landmarks placed', 'Primary benchmarks checked'];
      case 'gpr':
        return ['Radar sounding grid constructed', '400 MHz antenna scan run completed', 'Underground void detected & noted'];
      case 'geotechnical':
        return ['Wash boring SPT cores captured', 'Soil strata mapping complete', 'Dynamic sample log logged'];
      case 'materials':
        return ['Proctor compaction test completed', 'Atterberg limits recorded', 'Compressive strength data verified'];
      case 'pile':
        return ['Concrete pile pressure tested', 'Reinforcement details certified', 'Load benchmarks signed off'];
      case 'account':
        return ['Invoice ledger compiled', 'Payment transaction logged', 'Financial closure audit approved'];
      default:
        return ['Work progress recorded', 'Routine site inspection completed', 'Task update complete'];
    }
  };

  const handleUpdateProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProgress(project.id, activeDeptContext, percent, notes);
    
    const btn = document.getElementById(`save-btn-${project.id}-${activeDeptContext}`);
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = "<i class='fa-solid fa-check mr-1 text-emerald-400'></i> Saved";
      setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
    }
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    onAddProgressLog(project.id, activeDeptContext, newLogText.trim(), newLogStatus);
    setNewLogText('');
  };

  // Check if viewing department has confirmed the secretarial project receipt
  const hasConfirmedReceipt = project.departmentReceipts?.[activeDeptContext]?.received || false;
  const showReceiptNeeded = (viewingDept !== 'archive' && viewingDept !== 'account' && activeDeptContext !== 'secretarial' && !hasConfirmedReceipt);

  const matchedSpecializations = project.departmentSpecializations?.[activeDeptContext] || {};
  const allAssignedDepts = project.assignedDepartments || [project.currentStage];

  // Staleness computation
  const { daysSinceUpdate, isStalled } = getProjectLastUpdated(project);

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between ${
      isStalled 
        ? 'border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20' 
        : 'border-slate-800 hover:border-slate-750'
    }`}>
      
      {/* Top Meta header row */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap gap-2 justify-between items-center cursor-pointer hover:bg-slate-900/40 transition-all select-none"
        title="Click to expand/collapse project details"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-teal-400 bg-teal-950/60 border border-teal-900 px-2.5 py-0.5 rounded shadow-sm">
            {project.projectNo}
          </span>
          <span className="font-mono text-[9px] text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
            {project.proposalNo}
          </span>
          {project.isSplitWork && (
            <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold font-mono">
              SPLIT CONCURRENT
            </span>
          )}
          {isStalled && (
            <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold font-mono animate-pulse flex items-center gap-1">
              <i className="fa-solid fa-triangle-exclamation"></i> STALLED
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-clock text-slate-600"></i>
            <span>{project.createdDate}</span>
          </div>
          <span className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
            isExpanded ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-slate-950 border-slate-850 text-slate-500'
          }`}>
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px]`}></i>
          </span>
        </div>
      </div>

      {/* Stalled Alert Banner */}
      {isStalled && (
        <div className="bg-amber-500/10 border-b border-amber-500/15 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>⚠️ <strong className="font-black">STALLED PROJECT:</strong> No updates for {daysSinceUpdate} days</span>
          </div>
          <span className="text-[8px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">
            Overdue
          </span>
        </div>
      )}

      {/* Main Body */}
      <div className="p-5 space-y-4 flex-1">
        
        {/* Project Title and client info */}
        <div>
          <h3 
            onClick={(e) => {
              e.stopPropagation();
              onInspect(project);
            }}
            className="text-sm font-extrabold text-slate-100 hover:text-teal-400 cursor-pointer transition-colors leading-snug"
          >
            {project.projectName}
          </h3>

          <div className="mt-2.5 grid grid-cols-2 gap-3 text-[11px] leading-tight text-slate-350">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-slate-500 text-center"><i className="fa-solid fa-briefcase text-[10px]"></i></span>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">Client Name</p>
                <p className="font-semibold text-slate-300 truncate">{project.clientName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-rose-400 text-center"><i className="fa-solid fa-location-dot text-[10px]"></i></span>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">Site Location</p>
                <p className="font-semibold text-slate-300 truncate" title={project.location}>
                  {project.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isExpanded && (
          <div className="pt-2 border-t border-slate-850/40 space-y-3 select-none">
            {/* Division & Progress */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <i className="fa-brands fa-buffer text-teal-400"></i>
                Current Stage:
              </span>
              <span className="text-amber-400 font-bold uppercase">
                {DEPARTMENTS.find(d => d.id === project.currentStage)?.name || project.currentStage}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-500">Stage Progress:</span>
                <span className="text-teal-400 font-bold">{percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850/65">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="w-full py-2 bg-slate-950 hover:bg-slate-905 border border-slate-850 hover:border-slate-750 rounded-lg text-center text-[10px] text-slate-450 hover:text-teal-400 hover:shadow-inner transition-all flex items-center justify-center gap-1.5 font-mono cursor-pointer animate-fade-in"
            >
              <i className="fa-solid fa-expand text-teal-500 text-[9px] animate-pulse"></i>
              Expand Workspace & Action Controls
            </button>
          </div>
        )}

        {isExpanded && (
          <>
            {/* Mobilization Timeline Dates Section */}
            <div className="p-3.5 bg-slate-900/55 rounded-xl border border-slate-850 text-[11px] leading-tight space-y-3.5 text-left transition-all duration-200">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 cursor-default">
            <span className="text-[9.5px] font-black uppercase text-slate-300 tracking-widest font-mono flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-days text-teal-400 animate-pulse"></i>
              Execution & Reporting Timeline
            </span>
            {onUpdateProjectFields && (
              <button
                type="button"
                onClick={() => {
                  if (isEditingMobilization) {
                    onUpdateProjectFields(project.id, {
                      mobilizationStartDate: editMobStart,
                      mobilizationEndDate: editMobEnd
                    });
                  } else {
                    setEditMobStart(project.mobilizationStartDate || '');
                    setEditMobEnd(project.mobilizationEndDate || '');
                  }
                  setIsEditingMobilization(!isEditingMobilization);
                }}
                className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer transition-all ${
                  isEditingMobilization
                    ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/80'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {isEditingMobilization ? (
                  <span className="flex items-center gap-1"><i className="fa-solid fa-circle-check text-[9px]"></i> Save Mobilization</span>
                ) : (
                  <span className="flex items-center gap-1"><i className="fa-solid fa-pen-to-square text-[9px]"></i> Set Mobilization</span>
                )}
              </button>
            )}
          </div>

          {!isEditingMobilization ? (
            <div className="space-y-3">
              {/* Fieldwork Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">Mobilization / Start Fieldwork</p>
                  <div className="flex items-center gap-1.5 mt-0.5 font-semibold font-mono">
                    <i className="fa-solid fa-circle-play text-[8px] text-teal-400"></i>
                    {project.mobilizationStartDate ? (
                      <span className="text-teal-300">{project.mobilizationStartDate}</span>
                    ) : (
                      <span className="text-amber-500/80 italic text-[10px]">⚠️ Date not set</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    Est. Fieldwork End ({project.fieldworkDurationDays ?? 30}d Limit)
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 font-semibold font-mono">
                    <i className="fa-solid fa-flag-checkered text-[8px] text-amber-500"></i>
                    {project.mobilizationEndDate ? (
                      <span className="text-amber-400">{project.mobilizationEndDate}</span>
                    ) : (
                      <span className="text-slate-600 italic">Awaiting start date</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Reporting deadline */}
              <div className="pt-2 border-t border-slate-850/70 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">Fieldwork Completion Status</p>
                  <div className="flex items-center gap-1.5 mt-0.5 font-semibold font-mono">
                    {project.fieldworkCompletedDate ? (
                      <>
                        <i className="fa-solid fa-circle-check text-[9px] text-emerald-400"></i>
                        <span className="text-emerald-400 font-extrabold">{project.fieldworkCompletedDate}</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                        <span className="text-slate-405 font-normal">Active Campaign ({percent}%)</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    Report Delivery Due ({project.reportDueDaysAfterFieldwork ?? 7}d Limit)
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 font-semibold font-mono">
                    <i className="fa-solid fa-file-signature text-[8.5px] text-purple-400"></i>
                    {project.reportDueDate ? (
                      <span className="text-purple-300 font-extrabold">{project.reportDueDate}</span>
                    ) : (
                      <span className="text-slate-650 italic">Awaiting fieldwork completion</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-2 bg-slate-950 border border-slate-850 rounded-lg">
              <div className="space-y-1.5 text-left">
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Date of Mobilization / Start Fieldwork
                </label>
                <input
                  type="date"
                  value={editMobStart}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setEditMobStart(newStart);
                    if (newStart) {
                      const d = new Date(newStart);
                      if (!isNaN(d.getTime())) {
                        const duration = project.fieldworkDurationDays ?? 30;
                        d.setDate(d.getDate() + duration);
                        setEditMobEnd(d.toISOString().split('T')[0]);
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-teal-300 focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
                />
              </div>

              <div className="pt-1.5 text-left space-y-1 bg-slate-900/50 p-1.5 rounded border border-slate-850">
                <p className="text-[7.5px] text-slate-405 uppercase font-bold tracking-wider font-mono">
                  Auto-Calculated Fieldwork End Date
                </p>
                <div className="flex items-center justify-between text-xs font-mono font-bold px-1 py-0.5">
                  <span className="text-slate-500 text-[10px] font-normal">
                    Duration standard: <span className="text-teal-400 font-semibold">{project.fieldworkDurationDays ?? 30} days</span>
                  </span>
                  <span className="text-amber-400 text-xs">
                    {editMobEnd || 'Please pick a start date'}
                  </span>
                </div>
              </div>
              
              <p className="text-[8.5px] text-slate-500 font-mono leading-tight">
                * To change mobilization, choose a start fieldwork campaign calendar date. End fieldwork target deadline is set by Secretariat config.
              </p>
            </div>
          )}
        </div>

        {/* Distributed Work Departments list indicator */}
        <div className="p-2 py-1.5 bg-slate-950/60 rounded-lg border border-slate-850 flex flex-wrap gap-1.5 items-center">
          <span className="text-[8px] font-bold text-slate-550 uppercase tracking-widest font-mono">Involved divisions:</span>
          {allAssignedDepts.map((d) => {
            const inf = DEPARTMENTS.find(dept => dept.id === d);
            const activeStage = project.currentStage === d;
            const received = project.departmentReceipts?.[d]?.received || false;
            return (
              <span 
                key={d}
                className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wide flex items-center gap-1 border uppercase ${
                  activeStage 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse' 
                    : received 
                      ? 'bg-teal-500/5 border-teal-500/10 text-teal-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${
                  activeStage ? 'bg-amber-400 animate-ping' : received ? 'bg-teal-400' : 'bg-slate-600'
                }`}></span>
                {inf?.name || d}
              </span>
            );
          })}
        </div>

        {/* Spec Presets Selection & Active Workflow Checklist rendering */}
        {(() => {
          const availablePresets = DEPARTMENT_PRESETS[activeDeptContext as keyof typeof DEPARTMENT_PRESETS] || [];
          
          const normalSpecializations = Object.fromEntries(
            Object.entries(matchedSpecializations).filter(([key]) => !key.startsWith('_wf_step:'))
          );
          
          const workflowSteps = Object.entries(matchedSpecializations)
            .filter(([key]) => key.startsWith('_wf_step:'))
            .map(([key, val]) => ({
              rawKey: key,
              stepName: key.slice(9), // slice off '_wf_step:'
              status: val as 'completed' | 'pending'
            }));

          return (
            <div className="space-y-3 font-sans">
              
              {/* Preset Selector Dropdown */}
              {availablePresets.length > 0 && viewingDept !== 'archive' && hasConfirmedReceipt && (
                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-widest flex items-center gap-1">
                      <i className="fa-solid fa-square-plus text-teal-400 animate-pulse"></i>
                      Select Specialization Preset
                    </span>
                    <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 font-mono px-1.5 py-0.2 rounded">
                      Preset Tools
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        const presetName = e.target.value;
                        if (!presetName) return;
                        const selected = availablePresets.find(p => p.name === presetName);
                        if (selected && onApplyPreset) {
                          onApplyPreset(project.id, activeDeptContext, selected.specs, selected.workflowSteps);
                          e.target.value = ''; // Reset
                        }
                      }}
                      className="w-full p-1.5 bg-slate-950 border border-slate-850 text-slate-350 hover:text-slate-200 text-[11px] rounded-lg focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
                    >
                      <option value="">-- Apply a Specialization Preset --</option>
                      {availablePresets.map((preset, idx) => (
                        <option key={idx} value={preset.name}>
                          {preset.name} ({Object.keys(preset.specs).length} specs, {preset.workflowSteps.length} steps)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Operations Stage Custom Fieldwork and Tests Section */}
              {activeDeptContext === 'operation' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 space-y-3 shadow-sm text-left">
                  {/* Title & SOW Import Tool */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-1.5 select-none text-left">
                      <span className="text-[11px] text-teal-400">
                        <i className="fa-solid fa-helmet-safety"></i>
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-200 tracking-wider font-sans">
                        Operations Fieldwork Settings
                      </span>
                    </div>
                    {viewingDept !== 'archive' && hasConfirmedReceipt && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase mr-1">SOW Import:</span>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "") {
                              handleImportPreset(Number(val));
                              e.target.value = "";
                            }
                          }}
                          className="bg-slate-900 border border-slate-800 text-[10px] text-teal-300 hover:text-white px-1.5 py-1 rounded cursor-pointer focus:outline-none"
                        >
                          <option value="">-- Import Scope --</option>
                          {SCOPES_OF_WORK_PRESETS.map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Type of Fieldwork Setup */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                      Type of Fieldwork Campaign
                    </label>
                    {viewingDept !== 'archive' && hasConfirmedReceipt ? (
                      <input
                        type="text"
                        placeholder="e.g., Geotechnical Drilling & Cone Penetrometer Testing"
                        value={project.fieldworkType || ""}
                        onChange={(e) => handleUpdateFieldworkType(e.target.value)}
                        className="w-full bg-slate-950/85 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50"
                      />
                    ) : (
                      <div className="p-2 bg-slate-950 rounded border border-slate-900 text-xs text-teal-300 font-mono font-medium">
                        {project.fieldworkType || "No fieldwork campaign type specified yet"}
                      </div>
                    )}
                  </div>

                  {/* Active Field Tests Completed List */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-[10px] uppercase font-bold text-slate-405 font-mono">
                        Field Tests Progress Checklist
                      </span>
                      {viewingDept !== 'archive' && hasConfirmedReceipt && (
                        <button
                          type="button"
                          onClick={handleAddFieldTest}
                          className="text-[9px] bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-mono font-bold border border-teal-500/20 hover:border-teal-500/40 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
                        >
                          <i className="fa-solid fa-plus text-[8px]"></i> Add Test
                        </button>
                      )}
                    </div>

                    {(() => {
                      const filteredLocalTests = (project.fieldTests || []).filter(test => {
                        return !test.deptId || test.deptId === activeDeptContext;
                      });

                      if (filteredLocalTests.length === 0) {
                        return (
                          <div className="p-3 text-center bg-slate-950/30 rounded border border-dashed border-slate-850 select-none">
                            <p className="text-[11px] text-slate-500">No active requirements or division tests registered for this department.</p>
                            {viewingDept !== 'archive' && hasConfirmedReceipt && (
                              <p className="text-[9px] text-slate-600 mt-1 font-mono">
                                Import standard scopes of work or add tests manually.
                              </p>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3.5 max-h-80 overflow-y-auto pr-0.5">
                          {filteredLocalTests.map((test) => {
                            const isEditable = viewingDept !== 'archive' && hasConfirmedReceipt;
                            return (
                              <div key={test.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-850/60 shadow-sm space-y-3">
                                {/* Test Header Row: Name & Target */}
                                <div className="flex justify-between items-start gap-2.5">
                                  <div className="flex-1 min-w-0">
                                    {isEditable ? (
                                      <input
                                        type="text"
                                        value={test.testName}
                                        onChange={(e) => handleUpdateFieldTest(test.id, { testName: e.target.value })}
                                        className="w-full bg-transparent border-b border-transparent hover:border-slate-800 focus:border-teal-500 text-slate-200 text-xs font-semibold focus:outline-none py-0.5 truncate"
                                      />
                                    ) : (
                                      <span className="text-slate-200 text-xs font-semibold block truncate">{test.testName}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">Qty:</span>
                                    {isEditable ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={test.targetCount || 1}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          handleUpdateFieldTest(test.id, { targetCount: isNaN(val) ? 1 : val });
                                        }}
                                        className="w-12 bg-slate-900 border border-slate-800 text-center text-teal-400 text-[10px] font-bold py-0.5 px-1 rounded focus:outline-none"
                                      />
                                    ) : (
                                      <span className="text-teal-400 font-extrabold text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                        {test.targetCount}
                                      </span>
                                    )}
                                    {isEditable && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFieldTest(test.id)}
                                        className="text-rose-400 hover:text-rose-350 p-1 text-[10px] transition-colors cursor-pointer"
                                        title="Remove test"
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Progress & Status Column Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                  {/* Progress Control */}
                                  <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-850/45">
                                    <span className="text-[8.5px] font-mono text-slate-500 uppercase font-black shrink-0">
                                      Progress:
                                    </span>
                                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                      {isEditable ? (
                                        <>
                                          <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={test.progressPercentage || 0}
                                            onChange={(e) => {
                                              const pct = Number(e.target.value);
                                              const nextStatus = pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : test.status || 'Pending';
                                              handleUpdateFieldTest(test.id, { progressPercentage: pct, status: nextStatus as any });
                                            }}
                                            className="flex-1 accent-teal-505 h-1 bg-slate-950 rounded cursor-pointer max-w-full"
                                          />
                                          <span className="w-8 text-right text-[10px] font-mono font-bold text-teal-300 shrink-0">
                                            {test.progressPercentage || 0}%
                                          </span>
                                        </>
                                      ) : (
                                        <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                          <div className="flex-1 bg-slate-950 border border-slate-900 h-1 rounded overflow-hidden">
                                            <div
                                              className="bg-teal-500 h-full rounded transition-all"
                                              style={{ width: `${test.progressPercentage || 0}%` }}
                                            />
                                          </div>
                                          <span className="text-[9px] font-mono text-slate-400 font-bold shrink-0">
                                            {test.progressPercentage || 0}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status Selector */}
                                  <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-850/45">
                                    <span className="text-[8.5px] font-mono text-slate-500 uppercase font-black shrink-0">
                                      Status:
                                    </span>
                                    {isEditable ? (
                                      <select
                                        value={test.status || 'Pending'}
                                        onChange={(e) => {
                                          const nextStatus = e.target.value as any;
                                          const nextPct = nextStatus === 'Completed' ? 100 : test.progressPercentage;
                                          handleUpdateFieldTest(test.id, { status: nextStatus, progressPercentage: nextPct });
                                        }}
                                        className="flex-1 bg-slate-950 text-slate-300 text-[9.5px] font-mono py-0.5 rounded border border-slate-850 outline-none focus:border-teal-500/40"
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Failed">Failed</option>
                                      </select>
                                    ) : (
                                      <span className={`text-[8.5px] font-mono font-black uppercase rounded px-1.5 py-0.2 select-none border ${
                                        test.status === 'Completed'
                                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/35'
                                          : test.status === 'Failed'
                                            ? 'bg-rose-955/20 text-rose-450 border-rose-900/35'
                                            : test.status === 'In Progress'
                                              ? 'bg-sky-955/20 text-sky-450 border-sky-900/35'
                                              : 'bg-slate-900 text-slate-450 border-slate-850'
                                      }`}>
                                        {test.status || 'Pending'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Manual Entries & Remarks */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                                  {/* Entry Data */}
                                  <div className="space-y-0.5">
                                    <span className="text-[7.5px] font-mono text-slate-500 font-bold uppercase block select-none">
                                      Manual Measurements & Data
                                    </span>
                                    {isEditable ? (
                                      <input
                                        type="text"
                                        placeholder="e.g. Depth: 15m, core: 100%"
                                        value={test.entryData || ''}
                                        onChange={(e) => handleUpdateFieldTest(test.id, { entryData: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-[9.5px] text-slate-300 font-mono placeholder:text-slate-700 outline-none focus:border-teal-500/40"
                                      />
                                    ) : (
                                      <div className="p-1 px-2 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] text-slate-450 min-h-[20px] flex items-center">
                                        {test.entryData || <span className="text-slate-650 italic">None recorded</span>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Remarks */}
                                  <div className="space-y-0.5">
                                    <span className="text-[7.5px] font-mono text-slate-500 font-bold uppercase block select-none">
                                      Remarks & Results Summary
                                    </span>
                                    {isEditable ? (
                                      <input
                                        type="text"
                                        placeholder="e.g. Target strength verified"
                                        value={test.remarks || ''}
                                        onChange={(e) => handleUpdateFieldTest(test.id, { remarks: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-[9.5px] text-slate-300 font-mono placeholder:text-slate-700 outline-none focus:border-teal-500/40"
                                      />
                                    ) : (
                                      <div className="p-1 px-2 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] text-slate-455 min-h-[20px] flex items-center">
                                        {test.remarks || <span className="text-slate-650 italic">None</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Specifications Block */}
              {Object.keys(normalSpecializations).length > 0 && (
                <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850/80 space-y-1.5">
                  <div className="flex items-center gap-1 border-b border-slate-850 pb-1 select-none">
                    <i className="fa-solid fa-circle-nodes text-[9px] text-teal-400"></i>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono">
                      Technical Specifications & Directives
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono">
                    {Object.entries(normalSpecializations).map(([key, val]) => (
                      <div key={key} className="bg-slate-950/50 p-1 px-1.5 rounded border border-slate-900 leading-tight">
                        <span className="text-[8px] text-slate-500 block truncate font-black">{key}:</span>
                        {onUpdateSpecialization && viewingDept !== 'archive' && hasConfirmedReceipt ? (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => onUpdateSpecialization(project.id, activeDeptContext, key, e.target.value)}
                            className="text-teal-400 bg-transparent outline-none w-full border-b border-transparent focus:border-teal-500/30 text-[9px] font-semibold font-mono"
                          />
                        ) : (
                          <span className="text-slate-300 font-semibold text-[9px] break-all">{val}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow checklist block */}
              {workflowSteps.length > 0 && (
                <div className="p-3 bg-slate-950/45 rounded-xl border border-slate-850/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 select-none">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono flex items-center gap-1">
                      <i className="fa-solid fa-square-check text-emerald-400"></i>
                      Active Workflow Checklist
                    </span>
                    <span className="text-[8px] font-mono text-emerald-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                      {workflowSteps.filter(s => s.status === 'completed').length} / {workflowSteps.length} Cleared
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {workflowSteps.map((wf, idx) => {
                      const isFinished = wf.status === 'completed';
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-2.5 p-1.5 rounded-lg border text-[10px] transition-all cursor-pointer leading-tight ${
                            isFinished 
                              ? 'bg-emerald-950/5 border-emerald-500/10 text-emerald-300/90 hover:bg-emerald-950/10' 
                              : 'bg-slate-950/30 border-slate-900/50 text-slate-450 hover:border-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isFinished}
                            disabled={viewingDept === 'archive'}
                            onChange={() => {
                              if (viewingDept === 'archive') return;
                              const nextStatus = isFinished ? 'pending' : 'completed';
                              
                              if (onUpdateSpecialization) {
                                onUpdateSpecialization(project.id, activeDeptContext, wf.rawKey, nextStatus);
                              }
                              
                              if (nextStatus === 'completed') {
                                onAddProgressLog(
                                  project.id,
                                  activeDeptContext,
                                  `Checked off workflow task milestone: "${wf.stepName}"`,
                                  'Completed'
                                );
                              } else {
                                onAddProgressLog(
                                  project.id,
                                  activeDeptContext,
                                  `Reopened workflow task milestone: "${wf.stepName}"`,
                                  'In Progress'
                                );
                              }
                            }}
                            className="mt-0.5 rounded border-slate-800 bg-slate-950 h-3.5 w-3.5 text-teal-500 focus:ring-0 focus:ring-offset-0 shrink-0 cursor-pointer"
                          />
                          <div className="space-y-0.5 select-none">
                            <span className={isFinished ? 'line-through text-slate-500 font-medium' : 'text-slate-350 font-medium'}>
                              {wf.stepName}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {workflowSteps.every(s => s.status === 'completed') && (
                    <div className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/5 p-1.5 border border-emerald-500/10 rounded-lg leading-tight select-none animate-pulse">
                      <i className="fa-solid fa-circle-check text-emerald-400"></i>
                      <span>All workflow tasks approved and cleared. Recommend passing deliverables.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Department Stage File & Document Attachments Area */}
              <div className="p-3 bg-slate-950/45 rounded-xl border border-slate-850/80 space-y-2.5 text-left">
                <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 select-none">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest font-mono flex items-center gap-1.5">
                    <i className="fa-solid fa-paperclip text-teal-400"></i>
                    Linked Reference Documents
                  </span>
                  <span className="text-[8px] font-mono text-teal-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                    {currentDeptState?.attachments?.length || 0} Listed
                  </span>
                </div>

                {/* Attachments List */}
                {(!currentDeptState?.attachments || currentDeptState.attachments.length === 0) ? (
                  <div className="py-2 text-center select-none">
                    <p className="text-[9.5px] text-slate-500 font-mono italic">No reference documents linked to this division stage yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {currentDeptState.attachments.map((file) => {
                      // Determine icon for document type
                      let iconClass = "fa-file-lines text-slate-400";
                      if (file.docType === "Report") iconClass = "fa-file-pdf text-rose-400";
                      else if (file.docType === "Drawing") iconClass = "fa-file-image text-cyan-400";
                      else if (file.docType === "Receipt") iconClass = "fa-receipt text-emerald-400";
                      else if (file.docType === "Data Sheet") iconClass = "fa-file-csv text-amber-400";

                      return (
                        <div key={file.id} className="flex justify-between items-center p-1.5 bg-slate-950/80 border border-slate-905 rounded-lg text-[10px] gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 text-xs"><i className={`fa-solid ${iconClass}`}></i></span>
                            <div className="min-w-0 leading-tight">
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-slate-200 hover:text-teal-400 transition-colors block truncate"
                                title={file.fileName}
                              >
                                {file.fileName}
                              </a>
                              <div className="flex items-center gap-1.5 text-[8.5px] text-slate-500 font-mono mt-0.5">
                                <span className="bg-slate-900 px-1 py-0.1 border border-slate-850/80 rounded uppercase text-slate-400 text-[7.5px]">{file.docType}</span>
                                <span>{file.fileSize}</span>
                                <span className="text-slate-600">|</span>
                                <span className="truncate" title={`Uploaded by ${file.uploadedBy} on ${new Date(file.uploadedAt).toLocaleDateString()}`}>
                                  {file.uploadedBy}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {viewingDept !== 'archive' && onRemoveAttachment && (
                            <button
                              type="button"
                              onClick={() => onRemoveAttachment(project.id, activeDeptContext, file.id)}
                              className="text-rose-450 hover:text-rose-350 p-1 transition-all cursor-pointer"
                              title="Delete metadata reference link"
                            >
                              <i className="fa-solid fa-trash-can text-[9px]"></i>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Link Form */}
                {viewingDept !== 'archive' && hasConfirmedReceipt && (
                  <div className="pt-1.5">
                    {!isAddingAttachment ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAttachment(true);
                          setNewAttachName('');
                          setNewAttachUrl('https://');
                        }}
                        className="w-full py-1 border border-dashed border-teal-500/20 hover:border-teal-500/50 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 hover:text-teal-300 font-mono font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-link text-[8px]"></i>
                        <span>Link Internal File Reference / Document</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-slate-950/90 border border-slate-850 rounded-lg space-y-2 text-left">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-1">
                          <span className="text-[8px] font-bold font-mono text-teal-400 uppercase tracking-widest select-none">
                            Link New Reference File
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingAttachment(false)}
                            className="text-slate-500 hover:text-slate-300 text-[10px] px-1 cursor-pointer"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-left">
                          <div className="space-y-0.5 col-span-2">
                            <label className="text-[7.5px] uppercase font-bold text-slate-500 font-mono">Document Title</label>
                            <input
                              type="text"
                              placeholder="e.g., Cone Penetration Report - Core 5"
                              value={newAttachName}
                              onChange={(e) => setNewAttachName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9.5px] text-slate-200 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div className="space-y-0.5 col-span-2">
                            <label className="text-[7.5px] uppercase font-bold text-slate-500 font-mono">Internal Link / URL</label>
                            <input
                              type="text"
                              placeholder="e.g., https://sharepoint.gulfconsult/docs/102.pdf"
                              value={newAttachUrl}
                              onChange={(e) => setNewAttachUrl(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9.5px] text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[7.5px] uppercase font-bold text-slate-500 font-mono">Category Type</label>
                            <select
                              value={newAttachType}
                              onChange={(e) => setNewAttachType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[9.5px] text-slate-300 focus:outline-none cursor-pointer"
                            >
                              <option value="Report">Report</option>
                              <option value="Drawing">Drawing Blueprint</option>
                              <option value="Receipt">Receipt Voucher</option>
                              <option value="Data Sheet">Technical Data Sheet</option>
                              <option value="Other">Other Reference</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[7.5px] uppercase font-bold text-slate-500 font-mono">Simulated Size</label>
                            <input
                              type="text"
                              placeholder="e.g., 2.4 MB"
                              value={newAttachSize}
                              onChange={(e) => setNewAttachSize(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9.5px] text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingAttachment(false)}
                            className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newAttachName.trim() || !newAttachUrl.trim()) return;
                              if (onAddAttachment) {
                                onAddAttachment(
                                  project.id,
                                  activeDeptContext,
                                  newAttachName.trim(),
                                  newAttachUrl.trim(),
                                  newAttachSize.trim() || 'Unknown Size',
                                  newAttachType,
                                  'Senior Engineer'
                                );
                              }
                              setIsAddingAttachment(false);
                            }}
                            className="px-2.5 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-900/80 rounded hover:bg-emerald-900 transition-colors cursor-pointer"
                          >
                            Save Document
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* REQUIRED RECEIPT VERIFICATION MODE */}
        {showReceiptNeeded ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-500/30 text-slate-100 space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute right-2 -bottom-2 text-amber-500/10 text-5xl">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            
            <div className="flex gap-2.5 items-start">
              <span className="text-amber-400 text-sm mt-0.5 shrink-0 animate-pulse">
                <i className="fa-solid fa-circle-exclamation"></i>
              </span>
              <div>
                <p className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono select-none leading-none">
                  Awaiting division Receipt
                </p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Before recording progress or creating status logs, verify coordinate layouts, directives, and acknowledge this package receipt.
                </p>
              </div>
            </div>

            <button
              onClick={() => onConfirmReceipt(project.id, activeDeptContext)}
              className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 font-black text-[10px] uppercase font-mono tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-file-invoice"></i>
              <span>Confirm & Receive Project Package</span>
            </button>
          </div>
        ) : (
          /* REGULAR PROGRESS TRACKER & LOGS (Only if Receipt confirmed) */
          <div className="space-y-3">
            
            {/* Range Progress bar with timeline updates */}
            {viewingDept !== 'archive' && viewingDept !== 'account' && (
              <form onSubmit={handleUpdateProgressSubmit} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2.5">
                <div className="flex justify-between items-center text-[11px] select-none font-mono font-bold text-slate-400">
                  <span>Task Completion progress</span>
                  <span className="text-xs font-mono font-black text-teal-400 bg-slate-900 border border-slate-800 p-0.5 px-2 rounded">
                    {percent}%
                  </span>
                </div>

                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percent}
                    onChange={(e) => setPercent(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-slate-650 font-mono mt-0.5 select-none font-bold">
                    <span>SETUP</span>
                    <span>MID</span>
                    <span>100% DONE</span>
                  </div>
                </div>

                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide notes on site work, milestones, or constraints..."
                    className="w-full p-2 bg-slate-950 border border-slate-850 rounded text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition-colors h-10 resize-none font-sans"
                  />
                </div>

                <div className="flex justify-end select-none">
                  <button
                    type="submit"
                    id={`save-btn-${project.id}-${activeDeptContext}`}
                    className="px-2.5 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-705 text-slate-350 text-[10px] font-bold font-mono rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <i className="fa-solid fa-square-check text-slate-500"></i>
                    Save Status
                  </button>
                </div>
              </form>
            )}

            {/* Historical milestone listings for this context */}
            {viewingDept !== 'archive' && viewingDept !== 'account' && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">New Progress Bulletin</p>
                <form onSubmit={handleAddLogSubmit} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Enter bulletin text..."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    className="flex-1 p-1 bg-slate-950 border border-slate-850 focus:border-teal-500 rounded text-xs text-slate-200"
                  />
                  <select
                    value={newLogStatus}
                    onChange={(e) => setNewLogStatus(e.target.value as any)}
                    className="p-1 bg-slate-950 border border-slate-850 text-slate-400 font-mono text-[10px] rounded focus:outline-none"
                  >
                    <option value="In Progress">WIP</option>
                    <option value="Completed">Done</option>
                    <option value="Pending">Wait</option>
                    <option value="Delayed">Delay</option>
                  </select>
                  <button
                    type="submit"
                    className="px-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </form>

                {/* Suggestions triggers */}
                <div className="flex flex-wrap gap-1 leading-none select-none">
                  {getQuickMilestones().slice(0, 3).map((qs, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => onAddProgressLog(project.id, activeDeptContext, qs, 'Completed')}
                      className="text-[8px] bg-slate-905 hover:bg-slate-850 border border-slate-850 px-1.5 py-0.5 rounded font-mono text-slate-450 text-left truncate max-w-[170px]"
                    >
                      +{qs}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync cross-department activity bulletin box */}
        <div className="border-t border-slate-850/60 pt-3 space-y-1.5 select-none">
          <button
            type="button"
            onClick={() => setShowLogsCollapse(!showLogsCollapse)}
            className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold tracking-wide w-full px-1 py-0.5 hover:text-slate-300"
          >
            <span>
              <i className="fa-solid fa-stream text-teal-400 mr-1 text-[9px]"></i>
              Company-wide activity Audit Trail
            </span>
            <span className="text-[8px] bg-slate-950 px-1 py-0.2 rounded border border-slate-850">
              {project.activityLogs?.length || 0} Logs {showLogsCollapse ? '▲' : '▼'}
            </span>
          </button>

          {(showLogsCollapse || viewingDept === 'archive' || viewingDept === 'account') && (
            <div className="max-h-24 overflow-y-auto space-y-1 p-2 bg-slate-950/80 rounded-lg border border-slate-850/60 font-mono text-[9px] select-text">
              {project.activityLogs?.map((l) => (
                <div key={l.id} className="pb-1 border-b border-slate-900 last:border-0 last:pb-0 text-[10px] leading-tight">
                  <div className="flex justify-between text-slate-550 font-bold select-none text-[8px] tracking-wide mb-0.5">
                    <span className="uppercase text-teal-400/80">{l.deptId} division</span>
                    <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 pr-1">{l.text}</p>
                </div>
              ))}

              {(!project.activityLogs || project.activityLogs.length === 0) && (
                <p className="text-center italic text-slate-700 text-[95] py-1">No synchronized updates posted.</p>
              )}
            </div>
          )}
        </div>

          </>
        )}
      </div>

      {/* Card General Action Footer */}
      {isExpanded && (
        <div className="p-4 bg-slate-950/65 border-t border-slate-800 flex justify-between items-center select-none">
          <button
            onClick={() => onInspect(project)}
            className="text-slate-405 hover:text-teal-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-receipt text-slate-500"></i>
            <span>Check History & Gantt</span>
          </button>

          {viewingDept !== 'archive' && viewingDept !== 'account' && activeDeptContext !== 'secretarial' && (
            <button
              onClick={() => onMoveToNext(project.id)}
              disabled={!hasConfirmedReceipt}
              className={`py-1 py-1.5 px-3.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                hasConfirmedReceipt
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-95 text-slate-950 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>Pass Deliverables</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          )}
        </div>
      )}

    </div>
  );
}

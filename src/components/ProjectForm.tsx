/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Project, DepartmentId } from '../types';
import { generateProjectId, generateProjectNo, createEmptyDepartmentState } from '../departments';
import { DEPARTMENT_PRESETS } from '../specializationPresets';

interface ProjectFormProps {
  onAddProject: (project: Project) => void;
  existingProjectNos: string[];
}

const ELIGIBLE_DEPTS = [
  { id: 'operation' as DepartmentId, name: 'Operation', icon: 'fa-clipboard-list', color: 'slate' },
  { id: 'survey' as DepartmentId, name: 'Survey', icon: 'fa-map-location-dot', color: 'teal' },
  { id: 'gpr' as DepartmentId, name: 'GPR Department', icon: 'fa-satellite-dish', color: 'emerald' },
  { id: 'geotechnical' as DepartmentId, name: 'Geotechnical', icon: 'fa-mountain', color: 'amber' },
  { id: 'materials' as DepartmentId, name: 'Materials Lab', icon: 'fa-flask', color: 'purple' },
  { id: 'pile' as DepartmentId, name: 'Pile Foundation', icon: 'fa-helmet-safety', color: 'orange' }
];

export default function ProjectForm({ onAddProject, existingProjectNos }: ProjectFormProps) {
  const [proposalNo, setProposalNo] = useState('');
  const [projectNo, setProjectNo] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Secretariat expects fieldwork duration and report due days limit
  const [fieldworkDurationDays, setFieldworkDurationDays] = useState<number>(30);
  const [reportDueDaysAfterFieldwork, setReportDueDaysAfterFieldwork] = useState<number>(7);

  // Department assignment state
  const [selectedDepts, setSelectedDepts] = useState<DepartmentId[]>(['operation', 'survey']);
  
  // Financial & Billing configuration (Secretariat Value & Percentages)
  const [projectValue, setProjectValue] = useState<string>('35000');
  const [paymentStages, setPaymentStages] = useState<Array<{ id: string; stageName: string; percentage: number }>>([
    { id: 's1', stageName: 'Upon Mobilization', percentage: 30 },
    { id: 's2', stageName: 'Partial Completion', percentage: 40 },
    { id: 's3', stageName: 'Project Handover', percentage: 30 }
  ]);

  // Specialization key-value fields per department
  const [specs, setSpecs] = useState<Record<string, Record<string, string>>>({
    operation: { 'Planning Type': 'Standard Field Run', 'Primary Coordinator': 'Eng. Robert' },
    survey: { 'GPS Accuracy Required': '±10mm', 'Geodetic Reference': 'WGS 84' },
    gpr: { 'Antenna MHZ': '400 MHz', 'Grid Range': '10m x 10m' },
    geotechnical: { 'Boreholes Count': '5 Boreholes', 'Investigation Depth': '15m' },
    materials: { 'Lab Concrete Class': 'C30/37', 'Curing Standard': 'ASTM C31' },
    pile: { 'Pile Target Depth': '12 meters', 'Testing Standard': 'ASTM D1143' }
  });

  // Completion percentage per department tracked at setup
  const [deptProgress, setDeptProgress] = useState<Record<string, number>>({
    operation: 0,
    survey: 0,
    gpr: 0,
    geotechnical: 0,
    materials: 0,
    pile: 0,
    account: 0
  });

  // Automatically compute project number
  useEffect(() => {
    let nextIndex = existingProjectNos.length + 1;
    let potentialNo = generateProjectNo(nextIndex);
    while (existingProjectNos.includes(potentialNo)) {
      nextIndex++;
      potentialNo = generateProjectNo(nextIndex);
    }
    setProjectNo(potentialNo);
  }, [existingProjectNos]);

  // Compute total of payment stage percentages
  const sumPercentage = useMemo(() => {
    return paymentStages.reduce((sum, s) => sum + s.percentage, 0);
  }, [paymentStages]);

  const handleDeptToggle = (deptId: DepartmentId) => {
    if (selectedDepts.includes(deptId)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter(d => d !== deptId));
      }
    } else {
      setSelectedDepts([...selectedDepts, deptId]);
    }
  };

  const handleAddPaymentStage = () => {
    const nextPercentage = Math.max(0, 100 - sumPercentage);
    setPaymentStages([
      ...paymentStages,
      { id: 'stage_' + Date.now(), stageName: 'New Milestones', percentage: nextPercentage || 10 }
    ]);
  };

  const handleRemovePaymentStage = (id: string) => {
    if (paymentStages.length > 1) {
      setPaymentStages(paymentStages.filter(st => st.id !== id));
    }
  };

  const handleUpdatePaymentStage = (id: string, field: 'stageName' | 'percentage', value: any) => {
    setPaymentStages(paymentStages.map(st => {
      if (st.id !== id) return st;
      if (field === 'percentage') {
        const num = valToPositiveNum(value);
        return { ...st, percentage: num };
      }
      return { ...st, stageName: value };
    }));
  };

  const valToPositiveNum = (v: any) => {
    const num = parseInt(v, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const loadPreset = (presetType: 'standard' | 'half' | 'full') => {
    if (presetType === 'standard') {
      setPaymentStages([
        { id: 'preset1', stageName: 'Upon Mobilization', percentage: 30 },
        { id: 'preset2', stageName: 'Partial Completion', percentage: 40 },
        { id: 'preset3', stageName: 'Project Handover', percentage: 30 }
      ]);
    } else if (presetType === 'half') {
      setPaymentStages([
        { id: 'preset4', stageName: 'Upon Mobilization', percentage: 50 },
        { id: 'preset5', stageName: 'Project Handover', percentage: 50 }
      ]);
    } else if (presetType === 'full') {
      setPaymentStages([
        { id: 'preset6', stageName: 'Project Handover', percentage: 100 }
      ]);
    }
  };

  const handleSpecChange = (deptId: string, specKey: string, val: string) => {
    setSpecs({
      ...specs,
      [deptId]: {
        ...specs[deptId],
        [specKey]: val
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!proposalNo.trim()) return setErrorMsg('Proposal Number is required.');
    if (!projectNo.trim()) return setErrorMsg('Project Number is required.');
    if (!projectName.trim()) return setErrorMsg('Project Name is required.');
    if (!clientName.trim()) return setErrorMsg('Client Name is required.');
    if (!location.trim()) return setErrorMsg('Project Site Location is required.');
    
    const numericVal = parseFloat(projectValue);
    if (isNaN(numericVal) || numericVal <= 0) {
      return setErrorMsg('Please provide a valid positive Project Value.');
    }

    if (sumPercentage !== 100) {
      return setErrorMsg(`Total payment stages must sum precisely to 100%. Current sum is ${sumPercentage}%.`);
    }

    if (selectedDepts.length === 0) {
      return setErrorMsg('Assign at least one operating department.');
    }

    if (existingProjectNos.includes(projectNo.trim())) {
      return setErrorMsg(`Project Number "${projectNo}" is already in use by another archived record.`);
    }

    // Prepare configured layout properties
    const totalCostValue = numericVal;
    const isDivided = selectedDepts.length > 1;

    // Map payment configs with actual dollar amounts
    const mappedPaymentStages = paymentStages.map((st) => ({
      id: st.id,
      stageName: st.stageName,
      percentage: st.percentage,
      amount: Math.round((st.percentage / 100) * totalCostValue),
      status: 'pending' as const
    }));

    // Build specialization mappings
    const finalSpecs: Record<string, Record<string, string>> = {};
    selectedDepts.forEach((d) => {
      finalSpecs[d] = specs[d] || {};
    });

    // Prepare initial department states and acknowledgement receipts using custom progress values
    const initDeptStates = createEmptyDepartmentState();
    const receipts: Record<string, { received: boolean; receivedAt: string | null }> = {};

    // Secretarial is always completed upon layout registration
    initDeptStates.secretarial = {
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      progressPercentage: 100,
      timelineNotes: 'Project registered, value assigned & approved.',
      updates: [
        {
          id: 'u_init',
          timestamp: new Date().toISOString(),
          text: 'Project registered successfully under Secretarial code.',
          status: 'Completed',
          percentage: 100
        }
      ]
    };

    selectedDepts.forEach((d) => {
      const progressVal = deptProgress[d] || 0;
      const stepUpdates = progressVal > 0 ? [
        {
          id: `u_setup_init_${d}`,
          timestamp: new Date().toISOString(),
          text: `Initial department progress set at project setup: ${progressVal}%`,
          status: (progressVal === 100 ? 'Completed' : 'In Progress') as 'Pending' | 'In Progress' | 'Completed' | 'Delayed',
          percentage: progressVal
        }
      ] : [];

      initDeptStates[d] = {
        confirmed: progressVal > 0, // already confirmed if starting with progress
        confirmedAt: progressVal > 0 ? new Date().toISOString() : null,
        progressPercentage: progressVal,
        timelineNotes: progressVal > 0 ? `Registered with preset progress of ${progressVal}%.` : '',
        updates: stepUpdates
      };

      receipts[d] = {
        received: progressVal > 0,
        receivedAt: progressVal > 0 ? new Date().toISOString() : null
      };
    });

    const initLogText = `Project initialized with Value ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCostValue)}. Assigned: ${selectedDepts.map(d => d.toUpperCase()).join(', ')}. ${isDivided ? '(Work split division specified)' : ''}`;

    const newProject: Project = {
      id: generateProjectId(),
      proposalNo: proposalNo.trim(),
      projectNo: projectNo.trim(),
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      location: location.trim(),
      createdDate: new Date().toISOString().split('T')[0],
      fieldworkDurationDays,
      reportDueDaysAfterFieldwork,
      currentStage: selectedDepts[0], // Starts at first assigned department
      totalCost: totalCostValue,
      isInvoiceIssued: false,
      invoiceDate: null,
      payments: [],
      assignedDepartments: selectedDepts,
      isSplitWork: isDivided,
      projectValueInput: totalCostValue,
      paymentStagesConfig: mappedPaymentStages,
      departmentSpecializations: finalSpecs,
      departmentReceipts: receipts,
      activityLogs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          deptId: 'secretarial',
          text: initLogText,
          category: 'system'
        }
      ],
      departmentStates: initDeptStates,
      stageHistory: [
        {
          stage: 'secretarial',
          enteredAt: new Date().toISOString(),
          exitedAt: new Date().toISOString()
        },
        {
          stage: selectedDepts[0],
          enteredAt: new Date().toISOString(),
          exitedAt: null
        }
      ]
    };

    onAddProject(newProject);
    setProposalNo('');
    setProjectName('');
    setClientName('');
    setLocation('');
    setProjectValue('35005'); // slight variance for reset
    
    setSuccessMsg(`Project ${projectNo} registration and departmental routing established successfully!`);
    setTimeout(() => setSuccessMsg(''), 5500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-file-signature text-teal-400"></i>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">1. Initiate Project & Archive Setup</h2>
        </div>
        <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
          Secretarial Controls
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-100 rounded-lg text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-red-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Meta parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Proposal Reference NO. <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">
                <i className="fa-solid fa-folder-open"></i>
              </span>
              <input
                type="text"
                placeholder="e.g. PROP-26-892"
                value={proposalNo}
                onChange={(e) => setProposalNo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Project Unique NO.</span>
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">
                <i className="fa-solid fa-hashtag text-teal-500/40"></i>
              </span>
              <input
                type="text"
                placeholder="GT-2026-X"
                value={projectNo}
                onChange={(e) => setProjectNo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-teal-400 text-xs focus:outline-none focus:border-teal-500 font-bold font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-100 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>PROJECT TOTAL VALUE (USD) <span className="text-emerald-400 font-extrabold">*</span></span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-emerald-400 text-xs font-mono font-black">$</span>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs focus:outline-none focus:border-emerald-500 font-extrabold font-mono transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Text descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Name / Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Geotechnical Investigation, Soil Boring & Cavity Mapping"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Client Or Sponsor <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bin-Ladin Contractors"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Site Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Expressway sector block 5"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Fieldwork & Report Timeline Constraints Section */}
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <i className="fa-solid fa-hourglass-half text-teal-400 animate-pulse"></i>
              <span>Fieldwork Duration & Report Timeline Constraints</span>
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
              Secretariat sets the standard timeline parameters. Calendar dates are automatically projected when active departments schedule mobilization or start of fieldwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Fieldwork Duration (Days) <span className="text-teal-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={fieldworkDurationDays}
                onChange={(e) => setFieldworkDurationDays(Math.max(1, parseInt(e.target.value, 15) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-teal-300 text-xs focus:outline-none focus:border-teal-500 font-mono transition-colors"
                placeholder="e.g. 30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono flex justify-between">
                <span>Report Delivery Delay (Days after fieldwork completion)</span>
                <span className="text-slate-500 font-normal">Standard</span>
              </label>
              <input
                type="number"
                min="0"
                value={reportDueDaysAfterFieldwork}
                onChange={(e) => setReportDueDaysAfterFieldwork(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-amber-400 text-xs focus:outline-none focus:border-amber-500 font-mono transition-colors"
                placeholder="e.g. 7"
              />
            </div>
          </div>
        </div>

        {/* Department Selection layout */}
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                2. WORK DISTRIBUTION & DEPARTMENTS ASSIGNMENT
              </p>
              <p className="text-[11px] text-slate-405 leading-relaxed mt-0.5">
                Assign this project to standard individual execution or split work across multiple specialized departments concurrently.
              </p>
            </div>
            {selectedDepts.length > 1 && (
              <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 animate-pulse shrink-0">
                <i className="fa-solid fa-code-fork"></i> Divided Work Split Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {ELIGIBLE_DEPTS.map((dept) => {
              const active = selectedDepts.includes(dept.id);
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleDeptToggle(dept.id)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    active
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-lg shadow-teal-950/20 scale-102 font-bold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-350'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    active ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 text-slate-500'
                  }`}>
                    <i className={`fa-solid ${dept.icon}`}></i>
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-[11px] leading-tight truncate max-w-full">{dept.name}</p>
                    <p className="text-[8px] text-slate-500 font-mono tracking-wider uppercase">
                      {active ? 'Selected' : 'Idle'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payment Stages Percentage Configurator  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 border-b border-slate-850">
              <div>
                <p className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                  3. PAYMENT STEPS & PERCENTAGES CONFIGURATION
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Allocate payment collection billing points. Must sum up to exactly <span className="text-emerald-400 font-bold">100%</span>.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0 self-start">
                <span className="text-[9px] font-mono text-slate-500 font-bold tracking-widest uppercase mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => loadPreset('standard')}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded font-mono text-[9px] cursor-pointer"
                >
                  30/40/30
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('half')}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded font-mono text-[9px] cursor-pointer"
                >
                  50/50
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('full')}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 rounded font-mono text-[9px] cursor-pointer"
                >
                  100% End
                </button>
              </div>
            </div>

            {/* Stages interactive list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {paymentStages.map((st, index) => {
                const stepValUSD = Math.round((st.percentage / 100) * (parseFloat(projectValue) || 0));
                return (
                  <div key={st.id} className="flex items-center gap-3 bg-slate-900/60 p-2 border border-slate-850 rounded-xl relative group">
                    <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold font-mono text-slate-400">
                      {index + 1}
                    </span>

                    {/* Stage Name input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={st.stageName}
                        onChange={(e) => handleUpdatePaymentStage(st.id, 'stageName', e.target.value)}
                        placeholder="e.g. Initial Mobilization"
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-slate-100 text-xs font-medium focus:outline-none focus:border-teal-500 font-sans"
                      />
                    </div>

                    {/* Stage Percentage constraint input */}
                    <div className="w-24 relative">
                      <input
                        type="number"
                        value={st.percentage}
                        onChange={(e) => handleUpdatePaymentStage(st.id, 'percentage', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded pl-2.5 pr-6 py-1 text-teal-400 text-xs font-black font-mono focus:outline-none focus:border-teal-505 text-right"
                      />
                      <span className="absolute right-2.5 top-1 text-slate-500 text-xs font-mono select-none">%</span>
                    </div>

                    {/* Computed dollor value */}
                    <div className="w-24 text-right text-emerald-400 font-mono text-xs font-extrabold select-none truncate">
                      ${new Intl.NumberFormat('en-US').format(stepValUSD)}
                    </div>

                    {/* Delete milestone action */}
                    {paymentStages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePaymentStage(st.id)}
                        className="w-6 h-6 rounded bg-red-950/20 hover:bg-red-500 hover:text-white border border-red-900/20 hover:border-red-500 text-red-400 flex items-center justify-center text-[10px] cursor-pointer transition-all shrink-0"
                        title="Delete Milestone"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sum metrics & add option */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-mono">
              <button
                type="button"
                onClick={handleAddPaymentStage}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg font-bold border border-teal-500/20 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-plus-circle"></i> Add Custom State
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Sum total:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  sumPercentage === 100 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-505/20'
                }`}>
                  {sumPercentage}% / 100%
                </span>
              </div>
            </div>
          </div>
          {/* Department-specific specializations configuration */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 space-y-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                4. SPECIFIC DEPARTMENT SPECIFICATIONS
              </p>
              <p className="text-[10px] text-slate-405 mt-0.5 leading-relaxed pb-2 border-b border-slate-850">
                Setup execution directives and select the initial progress percentage for each assigned specialized department.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-4 mt-2">
              {selectedDepts.map((deptId) => {
                const deptInfo = ELIGIBLE_DEPTS.find(d => d.id === deptId);
                const properties = specs[deptId] || {};
                
                // Fetch dynamic presets from the specializationPresets module
                const presetsForDept = DEPARTMENT_PRESETS[deptId as Exclude<DepartmentId, 'secretarial' | 'account' | 'closed'>] || [];
                
                // Find if there is an active preset matching the current fields
                const activePreset = presetsForDept.find(p => {
                  return Object.entries(p.specs).every(([k, v]) => properties[k] === v);
                }) || presetsForDept[0];

                const handleApplyPreset = (pSpecs: Record<string, string>, workflowSteps: string[]) => {
                  const updatedSpecs: Record<string, string> = {};
                  // Copy standard target specification properties
                  Object.entries(pSpecs).forEach(([k, v]) => {
                    updatedSpecs[k] = v;
                  });
                  // Load related workflow steps as pending checklist records
                  workflowSteps.forEach(step => {
                    updatedSpecs[`_wf_step:${step}`] = 'pending';
                  });

                  setSpecs(current => ({
                    ...current,
                    [deptId]: updatedSpecs
                  }));
                };

                return (
                  <div key={deptId} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                    {/* Department Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-[10px]">
                          <i className={`fa-solid ${deptInfo?.icon || 'fa-cubes'}`}></i>
                        </span>
                        <span className="text-[11px] font-black text-slate-100 uppercase tracking-wide font-mono">
                          {deptInfo?.name || deptId} Setup Profile
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded select-none uppercase">
                        Active Configuration
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Presets List selection dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Project Details Preset: <span className="text-teal-400 font-bold">*</span>
                        </label>
                        <select
                          value={activePreset?.name || ''}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const found = presetsForDept.find(p => p.name === selectedName);
                            if (found) {
                              handleApplyPreset(found.specs, found.workflowSteps);
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="">-- Apply a Specialization Preset --</option>
                          {presetsForDept.map((preset, pIdx) => (
                            <option key={pIdx} value={preset.name}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                        {activePreset && (
                          <p className="text-[10px] text-slate-400 font-sans leading-tight pl-1 select-none">
                            {activePreset.description}
                          </p>
                        )}
                      </div>

                      {/* Percentage Completed selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Percentage Completed: <span className="text-teal-400 font-bold">*</span>
                        </label>
                        <select
                          value={deptProgress[deptId] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDeptProgress(prev => ({
                              ...prev,
                              [deptId]: val
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-805 text-teal-400 text-xs font-bold rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="0">0% - Not Started</option>
                          <option value="10">10%</option>
                          <option value="20">20%</option>
                          <option value="30">30%</option>
                          <option value="40">40% / Planning Done</option>
                          <option value="50">50%</option>
                          <option value="60">60% / Field Work Active</option>
                          <option value="70">70%</option>
                          <option value="80">80% / Draft Review</option>
                          <option value="90">90% / Approvals Pending</option>
                          <option value="100">100% - Fully Completed</option>
                        </select>
                        <p className="text-[10px] text-slate-500 font-mono pl-1 select-none">
                          Initial starting progress for {deptInfo?.name}.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Input Form for parameters */}
                    {Object.keys(properties).filter(k => !k.startsWith('_wf_step:')).length > 0 && (
                      <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                          Customized parameters:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.keys(properties)
                            .filter(key => !key.startsWith('_wf_step:'))
                            .map((propName) => (
                              <div key={propName} className="space-y-0.5">
                                <label className="block text-[8px] font-mono font-bold text-slate-505 uppercase">
                                  {propName}
                                </label>
                                <input
                                  type="text"
                                  value={properties[propName] || ''}
                                  onChange={(e) => handleSpecChange(deptId, propName, e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-teal-500 rounded px-2 py-0.5 text-slate-300 text-[10px] font-mono focus:outline-none"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Workflow Details disclosure */}
                    {activePreset && (
                      <div className="p-3 bg-slate-950/60 border border-slate-850/40 rounded-lg text-[9px] space-y-1">
                        <span className="font-mono text-[8.5px] font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1 leading-none">
                          <i className="fa-solid fa-list-check text-amber-500 animate-pulse text-[8px]"></i>
                          <span>Workflow timeline steps pre-loaded:</span>
                        </span>
                        <ul className="list-decimal pl-3 space-y-0.5 text-slate-400 leading-relaxed font-sans">
                          {activePreset.workflowSteps.map((step, sIdx) => (
                            <li key={sIdx} className="text-slate-400">{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedDepts.length === 0 && (
                <div className="text-center p-4 text-slate-600 text-[11px] italic font-sans">
                  Select a department in stage 2 to configure details.
                </div>
              )}
            </div>

            <div className="text-[8px] font-mono text-slate-550 leading-normal pt-2 border-t border-slate-850">
              Department teams can view and refine these specifications when they confirm layout receipt.
            </div>
          </div>

        </div>

        {/* Submit button container */}
        <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            * Automatically schedules logistics and triggers direct Accounting visibility.
          </p>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 active:scale-[0.98] font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-150 shadow-lg shadow-teal-500/20"
          >
            <i className="fa-solid fa-folder-plus text-sm"></i>
            <span>Register & Broadcast Project Workflow</span>
          </button>
        </div>
      </form>
    </div>
  );
}

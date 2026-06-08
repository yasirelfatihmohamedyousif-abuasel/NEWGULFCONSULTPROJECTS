/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Project, DepartmentId, FieldTestItem } from '../types';
import { DEPARTMENTS, DEPARTMENT_SEQUENCE, getProjectLastUpdated } from '../departments';

interface ProjectDetailsModalProps {
  project: Project | null;
  onClose: () => void;
  isFinancialVisible?: boolean;
}

export default function ProjectDetailsModal({ project, onClose, isFinancialVisible = true }: ProjectDetailsModalProps) {
  if (!project) return null;

  const totalPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, project.totalCost - totalPaid);

  // Compute active order in workflow sequence
  const currentStageIndex = DEPARTMENT_SEQUENCE.indexOf(project.currentStage);

  // Group tests by department
  const testsByDept = React.useMemo(() => {
    const groups: Record<string, FieldTestItem[]> = {};
    
    // Initialize groups for assigned departments
    const activeAssigned = project.assignedDepartments || [];
    activeAssigned.forEach(d => {
      groups[d] = [];
    });
    
    // Place tests in their respective department group
    if (project.fieldTests) {
      project.fieldTests.forEach(t => {
        const d = t.deptId || 'operation'; // fallback to operation if not explicitly stamped
        if (!groups[d]) {
          groups[d] = [];
        }
        groups[d].push(t);
      });
    }
    
    return groups;
  }, [project]);

  // Staleness computation
  const { lastUpdated, daysSinceUpdate, isStalled } = getProjectLastUpdated(project);


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Dialog Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Close absolute button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-[#0f172a] bg-slate-800 hover:bg-slate-755 p-2 rounded-full cursor-pointer transition-colors z-10 border border-slate-800"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-6 border-b border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <i className="fa-solid fa-compass-drafting text-teal-400 text-xl"></i>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-teal-400 bg-teal-950/60 border border-teal-900 px-2.5 py-0.5 rounded shadow-sm">
                {project.projectNo}
              </span>
              <span className="text-xs text-slate-500 font-mono">Proposal: {project.proposalNo}</span>
              {project.currentStage === 'closed' ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-sans tracking-wider border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
                  ✓ Closed & Archived
                </span>
              ) : (
                <span className="text-[10px] bg-teal-500/10 text-teal-400 font-sans tracking-wide border border-teal-500/20 px-2 py-0.5 rounded font-extrabold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Active
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-slate-100 mt-1.5 pr-8 leading-tight">{project.projectName}</h2>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {isStalled && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
              <span className="text-amber-400 mt-0.5 text-base shrink-0 animate-pulse">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </span>
              <div>
                <h4 className="text-xs font-black uppercase text-amber-300 font-mono tracking-wider flex items-center gap-1.5">
                  Project Stalled / Overdue Action Warning
                </h4>
                <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                  No activity logs, project records, or payment confirmations have been logged against this project files for <strong className="text-amber-300">{daysSinceUpdate} days</strong>. Last modified on: <span className="font-mono text-amber-200">{lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString()}</span>.
                </p>
                <p className="text-[10px] text-slate-500 mt-1.5 italic">
                  Coordinate with the active division (<span className="font-bold underline text-slate-400">{DEPARTMENTS.find(d => d.id === project.currentStage)?.name || project.currentStage}</span>) to expedite and confirm progress workflow.
                </p>
              </div>
            </div>
          )}
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Client Sponsor</span>
              <span className="text-slate-200 text-sm font-bold mt-1 block">{project.clientName}</span>
            </div>
            
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 col-span-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Project Location Details</span>
              <span className="text-slate-200 text-sm font-semibold mt-1 block flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-rose-500 text-xs"></i>
                {project.location}
              </span>
            </div>
          </div>          {/* Consolidated Requirements and Tests Dashboard */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 space-y-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2 select-none">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-teal-500/10 border border-teal-500/20 rounded flex items-center justify-center">
                  <i className="fa-solid fa-list-check text-teal-400 text-xs"></i>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-200 tracking-wide font-mono">
                    Consolidated Departmental Requirements & Lab Tests Board
                  </h4>
                  {project.fieldworkType ? (
                    <p className="text-[10px] text-slate-400 font-serif mt-0.5 leading-snug">
                      Campaign: <span className="text-teal-350 font-bold font-mono">{project.fieldworkType}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      Comprehensive review of the exact scopes, tests, and manual measurements entered by each assigned department
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[9px] font-mono text-teal-300 bg-teal-950/40 border border-teal-900/40 px-2 py-0.5 rounded">
                {project.fieldTests?.length || 0} Requirements Mapped
              </span>
            </div>

            {Object.keys(testsByDept).length === 0 ? (
              <div className="p-4 text-center bg-slate-900/40 rounded border border-dashed border-slate-850 select-none">
                <p className="text-xs text-slate-500">No active requirements or laboratory tests configured for any department.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(testsByDept).map(([deptId, rawTests]) => {
                  const tests = rawTests as FieldTestItem[];
                  const deptInfo = DEPARTMENTS.find(d => d.id === deptId) || {
                    name: deptId.charAt(0).toUpperCase() + deptId.slice(1),
                    icon: 'fa-cube',
                    color: 'teal'
                  };
                  const totalTests = tests ? tests.length : 0;
                  const finishedTests = tests ? tests.filter(t => t.status === 'Completed').length : 0;
                  
                  return (
                    <div key={deptId} className="bg-slate-900/90 border border-slate-850 rounded-xl overflow-hidden p-3 space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {/* Dept Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 select-none shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-teal-450"><i className={`fa-solid ${deptInfo.icon} text-[10px]`}></i></span>
                            <span className="text-xs font-black uppercase text-slate-200 font-mono tracking-wider">{deptInfo.name}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 border border-slate-800 bg-slate-950/70 px-1.5 py-0.2 rounded">
                            {finishedTests}/{totalTests} Cleared
                          </span>
                        </div>

                        {/* List of requirements / tests in this department */}
                        {!tests || tests.length === 0 ? (
                          <div className="p-3 text-center bg-slate-955 rounded border border-dashed border-slate-850/40 select-none font-mono text-[9px] text-slate-600">
                            Awaiting Scope of Work / requirements definition.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {tests.map((test) => (
                              <div key={test.id} className="p-2 bg-slate-950/40 border border-slate-850/50 rounded-lg space-y-1 text-[10.5px]">
                                <div className="flex justify-between items-start gap-1 leading-tight font-semibold">
                                  <span className="text-slate-200 font-medium">{test.testName}</span>
                                  <span className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded border shrink-0 ${
                                    test.status === 'Completed'
                                      ? 'bg-emerald-950/30 text-emerald-450 border-emerald-900/30'
                                      : test.status === 'Failed'
                                        ? 'bg-rose-955/30 text-rose-450 border-rose-900/30'
                                        : test.status === 'In Progress'
                                          ? 'bg-sky-955/30 text-sky-450 border-sky-900/30'
                                          : 'bg-slate-900 text-slate-550 border-slate-800'
                                  }`}>
                                    {test.status || 'Pending'}
                                  </span>
                                </div>

                                {/* Progress with bar */}
                                <div className="flex items-center gap-2 select-none">
                                  <div className="flex-1 bg-slate-950 border border-slate-900 h-1 rounded overflow-hidden">
                                    <div
                                      className="bg-teal-500 h-full rounded transition-all duration-305"
                                      style={{ width: `${test.progressPercentage || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-[8.5px] font-mono text-slate-500 font-bold shrink-0">
                                    {test.progressPercentage || 0}% (Qty: {test.targetCount})
                                  </span>
                                </div>

                                {/* Manually entered data or remarks row */}
                                {(test.entryData || test.remarks) && (
                                  <div className="pt-1 mt-1 border-t border-slate-850/40 grid grid-cols-2 gap-1.5 font-mono text-[8.5px] text-slate-400 leading-tight">
                                    {test.entryData ? (
                                      <div className="truncate">
                                        <span className="text-[7.5px] font-bold text-slate-500 block select-none">MEASURED:</span>
                                        <span className="text-teal-400/95 font-semibold font-mono text-[8.5px] break-all">{test.entryData}</span>
                                      </div>
                                    ) : (
                                      <div className="italic text-slate-650 truncate">- No raw data -</div>
                                    )}

                                    {test.remarks ? (
                                      <div className="truncate">
                                        <span className="text-[7.5px] font-bold text-slate-500 block select-none">REMARKS:</span>
                                        <span className="text-slate-350 italic text-[8.5px] break-all">"{test.remarks}"</span>
                                      </div>
                                    ) : (
                                      <div className="italic text-slate-655 truncate">- No remarks -</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Visual Department Transition Timeline (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-network-wired text-teal-400"></i>
                <span>Departmental Pipeline Timeline</span>
              </h3>              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                {DEPARTMENTS.map((dept, index) => {
                  const state = project.departmentStates[dept.id as Exclude<DepartmentId, 'closed'>];
                  const isCurrent = project.currentStage === dept.id;
                  const isPassed = currentStageIndex === -1 || currentStageIndex > index;
                  const isFuture = project.currentStage !== 'closed' && currentStageIndex < index;
                  
                  // Check if department is actually mapped under active scope
                  const assigned = project.assignedDepartments || [];
                  const isOmitted = project.isSplitWork && 
                                    assigned.length > 0 && 
                                    !assigned.includes(dept.id) && 
                                    dept.id !== 'secretarial' && 
                                    dept.id !== 'account';

                  // Find timing metrics inside history array
                  const hist = project.stageHistory.find(h => h.stage === dept.id);
                  const entryDate = hist?.enteredAt ? new Date(hist.enteredAt).toLocaleString() : null;
                  const exitDate = hist?.exitedAt ? new Date(hist.exitedAt).toLocaleString() : null;

                  let markerColor = 'bg-slate-805 text-slate-500 border-slate-800';
                  let containerStyle = 'opacity-50';

                  if (isOmitted) {
                    markerColor = 'bg-slate-900 text-slate-650 border-slate-850';
                    containerStyle = 'opacity-25 border-dashed bg-transparent';
                  } else if (isCurrent) {
                    markerColor = 'bg-teal-500/20 text-teal-400 border-teal-500 scale-110';
                    containerStyle = 'bg-slate-850/40 p-4 border border-slate-800 rounded-xl shadow-md ring-1 ring-teal-500/10';
                  } else if (isPassed) {
                    markerColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    containerStyle = 'bg-slate-950/20 p-3 border border-slate-900 rounded-xl opacity-90';
                  }

                  return (
                    <div key={dept.id} className={`relative transition-all leading-relaxed ${containerStyle}`}>
                      {/* Timeline dot marker */}
                      <span className={`absolute -left-[28px] top-1 w-5.5 h-5.5 rounded-full border flex items-center justify-center text-[10px] font-bold z-10 ${markerColor}`}>
                        {isOmitted ? (
                          <i className="fa-solid fa-minus text-[9px] text-slate-600"></i>
                        ) : isPassed && !isCurrent ? (
                          <i className="fa-solid fa-check text-[9px]"></i>
                        ) : (
                          index + 1
                        )}
                      </span>

                      {/* Header in stage */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isOmitted ? 'text-slate-600 line-through' : isCurrent ? 'text-teal-400' : isPassed ? 'text-slate-300' : 'text-slate-600'}`}>
                            {dept.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            <i className={`${dept.icon} opacity-60`}></i>
                          </span>
                        </div>
                        
                        {/* Status badges */}
                        {isOmitted ? (
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-950 text-slate-600 border border-slate-850 tracking-wider">
                            Omitted/Skipped
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-teal-500/15 text-teal-400 tracking-wider">
                            Currently Active
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-slate-500 mt-1">{dept.description}</p>

                      {/* Execution logging meta */}
                      {(isCurrent || isPassed) && (
                        <div className="mt-2 space-y-1.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                            {entryDate && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-teal-400/60"><i className="fa-solid fa-right-to-bracket"></i></span>
                                <span>Entered: {entryDate}</span>
                              </div>
                            )}
                            {exitDate && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-rose-450/60"><i className="fa-solid fa-right-from-bracket"></i></span>
                                <span>Exited: {exitDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes summary */}
                          {state && state.confirmed ? (
                            <div className="bg-slate-950/80 rounded p-2.5 space-y-1.5 mt-1 border border-slate-900 text-xs">
                              <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400 flex justify-between">
                                <span>Final Report Notes (Progress: {state.progressPercentage}%)</span>
                                <span className="text-teal-500/70">{state.confirmed ? 'Confirmed Receipt' : 'Awaiting Receipt'}</span>
                              </p>
                              <p className="text-slate-300 font-serif leading-snug italic">
                                "{state.timelineNotes || 'No notes submitted for this stage.'}"
                              </p>

                              {/* Department Sublogs */}
                              {state.updates && state.updates.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-900 space-y-1 font-mono text-[10px]">
                                  {state.updates.map(up => (
                                    <div key={up.id} className="flex justify-between text-slate-400">
                                      <span>• {up.text}</span>
                                      <span className="text-[8px] px-1 bg-slate-900 border border-slate-850 rounded">{up.status}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Department Linked Files */}
                              {state.attachments && state.attachments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-900 space-y-1.5 font-mono text-[10px]">
                                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">
                                    <i className="fa-solid fa-paperclip text-teal-400 mr-1"></i> Reference Documents:
                                  </div>
                                  <div className="grid grid-cols-1 gap-1">
                                    {state.attachments.map(att => {
                                      let fileIcon = "fa-file-lines text-slate-500";
                                      if (att.docType === "Report") fileIcon = "fa-file-pdf text-rose-400";
                                      else if (att.docType === "Drawing") fileIcon = "fa-file-image text-cyan-400";
                                      else if (att.docType === "Receipt") fileIcon = "fa-receipt text-emerald-400";
                                      else if (att.docType === "Data Sheet") fileIcon = "fa-file-csv text-amber-400";

                                      return (
                                        <div key={att.id} className="flex items-center justify-between p-1 bg-slate-900/40 border border-slate-900 rounded leading-tight">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <i className={`fa-solid ${fileIcon} text-[9px] shrink-0`}></i>
                                            <a
                                              href={att.fileUrl} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="text-slate-300 hover:text-teal-400 font-semibold truncate hover:underline"
                                              title={att.fileName}
                                            >
                                              {att.fileName}
                                            </a>
                                            <span className="text-[8px] text-slate-500">({att.fileSize})</span>
                                          </div>
                                          <span className="text-[7.5px] text-slate-550 border border-slate-850 bg-slate-950 px-1 rounded uppercase shrink-0">
                                            {att.docType}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            isCurrent && (
                              <div className="p-2 border border-dashed border-orange-500/20 bg-orange-950/5 text-orange-400 rounded text-[11px] font-mono mt-1">
                                <i className="fa-solid fa-hourglass-half mr-1 text-orange-500 animate-spin"></i>
                                Awaiting receipt confirmation in active department queue.
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Financial Ledger & Billing History (4 cols) or classified shield */}
            <div className="lg:col-span-4 space-y-6">
              
              {!isFinancialVisible ? (
                <div className="p-6 py-12 bg-slate-950/80 border border-slate-850 rounded-xl space-y-4 flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 shadow-md">
                    <i className="fa-solid fa-lock text-xl"></i>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-black uppercase text-slate-200 font-mono tracking-wider">
                      Financial Ledger Restricted
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[210px] mx-auto">
                      Contract budget value, payment schedules, received invoices, and liquidated balances are classified.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[8.5px] bg-slate-900/40 border border-slate-850/65 text-slate-400 px-3 py-1 rounded font-mono font-bold uppercase tracking-wide">
                      Secretariat & Accounts Only
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Financial Box */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-wallet text-emerald-400"></i>
                      <span>Accounts ledger</span>
                    </h3>

                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Contract Value:</span>
                          <span className="font-mono font-bold text-slate-100">${project.totalCost.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Invoice Issued:</span>
                          {project.isInvoiceIssued ? (
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                              YES ({project.invoiceDate})
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 text-[10px] italic">NOT ISSUED</span>
                          )}
                        </div>

                        <div className="flex justify-between text-xs pt-1.5 border-t border-slate-900">
                          <span className="text-slate-400">Total Liquid Paid:</span>
                          <span className="font-mono font-extrabold text-emerald-400">${totalPaid.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-xs pt-1.5 border-t border-slate-900 font-extrabold">
                          <span className="text-slate-200">Remaining Balance:</span>
                          <span className={`font-mono text-sm ${balance === 0 ? 'text-teal-400' : 'text-rose-400 animate-pulse'}`}>
                            ${balance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                          <span>PAID PROGRESS</span>
                          <span>
                            {project.totalCost > 0 ? Math.round((totalPaid / project.totalCost) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${project.totalCost > 0 ? Math.min(100, (totalPaid / project.totalCost) * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions logs list */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-vault text-amber-500"></i>
                      <span>Payment Receipts</span>
                    </h3>

                    {project.payments.length === 0 ? (
                      <div className="p-4 bg-slate-950/45 border border-dashed border-slate-850 rounded-xl text-center text-xs text-slate-500 italic">
                        No transactions recorded on this project ledger.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {project.payments.map(p => (
                          <div key={p.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[11px] font-mono leading-tight space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-emerald-400">+ ${p.amount.toLocaleString()}</span>
                              <span className="text-[9px] text-slate-500">{p.date}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>{p.paymentMethod}</span>
                              <span className="text-slate-600 font-semibold">{p.referenceNo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-5 rounded-lg bg-slate-805 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700/80 cursor-pointer transition-colors"
          >
            Dimiss
          </button>
        </div>

      </div>
    </div>
  );
}

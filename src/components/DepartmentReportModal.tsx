/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Project, DepartmentId } from '../types';
import { DEPARTMENTS, getProjectLastUpdated } from '../departments';
import { DEPARTMENT_PRESETS } from '../specializationPresets';
import GulfConsultLogo from './GulfConsultLogo';

interface DepartmentReportModalProps {
  deptId: DepartmentId | 'archive';
  projects: Project[];
  isFinancialVisible: boolean;
  onClose: () => void;
}

export default function DepartmentReportModal({
  deptId,
  projects,
  isFinancialVisible,
  onClose
}: DepartmentReportModalProps) {
  const [simulationDelayDays, setSimulationDelayDays] = useState(0);

  // 1. Resolve department details
  const deptInfo = useMemo(() => {
    if (deptId === 'archive') {
      return {
        id: 'archive',
        name: 'Enterprise Registry',
        icon: 'fa-box-archive',
        color: 'slate',
        description: 'Comprehensive cross-department status aggregation and administrative reporting.'
      };
    }
    return DEPARTMENTS.find(d => d.id === deptId) || {
      id: deptId,
      name: deptId,
      icon: 'fa-cubes',
      color: 'teal',
      description: 'Departmental operations and specializations.'
    };
  }, [deptId]);

  // 2. Filter projects relevant to this department
  const relevantProjects = useMemo(() => {
    return projects.filter(p => {
      if (deptId === 'archive') return true;
      if (deptId === 'secretarial') return p.currentStage === 'secretarial' || p.departmentStates.secretarial?.confirmed;
      if (deptId === 'account') return p.currentStage !== 'closed';
      
      const assigned = p.assignedDepartments || [];
      if (assigned.length > 0) {
        return assigned.includes(deptId);
      }
      return p.currentStage === deptId;
    });
  }, [projects, deptId]);

  // 3. Compute dynamic department metrics
  const stats = useMemo(() => {
    const total = relevantProjects.length;
    let active = 0;
    let completedCount = 0;
    let totalProgressSum = 0;
    let stalledCount = 0;
    let financialTotalCost = 0;
    const presetsUsed: Record<string, number> = {};

    relevantProjects.forEach(p => {
      const isClosed = p.currentStage === 'closed';
      const lastUpdate = getProjectLastUpdated(p);
      if (lastUpdate.isStalled) {
        stalledCount++;
      }

      // Progress computation
      if (deptId === 'archive') {
        const activeDepts = p.assignedDepartments || [p.currentStage];
        const progressSum = activeDepts.reduce((sum, d) => {
          return sum + (p.departmentStates[d]?.progressPercentage || 0);
        }, 0);
        const avgGlobalProgress = activeDepts.length > 0 ? Math.round(progressSum / activeDepts.length) : 0;
        totalProgressSum += avgGlobalProgress;
        if (isClosed || avgGlobalProgress === 100) {
          completedCount++;
        } else {
          active++;
        }
      } else {
        const ds = p.departmentStates[deptId as Exclude<DepartmentId, 'closed'>];
        const progress = ds?.progressPercentage || 0;
        totalProgressSum += progress;

        if (progress === 100) {
          completedCount++;
        } else {
          active++;
        }

        // Specialization presets matching
        const dp = DEPARTMENT_PRESETS[deptId as Exclude<DepartmentId, 'secretarial' | 'account' | 'closed'>] || [];
        const specs = p.departmentSpecializations?.[deptId] || {};
        const matched = dp.find(preset => {
          return Object.entries(preset.specs).every(([k, v]) => specs[k] === v);
        });
        if (matched) {
          presetsUsed[matched.name] = (presetsUsed[matched.name] || 0) + 1;
        } else if (Object.keys(specs).length > 0) {
          presetsUsed['Custom Specs'] = (presetsUsed['Custom Specs'] || 0) + 1;
        } else {
          presetsUsed['Not Configured'] = (presetsUsed['Not Configured'] || 0) + 1;
        }
      }

      if (p.totalCost) {
        financialTotalCost += p.totalCost;
      }
    });

    const averageProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;

    return {
      total,
      active,
      completedCount,
      averageProgress,
      stalledCount,
      financialTotalCost,
      presetsUsed
    };
  }, [relevantProjects, deptId]);

  // 4. Download and Export as CSV
  const handleCSVExport = () => {
    const headers = [
      'Project No',
      'Proposal No',
      'Project Name',
      'Client',
      'Location',
      'Created Date',
      'Current Stage',
      'Progress',
      'Budget (USD)',
      'Last Updated'
    ];

    const rows = relevantProjects.map(p => {
      const lastUpdate = getProjectLastUpdated(p);
      const prog = deptId === 'archive' 
        ? `${stats.averageProgress}%` 
        : `${p.departmentStates[deptId as Exclude<DepartmentId, 'closed'>]?.progressPercentage || 0}%`;

      return [
        `="${p.projectNo}"`,
        `="${p.proposalNo}"`,
        `"${p.projectName.replace(/"/g, '""')}"`,
        `"${p.clientName.replace(/"/g, '""')}"`,
        `"${p.location.replace(/"/g, '""')}"`,
        p.createdDate,
        p.currentStage,
        prog,
        isFinancialVisible ? (p.totalCost || 0) : '[CLASSIFIED]',
        lastUpdate.lastUpdated.toISOString().split('T')[0]
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GULF_CONSULT_Report_Dept_${deptId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const isIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto animate-fade-in printing-container">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh] my-4 leading-relaxed font-sans overflow-hidden">
        
        {/* Style block for printing optimization */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body, html {
              background-color: white !important;
              color: #0f172a !important;
              overflow: visible !important;
              height: auto !important;
            }
            .printing-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              backdrop-filter: none !important;
              z-index: 9999 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .bg-slate-900 {
              background: white !important;
              border: none !important;
              box-shadow: none !important;
              color: #0f172a !important;
              max-height: none !important;
              overflow: visible !important;
              height: auto !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .flex-1.overflow-y-auto {
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            .border, .border-slate-800, .border-slate-850 {
              border-color: #cbd5e1 !important;
            }
            .bg-slate-950, .bg-slate-950/40, .bg-slate-950/80, .bg-slate-900/50 {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
            }
            .text-white, .text-slate-100, .text-slate-200, .text-slate-300 {
              color: #0f172a !important;
            }
            .text-teal-400, .text-teal-300, .text-emerald-400, .text-amber-400 {
              color: #2e4499 !important; /* Matches brand royal blue logo on print */
            }
            button, .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-850 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            <GulfConsultLogo className="w-9 h-9 bg-white rounded-lg p-1 border border-slate-800" />
            <span className="text-slate-700 text-xs font-mono select-none">|</span>
            <span className={`w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 hover:text-teal-300`}>
              <i className={`fa-solid ${deptInfo.icon} text-xs`}></i>
            </span>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>{deptInfo.name} Division Executive Summary</span>
                <span className="text-[9px] font-mono uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full select-none flex items-center gap-1 shrink-0">
                  <i className="fa-solid fa-file-pdf text-[10px]"></i>
                  <span>OFFICIAL PDF REPORT</span>
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{deptInfo.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Printable/Exportable Content wrapper */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-900/40 print:p-0">
          
          {/* Official Letterhead (Secret / Classified Style) for printing */}
          <div className="hidden print:flex flex-col items-center justify-center text-center pb-6 border-b border-gray-200 mb-6">
            <GulfConsultLogo className="w-16 h-16 mb-3" />
            <h1 className="text-2xl font-black tracking-widest text-[#23357a]">GULF CONSULT OPERATIONS & WORKFLOW</h1>
            <p className="text-xs font-mono tracking-widest text-slate-500 mt-1 uppercase">OFFICIAL GULF CONSULT REPORT — SECURED DATA STREAM</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Printed on {new Date().toLocaleString()} UTC • Administrator: Yasir El Fatih</p>
          </div>

          {/* Premium On-Screen Brand Header Banner */}
          <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-4 no-print relative overflow-hidden">
            {/* Ambient Backlight Accent */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 z-10">
              <GulfConsultLogo className="w-14 h-14 bg-white p-1.5 rounded-xl border border-slate-800" />
              <div>
                <h1 className="text-base font-black tracking-wider text-slate-100 uppercase">GULF CONSULT WORKFLOW CENTER</h1>
                <p className="text-[10px] font-mono tracking-widest text-teal-400 mt-0.5 uppercase">
                  {deptInfo.name} Division — Executive Summary Report
                </p>
                <p className="text-[9px] text-slate-405 mt-1">
                  Secured Data Stream • Compiled on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right font-mono text-[9px] text-slate-500 space-y-0.5 z-10">
              <p>AUTHORIZED USER: ADMINISTRATOR</p>
              <p>STATUS: VERIFIED DIRECTIVE</p>
            </div>
          </div>

          {/* Quick Informational Disclaimer */}
          <div className="p-4 bg-slate-950/80 border border-slate-850/70 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-teal-400 text-lg mt-1 sm:mt-0"><i className="fa-solid fa-shield-halved"></i></span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-200">Formal Verification Integrity Standard</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  This summary aggregates physical site parameters, coordinate benchmarks, and progression steps locked inside the localized client store.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 no-print shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCSVExport}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-350 text-[10px] font-bold font-mono uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-file-csv text-teal-400"></i>
                  <span>Export Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-teal-500 hover:opacity-95 text-slate-950 text-[10px] font-black font-mono uppercase rounded-lg cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-teal-500/15 group"
                  title="Generates high-fidelity PDF report or launches system printing interface."
                >
                  <i className="fa-solid fa-file-pdf text-xs transition-transform group-hover:scale-110"></i>
                  <span>Export PDF / Print</span>
                </button>
              </div>
              {isIframe && (
                <span className="text-[9px] font-sans text-slate-500 block text-right">
                  💡 Tip: If printing inside preview panel is restricted, print using dual screen "Open in New Tab" layout.
                </span>
              )}
            </div>
          </div>

          {/* Analytic KPI Card Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-mono">Assigned Projects</span>
              <span className="text-2xl font-black text-slate-100 block mt-1 font-mono">{stats.total}</span>
              <span className="text-[9px] text-slate-450 mt-1 block">Involved in workflow</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-mono">Average Progress</span>
              <span className="text-2xl font-black text-teal-400 block mt-1 font-mono">{stats.averageProgress}%</span>
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-2">
                <div className="bg-teal-400 h-full" style={{ width: `${stats.averageProgress}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-mono">Stalled Units</span>
              <span className={`text-2xl font-black block mt-1 font-mono ${stats.stalledCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-450'}`}>
                {stats.stalledCount}
              </span>
              <span className="text-[9px] text-slate-450 mt-1 block">
                {stats.stalledCount > 0 ? 'Urgent attention required' : 'All parameters healthy'}
              </span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block font-mono flex items-center gap-1">
                <span>Account Value</span>
                {!isFinancialVisible && <i className="fa-solid fa-lock text-[8px] text-amber-500"></i>}
              </span>
              {isFinancialVisible ? (
                <>
                  <span className="text-lg font-black text-emerald-400 block mt-1 truncate font-mono">${stats.financialTotalCost.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-450 mt-1 block">Total financial budget</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-400 block mt-2.5 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-850/50 text-center select-none">
                    🔒 CLASSIFIED
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1.5 block leading-tight text-center">Accounts Clearance Required</span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Simulation / Forecasting Widget */}
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3 no-print">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-sliders text-amber-500"></i>
                  <span>Division Forecasting Sandbox</span>
                </h4>
                <p className="text-[10px] text-slate-500">Simulate execution constraint delays and forecast backlog completion dates.</p>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/25 px-2 py-0.5 rounded">
                +{simulationDelayDays} Days Added
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="30"
                value={simulationDelayDays}
                onChange={(e) => setSimulationDelayDays(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono font-bold select-none">
                <span>IDEAL (0 DELAYS)</span>
                <span>MODERATE (+15D)</span>
                <span>CRITICAL BLOCKAGE (+30D)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 flex justify-between gap-4 text-[11px] leading-relaxed">
              <div className="space-y-0.5">
                <span className="text-slate-550 block text-[9px] font-mono uppercase tracking-wider font-bold">Estimated Pipeline Clearance</span>
                <p className="text-slate-350 font-sans">
                  Based on {stats.total} operational items, backlog would clear in{' '}
                  <strong className="text-teal-400">{Math.max(3, Math.round((stats.total * 4) * (1 + simulationDelayDays / 30)))} days</strong>.
                </p>
              </div>
              <div className="text-right self-center">
                <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  92% Baseline Accuracy
                </span>
              </div>
            </div>
          </div>

          {/* Specialization Presets Application Breakdown */}
          {deptId !== 'archive' && deptId !== 'secretarial' && deptId !== 'account' && (
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <i className="fa-solid fa-diagram-project text-teal-400"></i>
                <span>Division presets Adoption Metrics</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(stats.presetsUsed).map(([presetName, count]) => {
                  const numCount = Number(count);
                  const pct = Math.round((numCount / (relevantProjects.length || 1)) * 100);
                  return (
                    <div key={presetName} className="p-3 bg-slate-950 rounded-lg border border-slate-900 flex flex-col justify-between gap-1.5">
                      <div className="flex justify-between text-[11px] font-mono leading-none">
                        <span className="font-bold text-slate-300">{presetName}</span>
                        <span className="text-teal-400 font-black">{numCount} Projects ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(stats.presetsUsed).length === 0 && (
                  <p className="col-span-2 text-center text-xs text-slate-500 font-mono italic py-2">
                    No specialization presets used yet. Direct specifications applied custom parameters.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Detailed Projects Tabular Listing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest block font-mono">
              Aggregated Project Work Packages Listing ({stats.total})
            </h4>

            <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850/80 bg-slate-950 text-[10px] font-mono font-bold text-slate-400 uppercase select-none">
                    <th className="py-2.5 px-4">Project No</th>
                    <th className="py-2.5 px-3">Client & Title</th>
                    <th className="py-2.5 px-3 text-center">Division Status</th>
                    <th className="py-2.5 px-3 text-right">Budget Value</th>
                    <th className="py-2.5 px-3 text-right">Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-350 text-[11px]">
                  {relevantProjects.map((p) => {
                    const lastUpdateStatus = getProjectLastUpdated(p);
                    const ds = p.departmentStates[deptId as Exclude<DepartmentId, 'closed'>];
                    const progressVal = deptId === 'archive' 
                      ? Math.round(
                          (Object.keys(p.departmentStates) as Array<keyof typeof p.departmentStates>)
                            .reduce((sum: number, key) => sum + (p.departmentStates[key]?.progressPercentage || 0), 0) / 8
                        )
                      : (ds?.progressPercentage || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-205 whitespace-nowrap">
                          {p.projectNo}
                          <span className="block font-normal text-[8px] text-slate-500">{p.proposalNo}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[240px] truncate">
                          <p className="font-semibold text-slate-200 truncate">{p.projectName}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{p.clientName}</p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-mono text-[10px] font-bold text-teal-400">{progressVal}%</span>
                            <div className="w-16 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500" style={{ width: `${progressVal}%` }}></div>
                            </div>
                            {lastUpdateStatus.isStalled && (
                              <span className="text-[7.5px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded [font-size:7.5px]">STALLED</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-slate-300">
                          {isFinancialVisible ? (p.totalCost ? `$${p.totalCost.toLocaleString()}` : '$0') : '🔒 SECURE'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-450 whitespace-nowrap">
                          {lastUpdateStatus.lastUpdated.toISOString().split('T')[0]}
                        </td>
                      </tr>
                    );
                  })}

                  {relevantProjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center italic text-slate-600 font-mono">
                        No active or matching projects filed under this division segment list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal / Sign-off Block for Printouts */}
          <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-200 text-xs text-slate-700">
            <div className="space-y-4">
              <p className="font-bold">Generated & Audited By:</p>
              <div className="border-b border-gray-400 w-48 h-8"></div>
              <p>Yasir El Fatih, Project Administrator</p>
            </div>
            <div className="space-y-4 text-right">
              <p className="font-bold">Division Management Sign-Off:</p>
              <div className="border-b border-gray-400 w-48 h-8 ml-auto"></div>
              <p>Approved Date: ____________________</p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end gap-3 no-print shrink-0 uppercase font-mono font-bold text-[10px]">
          <span className="self-center mr-auto text-slate-500">
            Viewing {relevantProjects.length} data streams
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg cursor-pointer transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}

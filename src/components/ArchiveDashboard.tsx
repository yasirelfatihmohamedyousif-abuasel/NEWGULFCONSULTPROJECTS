/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Project, DepartmentId } from '../types';
import { DEPARTMENTS } from '../departments';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ArchiveDashboardProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  isFinancialVisible?: boolean;
}

export default function ArchiveDashboard({ projects, onProjectClick, isFinancialVisible = true }: ArchiveDashboardProps) {
  // 1. Calculate general stats
  const stats = useMemo(() => {
    const total = projects.length;
    let closed = 0;
    let activeWIP = 0;
    let totalContractValue = 0;
    let totalPaidCollected = 0;

    projects.forEach((p) => {
      if (p.currentStage === 'closed') {
        closed++;
      } else {
        activeWIP++;
      }
      totalContractValue += p.totalCost || 0;
      const paid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
      totalPaidCollected += paid;
    });

    const outstandingReceivables = totalContractValue - totalPaidCollected;

    return {
      total,
      closed,
      activeWIP,
      totalContractValue,
      totalPaidCollected,
      outstandingReceivables
    };
  }, [projects]);

  // 2. Map project count per active department
  const chartData = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const activeCount = projects.filter((p) => {
        if (p.currentStage === 'closed') return false;
        const assigned = p.assignedDepartments || [p.currentStage];
        return assigned.includes(dept.id) || p.currentStage === dept.id;
      }).length;
      return {
        name: dept.name,
        count: activeCount,
        color: dept.color,
        deptId: dept.id
      };
    });
  }, [projects]);

  // Identify the highest department bottleneck (excluding closed projects)
  const bottleneckDept = useMemo(() => {
    let maxCount = -1;
    let maxDept: typeof DEPARTMENTS[0] | null = null;

    DEPARTMENTS.forEach((dept) => {
      const count = projects.filter((p) => {
        if (p.currentStage === 'closed') return false;
        const assigned = p.assignedDepartments || [p.currentStage];
        return assigned.includes(dept.id) || p.currentStage === dept.id;
      }).length;
      if (count > maxCount && count > 0) {
        maxCount = count;
        maxDept = dept;
      }
    });

    return {
      dept: maxDept as typeof DEPARTMENTS[0] | null,
      count: maxCount
    };
  }, [projects]);

  // Projects currently resting inside the bottleneck department
  const bottleneckProjects = useMemo(() => {
    if (!bottleneckDept.dept) return [];
    return projects.filter((p) => {
      if (p.currentStage === 'closed') return false;
      const assigned = p.assignedDepartments || [p.currentStage];
      return assigned.includes(bottleneckDept.dept!.id) || p.currentStage === bottleneckDept.dept!.id;
    });
  }, [projects, bottleneckDept]);

  // Format monetary sums
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 p-3 border border-slate-800 rounded-lg shadow-xl font-mono text-[11px]">
          <p className="text-slate-100 font-bold mb-1">{data.name}</p>
          <div className="space-y-0.5 text-slate-350">
            <p>Active Projects: <span className="text-teal-400 font-extrabold">{data.count}</span></p>
            <p>Stage status: <span className="text-slate-500 font-sans text-[10px]">archived queue</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // CSV Export utility
  const handleExportToCSV = () => {
    // Definitive column headers matching user requirement
    const headers = [
      'Project ID',
      'Project No',
      'Proposal No',
      'Project Name',
      'Client Name',
      'Location',
      'Date Initiated',
      'Current Stage',
      'Stage Progress (%)',
      'Total Cost (USD)',
      'Total Paid (USD)',
      'Outstanding Balance (USD)',
      'Invoice Status',
      'Invoice Date',
      'Latest Stage Notes'
    ];

    const escapeCSV = (val: any): string => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      // Double the quotes if any exist
      str = str.replace(/"/g, '""');
      // Wrap in double quotes if there are delimiters, quotes or new lines
      if (/[",\n\r]/.test(str)) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = projects.map((p) => {
      const totalPaid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
      const remainingBalance = (p.totalCost || 0) - totalPaid;
      
      const currentStageName = p.currentStage === 'closed' 
        ? 'Closed / Archived' 
        : (DEPARTMENTS.find((d) => d.id === p.currentStage)?.name || p.currentStage);
      
      const progress = p.currentStage === 'closed'
        ? 100
        : (p.departmentStates[p.currentStage]?.progressPercentage ?? 0);

      const latestNote = p.currentStage === 'closed'
        ? 'Project closed and archived.'
        : (p.departmentStates[p.currentStage]?.timelineNotes || 'No notes reported.');

      return [
        p.id,
        p.projectNo,
        p.proposalNo,
        p.projectName,
        p.clientName,
        p.location,
        p.createdDate,
        currentStageName,
        `${progress}%`,
        isFinancialVisible ? (p.totalCost || 0) : '[CLASSIFIED]',
        isFinancialVisible ? totalPaid : '[CLASSIFIED]',
        isFinancialVisible ? remainingBalance : '[CLASSIFIED]',
        isFinancialVisible ? (p.isInvoiceIssued ? 'Invoiced' : 'Pending Invoice') : '[CLASSIFIED]',
        isFinancialVisible ? (p.invoiceDate || 'N/A') : '[CLASSIFIED]',
        latestNote
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestampStr = new Date().toISOString().split('T')[0];
    const filename = `Geotechnical_Projects_Summary_${timestampStr}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header & Reporting Toolkit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            Executive Pipeline Summary & Analytics
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Global portfolio audit, active stage bottlenecks, and financial status tracking exports.
          </p>
        </div>
        <button
          id="btn-export-csv"
          onClick={handleExportToCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-teal-900/10 cursor-pointer active:scale-95 transition-all duration-250 font-mono"
        >
          <i className="fa-solid fa-file-csv text-sm"></i>
          Export to CSV Report
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Met 1 */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Pipeline Total</span>
            <span className="text-base font-black text-slate-100 font-mono block mt-1">{stats.total} Projects</span>
            <span className="text-[10px] text-teal-400/90 font-mono mt-0.5 block flex items-center gap-1">
              <i className="fa-solid fa-folder-tree"></i> {stats.activeWIP} ongoing WIP
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
            <i className="fa-solid fa-cubes"></i>
          </div>
        </div>

        {/* Met 2 */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Contract Value</span>
            <span className="text-base font-black text-slate-100 font-mono block mt-1">
              {isFinancialVisible ? formatCurrency(stats.totalContractValue) : '🔒 [Classified]'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              {isFinancialVisible ? 'Global business pipeline' : 'Awaiting override'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm">
            <i className="fa-solid fa-dollar-sign"></i>
          </div>
        </div>

        {/* Met 3 */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Cash Collected</span>
            <span className="text-base font-black text-emerald-400 font-mono block mt-1">
              {isFinancialVisible ? formatCurrency(stats.totalPaidCollected) : '🔒 [Classified]'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {isFinancialVisible ? (
                stats.totalContractValue > 0 
                  ? `${Math.round((stats.totalPaidCollected / stats.totalContractValue) * 100)}% absolute recovery` 
                  : '0% recovered'
              ) : 'Secretariat & Accounts Only'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm">
            <i className="fa-solid fa-coins"></i>
          </div>
        </div>

        {/* Met 4 */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Receivables Outstanding</span>
            <span className="text-base font-black text-rose-400 font-mono block mt-1">
              {isFinancialVisible ? formatCurrency(stats.outstandingReceivables) : '🔒 [Classified]'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {isFinancialVisible ? 'Awaiting billing stage' : 'Financial details secured'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-sm">
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
        </div>

      </div>

      {/* Main Bottlenecks Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Bar Chart Section (2 Columns width on large screens) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-chart-bar text-teal-400"></i>
                <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest font-mono">
                  Department Workload Distribution
                </h4>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Active Projects Count
              </span>
            </div>
            
            {/* Recharts container responsive wrapper */}
            <div className="h-68 w-full pr-4 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={9} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(name) => name.split(' ')[0]} // Show just the first word for clean spacing on mobile
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={9} 
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => {
                      const isMax = entry.count === bottleneckDept.count && bottleneckDept.count > 0;
                      // Bottleneck department gets highlighted in dynamic amber to warn manager
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isMax ? '#eab308' : '#14b8a6'} 
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-teal-500 rounded"></span> Normal Queue</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded"></span> Bottleneck Peak</span>
            <span>Hover bars for counts</span>
          </div>
        </div>

        {/* Bottleneck Warning Insight Frame (1 Column width) */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
              <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest font-mono">
                Workflow Bottleneck Alert
              </h4>
            </div>

            {bottleneckDept.dept && bottleneckDept.count > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
                      <i className={`${bottleneckDept.dept.icon}`}></i>
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Congested Stage</p>
                      <p className="text-sm font-extrabold text-slate-100 leading-tight">{bottleneckDept.dept.name}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <span>Active Projects Count:</span>
                    <span className="text-slate-100 bg-amber-500/20 px-2 py-0.5 rounded font-black">
                      {bottleneckDept.count} Projects
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    Projects In This Queue
                  </p>
                  
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {bottleneckProjects.map((p) => {
                      const state = p.departmentStates[p.currentStage as Exclude<DepartmentId, 'closed'>];
                      return (
                        <div 
                          key={p.id}
                          onClick={() => onProjectClick(p)}
                          className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg cursor-pointer text-xs transition-colors flex items-center justify-between"
                        >
                          <div className="truncate pr-2">
                            <p className="font-bold text-slate-200 truncate">{p.projectName}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">{p.projectNo} • {p.clientName}</p>
                          </div>
                          <span className="text-[9px] font-mono text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded shrink-0">
                            {state?.progressPercentage || 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 italic text-xs text-slate-500 leading-normal">
                No active projects found. Initiate new projects in Secretarial to compute active workflow bottlenecks.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-normal">
            <p className="font-semibold text-slate-400">Departmental Rule:</p>
            <p className="mt-0.5">Projects must secure formal receipt verification from the supervisor prior to advancement.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

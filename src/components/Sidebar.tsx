/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DepartmentId, DepartmentInfo } from '../types';
import { DEPARTMENTS } from '../departments';
import GulfConsultLogo from './GulfConsultLogo';

interface SidebarProps {
  activeDept: DepartmentId | 'archive';
  onDeptChange: (id: DepartmentId | 'archive') => void;
  projectCounts: Record<DepartmentId, number>;
  onResetDemoData?: () => void;
}

export default function Sidebar({ activeDept, onDeptChange, projectCounts, onResetDemoData }: SidebarProps) {
  const totalActive = Object.values(projectCounts).reduce((a, b) => a + b, 0) - (projectCounts.closed || 0);

  return (
    <aside className="w-full lg:w-72 bg-[#10193e] border-r border-[#1e2a5d] flex flex-col shrink-0 text-white shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1e2a5d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GulfConsultLogo className="w-11 h-11 bg-white p-1 rounded-lg border border-slate-200 shadow-md shadow-slate-900/10" />
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-white leading-none">GULF CONSULT</h1>
            <p className="text-[9px] text-teal-300 font-mono tracking-wider mt-1.5 uppercase">Workflow Engine</p>
          </div>
        </div>
      </div>

      {/* Quick Summary card */}
      <div className="m-4 p-4 rounded-xl bg-[#0a0f2b] border border-[#1e2a5d]">
        <div className="flex justify-between items-center text-xs">
          <span className="text-teal-200 font-medium">Active Projects</span>
          <span className="px-2 py-0.5 rounded-full bg-[#cca43b]/15 text-[#cca43b] font-mono font-bold text-[10px] border border-[#cca43b]/30">
            {totalActive} WIP
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-[#030615] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-[#cca43b] rounded-full transition-all duration-500" 
            style={{ width: `${totalActive > 0 ? Math.min(100, (totalActive / 10) * 100) : 0}%` }}
          />
        </div>
        
        {/* Reset / Recover Example Projects Trigger */}
        {onResetDemoData && (
          <button
            type="button"
            onClick={onResetDemoData}
            className="w-full mt-3.5 py-1.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-teal-300 hover:text-white rounded-lg text-[9.5px] font-mono font-bold transition-all border border-white/5 hover:border-teal-500/20 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-rotate-left text-[9px] animate-spin-slow"></i>
            Reset to Example Projects
          </button>
        )}
      </div>

      {/* Department Nav List */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <span className="px-3 py-1 block text-[10px] font-extrabold text-teal-300/60 tracking-wider">
          WORKFLOW DEPARTMENTS
        </span>
        
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDept === dept.id;
          const count = projectCounts[dept.id] || 0;
          
          return (
            <button
              key={dept.id}
              onClick={() => onDeptChange(dept.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#23357a] text-white shadow-md ring-1 ring-white/10'
                  : 'text-teal-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'bg-[#0a0f2b] text-[#cca43b] group-hover:text-white'
                }`}>
                  <i className={`${dept.icon} text-sm`}></i>
                </span>
                <span className="truncate">{dept.name}</span>
              </div>
              
              {count > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-[#cca43b] text-[#0a0f2b] font-black shadow-sm' : 'bg-white/10 text-teal-200 group-hover:bg-[#23357a] group-hover:text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[#1e2a5d]">
          <span className="px-3 py-1 block text-[10px] font-extrabold text-teal-300/60 tracking-wider">
            RECORDS ARCHIVE
          </span>
          <button
            onClick={() => onDeptChange('archive')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150 cursor-pointer ${
              activeDept === 'archive'
                ? 'bg-[#23357a] text-white shadow-md ring-1 ring-white/10'
                : 'text-teal-100 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-md flex items-center justify-center ${
                activeDept === 'archive' ? 'bg-white/10 text-white' : 'bg-[#0a0f2b] text-teal-300 group-hover:text-white'
              }`}>
                <i className="fa-solid fa-box-archive text-sm"></i>
              </span>
              <span>All Projects Index</span>
            </div>
            
            {(projectCounts.closed || 0) > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-white/10 text-teal-350 rounded">
                {(projectCounts.closed || 0)} Closed
              </span>
            )}
          </button>
        </div>
      </div>

      {/* User Info / Status bottom */}
      <div className="p-4 border-t border-[#1e2a5d] bg-[#0a0f2b]/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#23357a] flex items-center justify-center border border-white/10 text-xs font-extrabold text-[#cca43b] font-mono shadow-inner">
          GT
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">Yasir El Fatih</p>
          <p className="text-[10px] text-teal-300 font-mono truncate">Administrator</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse relative" title="System Live">
          <span className="absolute -inset-0.5 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
        </div>
      </div>
    </aside>
  );
}

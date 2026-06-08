/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Project, DepartmentId } from '../types';
import { DEPARTMENTS } from '../departments';

interface CalendarViewProps {
  projects: Project[];
  activeDept: DepartmentId | 'archive';
  onInspectProject: (p: Project) => void;
}

interface CalendarEvent {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string;
  type: 'start' | 'end' | 'milestone';
  title: string;
  dateStr: string;
  date: Date;
  color: string;
  badgeText?: string;
}

export default function CalendarView({ projects, activeDept, onInspectProject }: CalendarViewProps) {
  // Current month of the calendar view
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to June 2026 since seed projects are in June 2026
    return new Date(2026, 5, 8); // June 8, 2026
  });

  const [viewType, setViewType] = useState<'grid' | 'timeline'>('grid');
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-08');

  // Filter projects corresponding to the selected department
  const deptProjects = useMemo(() => {
    return projects.filter(p => {
      if (activeDept === 'archive') return true;
      if (activeDept === 'secretarial' || activeDept === 'account') {
        return p.currentStage !== 'closed';
      }
      const assigned = p.assignedDepartments || [];
      if (assigned.length > 0) {
        return assigned.includes(activeDept);
      }
      return p.currentStage === activeDept;
    });
  }, [projects, activeDept]);

  // Generate calendar events from project mobilization dates and milestones
  const events = useMemo<CalendarEvent[]>(() => {
    const evs: CalendarEvent[] = [];

    deptProjects.forEach(p => {
      const startStr = p.mobilizationStartDate || p.createdDate;
      // End date default (30 days from start)
      let endStr = p.mobilizationEndDate;
      if (!endStr) {
        const d = new Date(startStr);
        d.setDate(d.getDate() + 30);
        endStr = d.toISOString().split('T')[0];
      }

      const pStart = new Date(startStr);
      const pEnd = new Date(endStr);

      // 1. Mobilisation Start Event
      evs.push({
        id: `start-${p.id}`,
        projectId: p.id,
        projectNo: p.projectNo,
        projectName: p.projectName,
        type: 'start',
        title: `Mobilisation Commencement`,
        dateStr: startStr,
        date: pStart,
        color: 'text-teal-400 bg-teal-950/60 border-teal-800/40',
        badgeText: 'MOB START'
      });

      // 2. Mobilisation End / Target Handover Event
      evs.push({
        id: `end-${p.id}`,
        projectId: p.id,
        projectNo: p.projectNo,
        projectName: p.projectName,
        type: 'end',
        title: `Final Delivery Handover Deadline`,
        dateStr: endStr,
        date: pEnd,
        color: 'text-rose-400 bg-rose-950/60 border-rose-800/40',
        badgeText: 'DEADLINE'
      });

      // 3. Staggered Milestones / Checklists Deadlines
      // If the project has loaded specs or workflow steps:
      const matchedSpecializations = p.departmentSpecializations?.[p.currentStage] || {};
      const workflowSteps = Object.keys(matchedSpecializations)
        .filter(key => key.startsWith('_wf_step:'))
        .map(key => key.slice(9));

      const stepsToSchedule = workflowSteps.length > 0
        ? workflowSteps
        : [
            'Site mobilization & hazard assessment',
            'Primary equipment setup & field trial run',
            'Execution of testing profile segments',
            'Analysis computations & final technical signoff'
          ];

      const totalDays = Math.ceil((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24)) || 30;

      stepsToSchedule.forEach((step, idx) => {
        // Stagger steps over the project timeline
        const percentage = (idx + 1) / (stepsToSchedule.length + 1);
        const offsetDays = Math.floor(totalDays * percentage) || 5;

        const milestoneDate = new Date(pStart);
        milestoneDate.setDate(milestoneDate.getDate() + offsetDays);
        const milestoneDateStr = milestoneDate.toISOString().split('T')[0];

        evs.push({
          id: `milestone-${p.id}-${idx}`,
          projectId: p.id,
          projectNo: p.projectNo,
          projectName: p.projectName,
          type: 'milestone',
          title: `Milestone: ${step}`,
          dateStr: milestoneDateStr,
          date: milestoneDate,
          color: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
          badgeText: `M${idx + 1}`
        });
      });
    });

    return evs;
  }, [deptProjects]);

  // Navigate calendar months
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    // Default to the central seed data timeline: June 2026
    setCurrentDate(new Date(2026, 5, 8));
    setSelectedDateStr('2026-06-08');
  };

  // Build grid days details for the selected month
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Index of first day of the month (0 - 6)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Count of days in month

    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayNumber: number;
    }> = [];

    // Prior month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        date: prevDate,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        dayNumber: d
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const isToday = d === 8 && month === 5 && year === 2026; // Highlight central seed day
      days.push({
        date: currDate,
        dateStr: currDate.toISOString().split('T')[0],
        isCurrentMonth: true,
        isToday,
        dayNumber: d
      });
    }

    // Next month overflow days to pad the standard grids (42 squares)
    const remainingSlots = 42 - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        date: nextDate,
        dateStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        dayNumber: d
      });
    }

    return days;
  }, [currentDate]);

  // Aggregate selected day's agenda details
  const selectedDayAgenda = useMemo(() => {
    const targetDate = new Date(selectedDateStr);
    const dayEvents = events.filter(e => e.dateStr === selectedDateStr);

    // Active projects during this day (projects where selected day falls between mobilization boundaries)
    const activeMobilizations = deptProjects.filter(p => {
      const startStr = p.mobilizationStartDate || p.createdDate;
      let endStr = p.mobilizationEndDate;
      if (!endStr) {
        const d = new Date(startStr);
        d.setDate(d.getDate() + 30);
        endStr = d.toISOString().split('T')[0];
      }

      return selectedDateStr >= startStr && selectedDateStr <= endStr;
    });

    return {
      dateStr: selectedDateStr,
      formattedDate: targetDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      events: dayEvents,
      activeMobilizations
    };
  }, [events, selectedDateStr, deptProjects]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-fade-in text-left">
      {/* Upper Calendar Menu Control */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <i className="fa-solid fa-calendar"></i>
          </span>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest font-mono text-slate-100">
              Departmental Scheduler
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tracking scheduled workflows & deadlines
            </p>
          </div>
        </div>

        {/* Navigation Arrows for Month selection */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 p-1 rounded-lg font-mono text-xs">
          <button
            onClick={prevMonth}
            className="p-1 px-2.5 rounded hover:bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <i className="fa-solid fa-chevron-left text-[11px]"></i>
          </button>
          <span className="px-3 font-semibold text-slate-200 min-w-[110px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 px-2.5 rounded hover:bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Next Month"
          >
            <i className="fa-solid fa-chevron-right text-[11px]"></i>
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
          <button
            onClick={goToToday}
            className="p-1 px-2.5 rounded bg-teal-950/65 text-teal-450 border border-teal-900/40 hover:bg-teal-900/60 transition-colors text-[11px] font-bold cursor-pointer"
          >
            Reset Focus (June '26)
          </button>
        </div>

        {/* View Mode Grid/Timeline Selection */}
        <div className="flex gap-1 bg-slate-950 border border-slate-850 rounded-lg p-1">
          <button
            onClick={() => setViewType('grid')}
            className={`px-3 py-1 text-[11px] font-mono font-bold rounded cursor-pointer transition-all ${
              viewType === 'grid'
                ? 'bg-[#23357a] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-calendar-grid mr-1 text-[10px]"></i>
            Month Grid
          </button>
          <button
            onClick={() => setViewType('timeline')}
            className={`px-3 py-1 text-[11px] font-mono font-bold rounded cursor-pointer transition-all ${
              viewType === 'timeline'
                ? 'bg-[#23357a] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-chart-gantt mr-1 text-[10px]"></i>
            Timeline Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divider-x divider-slate-800">
        {/* LEFT COLUMN: Main Visual Timeline or Calendar (8 cols out of 12) */}
        <div className="lg:col-span-8 p-4">
          {viewType === 'grid' ? (
            <div>
              {/* Calendar Days Names */}
              <div className="grid grid-cols-7 text-center mb-1 text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Squares */}
              <div className="grid grid-cols-7 gap-1 bg-slate-950/20 p-1 rounded-xl border border-slate-850/60 min-h-[350px]">
                {calendarGrid.map((day, idx) => {
                  const isSelected = day.dateStr === selectedDateStr;
                  const dayEvents = events.filter(e => e.dateStr === day.dateStr);

                  // Count start, end, milestones
                  const hasStart = dayEvents.some(e => e.type === 'start');
                  const hasEnd = dayEvents.some(e => e.type === 'end');
                  const hasMilestone = dayEvents.some(e => e.type === 'milestone');

                  // Mobilizations running through this day
                  const runningMobilizationsCount = deptProjects.filter(p => {
                    const start = p.mobilizationStartDate || p.createdDate;
                    let end = p.mobilizationEndDate;
                    if (!end) {
                      const d = new Date(start);
                      d.setDate(d.getDate() + 30);
                      end = d.toISOString().split('T')[0];
                    }
                    return day.dateStr >= start && day.dateStr <= end;
                  }).length;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(day.dateStr)}
                      className={`min-h-[60px] p-1.5 flex flex-col justify-between border rounded-lg cursor-pointer transition-all select-none hover:bg-slate-900/60 ${
                        isSelected
                          ? 'bg-slate-900 border-teal-500'
                          : day.isCurrentMonth
                            ? 'bg-slate-905 border-slate-850'
                            : 'bg-slate-950/25 border-slate-950 text-slate-600'
                      }`}
                    >
                      {/* Day number with highlights */}
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs font-bold font-mono px-1 py-0.2 rounded-md ${
                            day.isToday
                              ? 'bg-amber-500 text-slate-950 font-black scale-105 shadow-sm'
                              : isSelected
                                ? 'text-teal-405 font-bold'
                                : 'text-slate-400'
                          }`}
                        >
                          {day.dayNumber}
                        </span>

                        {/* Running ranges span counter */}
                        {day.isCurrentMonth && runningMobilizationsCount > 0 && (
                          <span
                            className="text-[7.5px] px-1 bg-[#23357a]/40 text-teal-350 font-semibold font-mono rounded"
                            title={`${runningMobilizationsCount} active mobilization range`}
                          >
                            {runningMobilizationsCount} WIP
                          </span>
                        )}
                      </div>

                      {/* Event Dot Indicators */}
                      <div className="flex flex-wrap gap-0.5 mt-2">
                        {hasStart && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"
                            title="Mobilisation starts today"
                          ></span>
                        )}
                        {hasEnd && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                            title="Deliverable deadline today"
                          ></span>
                        )}
                        {hasMilestone && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-400"
                            title="Workflow step deadline"
                          ></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Horizon-aligned Gantt Timeline style tracking schedule */
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850 text-xs font-mono text-slate-450 uppercase">
                <span>Projects Gantt Calendar Range</span>
                <span>June 1 to July 15, '2026</span>
              </div>

              {deptProjects.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 font-mono text-xs">
                  No projects with scheduling entries listed for this division.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {deptProjects.map(p => {
                    const startStr = p.mobilizationStartDate || p.createdDate;
                    let endStr = p.mobilizationEndDate;
                    if (!endStr) {
                      const d = new Date(startStr);
                      d.setDate(d.getDate() + 30);
                      endStr = d.toISOString().split('T')[0];
                    }

                    // Basic percentages calculation for custom Gantt bar placing inside June-July window
                    // Assumed window: 45 days, June 1 (0px) to July 15
                    const startDay = new Date(startStr);
                    const docStartBase = new Date(2026, 5, 1); // June 1 2026
                    const diffStartDays = Math.max(0, Math.ceil((startDay.getTime() - docStartBase.getTime()) / (1000 * 30 * 120))); // rough scalar
                    const totalDuration = Math.ceil((new Date(endStr).getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) || 30;

                    // Bar percentage placements
                    const barOffset = Math.min(80, Math.max(0, (diffStartDays / 45) * 100));
                    const barLength = Math.min(100 - barOffset, Math.max(20, (totalDuration / 45) * 100));

                    return (
                      <div key={p.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => {
                                onInspectProject(p);
                              }}
                              className="text-[11px] font-bold font-mono text-teal-400 hover:underline cursor-pointer"
                            >
                              {p.projectNo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]" title={p.projectName}>
                              {p.projectName}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#cca43b] px-1.5 bg-[#cca43b]/10 border border-[#cca43b]/20 font-mono rounded">
                            {DEPARTMENTS.find(d => d.id === p.currentStage)?.name || p.currentStage}
                          </span>
                        </div>

                        {/* Visual timeline slider placeholder */}
                        <div className="relative h-6 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-850">
                          {/* Label start and dates overlay */}
                          <div className="absolute inset-0 flex justify-between px-2 items-center text-[8.5px] text-slate-500 font-mono select-none">
                            <span>{startStr}</span>
                            <span>{endStr} (Timeline Frame)</span>
                          </div>

                          {/* The filled timeline bar */}
                          <div
                            className="absolute top-1.5 h-3 rounded-full bg-gradient-to-r from-teal-500 to-amber-500 opacity-80"
                            style={{
                              left: `${barOffset}%`,
                              width: `${barLength}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Agenda Daily Inspector List (4 cols) */}
        <div className="lg:col-span-4 p-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/20">
          <div className="space-y-4">
            {/* Header day */}
            <div className="pb-3 border-b border-slate-800">
              <span className="text-[8px] font-black uppercase text-teal-400 tracking-wider font-mono">
                Logistics Daily Inspect
              </span>
              <h5 className="text-sm font-extrabold text-slate-100 font-sans tracking-tight mt-0.5">
                {selectedDayAgenda.formattedDate}
              </h5>
            </div>

            {/* Daily schedule updates list */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              
              {/* Event indicators notifications / warnings */}
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
                  Deadlines & Transmissions ({selectedDayAgenda.events.length})
                </p>
                {selectedDayAgenda.events.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic py-1">No scheduled milestones or transition dates on this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayAgenda.events.map((e, idx) => (
                      <div
                        key={idx}
                        className={`p-2 border rounded-lg flex flex-col gap-1 text-[11px] leading-snug bg-slate-950 ${
                          e.type === 'start'
                            ? 'border-teal-500/20'
                            : e.type === 'end'
                              ? 'border-rose-500/20'
                              : 'border-amber-500/20'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[8.5px] font-mono">
                          <span className={`px-1 rounded font-bold uppercase ${e.color}`}>
                            {e.badgeText || e.type}
                          </span>
                          <span 
                            onClick={() => {
                              const found = projects.find(p => p.id === e.projectId);
                              if (found) onInspectProject(found);
                            }}
                            className="text-teal-405 hover:underline cursor-pointer font-bold uppercase transition"
                          >
                            {e.projectNo}
                          </span>
                        </div>
                        <p className="text-slate-200 mt-0.5 font-sans font-semibold leading-relaxed">
                          {e.title}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">
                          {e.projectName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active project mobilization scopes ranges inside this day */}
              <div className="pt-2 border-t border-slate-850/60">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
                  Active Mobilization Work ({selectedDayAgenda.activeMobilizations.length})
                </p>
                {selectedDayAgenda.activeMobilizations.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic py-1">All site operations idle on this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayAgenda.activeMobilizations.map((p, idx) => {
                      const stageName = DEPARTMENTS.find(d => d.id === p.currentStage)?.name || p.currentStage;
                      const start = p.mobilizationStartDate || p.createdDate;
                      let end = p.mobilizationEndDate;
                      if (!end) {
                        const d = new Date(start);
                        d.setDate(d.getDate() + 30);
                        end = d.toISOString().split('T')[0];
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => onInspectProject(p)}
                          className="p-2.5 bg-slate-905 border border-slate-850 rounded-xl hover:border-slate-750 cursor-pointer text-[11px] leading-tight space-y-1 transition group"
                        >
                          <div className="flex justify-between items-center select-none">
                            <span className="font-mono font-extrabold text-teal-400 bg-slate-950 border border-slate-850 px-1.5 py-0.2 rounded">
                              {p.projectNo}
                            </span>
                            <span className="text-[8px] uppercase tracking-wider font-mono text-amber-400 bg-amber-500/5 px-2 py-0.2 rounded border border-amber-500/10">
                              {stageName}
                            </span>
                          </div>
                          <p className="font-bold text-slate-200 truncate group-hover:text-teal-405 leading-relaxed mt-1">
                            {p.projectName}
                          </p>
                          <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1">
                            <span>S: {start}</span>
                            <span>E: {end}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

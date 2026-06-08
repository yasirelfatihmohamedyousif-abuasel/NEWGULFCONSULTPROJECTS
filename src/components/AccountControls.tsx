/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, PaymentRecord } from '../types';

interface AccountControlsProps {
  project: Project;
  onSetCost: (projectId: string, cost: number) => void;
  onToggleInvoice: (projectId: string, isIssued: boolean, invoiceDate: string | null) => void;
  onRecordPayment: (projectId: string, payment: PaymentRecord) => void;
  onDeletePayment: (projectId: string, paymentId: string) => void;
  onCloseProject: (projectId: string) => void;
  onToggleStagePayStatus?: (projectId: string, stageId: string, isPaid: boolean) => void;
}

export default function AccountControls({
  project,
  onSetCost,
  onToggleInvoice,
  onRecordPayment,
  onDeletePayment,
  onCloseProject,
  onToggleStagePayStatus
}: AccountControlsProps) {
  const [costInput, setCostInput] = useState(project.totalCost || 0);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('Bank Wire');
  const [payRef, setPayRef] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState('');

  const totalPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDecimal = project.totalCost - totalPaid;
  const balance = Math.max(0, balanceDecimal);

  // Sync cost input with project PROP changes
  useEffect(() => {
    setCostInput(project.totalCost || 0);
  }, [project.totalCost]);

  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (costInput < 0) return;
    onSetCost(project.id, costInput);
    setStatusMsg('Contract base value updated in registry.');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const invDate = isChecked ? new Date().toISOString().split('T')[0] : null;
    onToggleInvoice(project.id, isChecked, invDate);
  };

  // Quick Select standard stages
  const handleStageSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stageId = e.target.value;
    setSelectedStageId(stageId);
    
    if (!stageId) {
      setPayAmount('');
      setPayRef('');
      return;
    }

    const stages = project.paymentStagesConfig || [];
    const matched = stages.find(s => s.id === stageId);
    if (matched) {
      setPayAmount(matched.amount);
      setPayRef(`Stage: ${matched.stageName}`);
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) return;
    
    // Warn if amount is larger than balance
    if (payAmount > balance) {
      alert(`Warning: The registered payment worth $${payAmount} exceeds the current project balance of $${balance}. Please match ledger criteria.`);
      return;
    }

    const newPayment: PaymentRecord = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      amount: payAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      referenceNo: payRef.trim() || 'REG-' + Math.floor(Math.random() * 900000 + 100000)
    };

    onRecordPayment(project.id, newPayment);

    // If a specific stage was pre-selected, auto-toggle its status to 'received' too!
    if (selectedStageId && onToggleStagePayStatus) {
      onToggleStagePayStatus(project.id, selectedStageId, true);
    }

    setPayAmount('');
    setPayRef('');
    setSelectedStageId('');
    setStatusMsg('Payment posted successfully to ledger!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // Quickly trigger payment of a stage directly from clicking its Action list
  const handlePayStageDirectly = (stageId: string, amount: number, stageName: string) => {
    if (amount > balance) {
      alert(`Warning: Stage amount $${amount} exceeds total project balance of $${balance}.`);
      return;
    }

    const newPayment: PaymentRecord = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Wire',
      referenceNo: `Cleared Stage: ${stageName}`
    };

    onRecordPayment(project.id, newPayment);
    if (onToggleStagePayStatus) {
      onToggleStagePayStatus(project.id, stageId, true);
    }

    setStatusMsg(`Recorded invoice payment of $${amount} for "${stageName}" stage.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleClearStageManually = (stageId: string, isPaid: boolean) => {
    if (onToggleStagePayStatus) {
      onToggleStagePayStatus(project.id, stageId, isPaid);
    }
  };

  const handleCloseTrigger = () => {
    if (balance > 0) return;
    onCloseProject(project.id);
  };

  const stagesPreset = project.paymentStagesConfig || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Decorative header matching brand guidelines */}
      <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-file-invoice-dollar text-emerald-400"></i>
          <h3 className="text-xs font-mono font-bold text-slate-100 tracking-wider">
            {project.projectNo} Billing Terminal
          </h3>
        </div>
        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
          Accounts Department
        </span>
      </div>

      <div className="p-5 space-y-5">
        {statusMsg && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2 font-mono">
            <i className="fa-solid fa-square-check text-emerald-400"></i>
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Financial KPI stats group */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-950 rounded-xl border border-slate-850">
          <div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Total Budget</p>
            <p className="text-lg font-black font-mono text-slate-100">${project.totalCost.toLocaleString()}</p>
          </div>
          <div className="border-y sm:border-y-0 sm:border-x border-slate-850 py-2 sm:py-0 sm:px-4">
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono text-emerald-400/80">Received</p>
            <p className="text-lg font-black font-mono text-emerald-400">${totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono text-rose-400/80">Remaining</p>
            <p className={`text-lg font-black font-mono ${balance === 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              ${balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Configured payment milestones list display */}
        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Secretariat Payment Milestones</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">These stages were locked upon registration split configuration.</p>
            </div>
            {stagesPreset.length > 0 && (
              <span className="text-[8px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                {stagesPreset.length} Milestones
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {stagesPreset.map((s, idx) => {
              const matchedPaid = s.status === 'received';
              return (
                <div key={s.id || idx} className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-all ${
                  matchedPaid 
                    ? 'bg-teal-950/10 border-teal-500/20 text-teal-300' 
                    : 'bg-slate-900 border-slate-850/80 text-slate-350'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold mt-0.5 shrink-0 ${
                      matchedPaid ? 'bg-teal-500 text-slate-950' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold font-sans">{s.stageName}</p>
                      <p className="text-[9px] font-mono text-slate-500">
                        {s.percentage}% of project sum — <span className="font-semibold text-emerald-500/80">${s.amount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center font-mono">
                    <button
                      type="button"
                      onClick={() => handleClearStageManually(s.id, !matchedPaid)}
                      className={`text-[9px] uppercase px-2 py-0.5 rounded cursor-pointer transition-all border ${
                        matchedPaid
                          ? 'bg-teal-500/10 border-teal-500/20 text-teal-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-500 font-medium hover:border-slate-700'
                      }`}
                    >
                      {matchedPaid ? '✓ Received' : 'Awaiting'}
                    </button>

                    {!matchedPaid && (
                      <button
                        type="button"
                        onClick={() => handlePayStageDirectly(s.id, s.amount, s.stageName)}
                        className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[9px] rounded uppercase cursor-pointer"
                        title="Record Payment for this stage"
                      >
                        Pay Stage
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {stagesPreset.length === 0 && (
              <p className="text-center p-3 text-[10px] text-slate-600 font-mono italic">
                No stages populated during secretarial creation. Default base billing values apply.
              </p>
            )}
          </div>
        </div>

        {/* Dynamic transaction poster inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3.5">
            <form onSubmit={handleSaveCost} className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Update Total budget
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    value={costInput || ''}
                    onChange={(e) => setCostInput(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-1 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal-500 font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 font-bold text-[10px] uppercase font-mono rounded-lg transition-colors cursor-pointer"
                >
                  Adjust
                </button>
              </div>
            </form>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-300 font-sans">Dispatch Invoice</p>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {project.isInvoiceIssued 
                    ? `Issued: ${project.invoiceDate}` 
                    : 'Awaiting dispatch confirmation.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.isInvoiceIssued}
                  onChange={handleInvoiceChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-slate-950"></div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Ledger Payment Record Form
            </h4>
            
            <form onSubmit={handleAddPayment} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-mono font-bold mb-0.5">Link Stage</label>
                  <select
                    value={selectedStageId}
                    onChange={handleStageSelectChange}
                    className="w-full p-1 bg-slate-950 border border-slate-850 rounded text-slate-300 font-mono text-[10px] focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Custom / Select Stage --</option>
                    {stagesPreset.map((s, idx) => (
                      <option key={s.id || idx} value={s.id}>
                        Stage {idx+1}: {s.stageName} (${s.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-mono font-bold mb-0.5">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-1 bg-slate-950 border border-slate-850 rounded text-slate-300 font-mono text-[10px] focus:outline-none focus:border-teal-500"
                  >
                    <option>Bank Wire</option>
                    <option>Corporate Check</option>
                    <option>Cash / Petty</option>
                    <option>Credit Voucher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-mono font-bold mb-0.5">Amount (USD)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Value $"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-1 bg-slate-950 border border-slate-850 rounded text-emerald-400 text-[11px] font-black font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[8px] text-slate-500 uppercase font-mono font-bold mb-0.5">Ref / Memo</label>
                  <input
                    type="text"
                    placeholder="TXN ID"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full p-1 bg-slate-950 border border-slate-850 rounded text-slate-300 font-mono text-[10px] focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase font-mono rounded cursor-pointer transition-colors"
              >
                Insert Ledger Transaction Check
              </button>
            </form>
          </div>
        </div>

        {/* ledger history stream */}
        {project.payments.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Recorded Payment Ledger Stream ({project.payments.length})
            </h4>
            <div className="max-h-24 overflow-y-auto space-y-1.5 border border-slate-850 rounded-xl p-2.5 bg-slate-950/60 font-mono text-[10px]">
              {project.payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-slate-950 p-1.5 rounded-lg border border-slate-900 leading-tight">
                  <div>
                    <p className="font-extrabold text-emerald-400">+ ${p.amount.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {p.date} • {p.paymentMethod} • <span className="font-mono text-slate-400">{p.referenceNo}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onDeletePayment(project.id, p.id)}
                    className="text-slate-600 hover:text-red-400 p-1 transition-colors cursor-pointer rounded hover:bg-red-500/10"
                    title="Delete payment log"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3.5 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/20 p-3 rounded-xl">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold text-slate-200">Formal Closure Auditing</p>
            <p className="text-[9px] text-slate-500 mt-0.5 max-w-sm">
              Approved once deliverables are met and the invoice balance equates to zero.
            </p>
          </div>

          <button
            onClick={handleCloseTrigger}
            disabled={balance > 0}
            className={`py-1.5 px-4 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all w-full md:w-auto ${
              balance === 0
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 active:scale-95 text-slate-950 shadow-md shadow-teal-500/10 cursor-pointer'
                : 'bg-slate-850 hover:bg-slate-850 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span>Close out & Archive</span>
          </button>
        </div>

      </div>
    </div>
  );
}

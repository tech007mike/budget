'use client';

import React, { useState, useEffect } from 'react';

// Since no date-fns, I'll implement basic date logic with native Date

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  isRecurring: boolean;
  frequency?: string;
  occurrence?: string;
  status: 'pending' | 'paid' | 'skipped';
}

const initialBalance = 3000;

const recurringRules = [
  { id: 'gables', desc: 'Gables', amount: -1500, dayOfWeek: 1, occurrence: '1st', category: 'Rent' }, // Monday? Adjust to Fridays etc.
  // Full mapping from Excel
  { id: 'realiatex', desc: 'Reliatex', amount: 566, dayOfWeek: 2, occurrence: 'every', category: 'Income' },
  { id: 'pickett', desc: 'Pickett', amount: 1097, dayOfWeek: 5, occurrence: 'every', category: 'Income' },
  { id: 'duke', desc: 'Duke', amount: -150, dayOfWeek: 5, occurrence: '1st', category: 'Utilities' },
  { id: 'aj', desc: 'AJ', amount: -25, dayOfWeek: 5, occurrence: 'every', category: 'Other' },
  { id: 'verizon', desc: 'Verizon', amount: -284, dayOfWeek: 0, occurrence: '1st', category: 'Utilities' }, // Approximate
  // Add more from data
  { id: 'weekly', desc: 'Weekly Bundle', amount: -569.5, dayOfWeek: 0, occurrence: 'every', category: 'Food' },
  // etc.
];

function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, occurrence: number): Date {
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === dayOfWeek) {
      count++;
      if (count === occurrence) return date;
    }
    date.setDate(date.getDate() + 1);
  }
  return null as any;
}

function formatDate(date: Date, pattern: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (pattern === 'MMM dd, yyyy') {
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  }
  if (pattern === 'MMM dd') {
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
  }
  return date.toISOString().split('T')[0];
}

function generateTransactionsForMonth(currentDate: Date): Transaction[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const transactions: Transaction[] = [];

  // Hardcode based on Excel
  const baseTx = [
    { desc: 'Gables', amount: -1500, dateStr: '1', category: 'Rent' },
    { desc: 'Reliatex', amount: 566, dateStr: 'tue1', category: 'Income' },
    { desc: 'Duke', amount: -150, dateStr: 'fri1', category: 'Utilities' },
    { desc: 'Pickett', amount: 1097, dateStr: 'fri1', category: 'Income' },
    { desc: 'AJ', amount: -25, dateStr: 'fri1', category: 'Other' },
    // Add all recurring
    { desc: 'Spotify', amount: -20.87, dateStr: '3', category: 'Subscriptions' },
    // More...
  ];

  baseTx.forEach((tx, index) => {
    let txDate = new Date(year, month, parseInt(tx.dateStr) || 1);
    if (tx.dateStr.includes('tue')) {
      txDate = getNthWeekdayOfMonth(year, month, 2, 1); // Tuesday
    } else if (tx.dateStr.includes('fri')) {
      txDate = getNthWeekdayOfMonth(year, month, 5, 1);
    }
    transactions.push({
      id: `tx-${index}`,
      description: tx.desc,
      amount: tx.amount,
      date: txDate,
      category: tx.category,
      isRecurring: true,
      status: 'pending'
    });
  });

  // Sort by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return transactions;
}

export default function BudgetApp() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1)); // June 2026
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [paidCount, setPaidCount] = useState(0);

  useEffect(() => {
    const txs = generateTransactionsForMonth(currentMonth);
    setTransactions(txs);
    // Calculate projected
  }, [currentMonth]);

  const updateTransactionStatus = (id: string, status: 'paid' | 'skipped') => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, status } : tx
    ));
  };

  const projectedBalance = transactions.reduce((acc, tx) => {
    if (tx.status !== 'skipped') return acc + tx.amount;
    return acc;
  }, initialBalance);

  const upcomingBills = transactions.filter(tx => tx.amount < 0 && tx.status === 'pending').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const upcomingIncome = transactions.filter(tx => tx.amount > 0 && tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold">B</div>
            <div>
              <div className="font-semibold">Budget Forecast</div>
              <div className="text-xs text-zinc-500">iPhone Style</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={currentMonth.getMonth()}
              onChange={(e) => {
                const newMonth = new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1);
                setCurrentMonth(newMonth);
              }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1 text-sm"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i} value={i}>{new Date(2026, i).toLocaleString('default', { month: 'short' })}</option>
              ))}
            </select>
            <button onClick={() => setShowRecurring(true)} className="text-emerald-400 text-sm">Rules</button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* Dashboard */}
        <div className="pt-8">
          <div className="bg-zinc-900 rounded-3xl p-8 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-zinc-400 text-sm">CURRENT BALANCE</div>
                <div className="text-5xl font-semibold mt-2 tracking-tighter">${balance.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 text-sm">PROJECTED EOM</div>
                <div className="text-3xl font-medium mt-1">${projectedBalance.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-zinc-800 rounded-2xl p-4">
                <div className="text-xs text-zinc-500">REMAINING BILLS</div>
                <div className="text-2xl font-semibold text-red-400 mt-1">-${upcomingBills.toFixed(2)}</div>
              </div>
              <div className="bg-zinc-800 rounded-2xl p-4">
                <div className="text-xs text-zinc-500">UPCOMING INCOME</div>
                <div className="text-2xl font-semibold text-emerald-400 mt-1">+${upcomingIncome.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Calendar Summary */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{monthName}</h2>
              <button className="text-sm text-emerald-400">Calendar View</button>
            </div>
            {/* Simple list */}
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium px-1">Forecast</h3>
            {transactions.map((tx, index) => {
              const runningBalance = transactions.slice(0, index + 1).reduce((acc, t) => 
                t.status !== 'skipped' ? acc + t.amount : acc, initialBalance);
              return (
                <div key={tx.id} className="bg-zinc-900 rounded-3xl p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.amount > 0 ? '💰' : '💸'}
                    </div>
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-xs text-zinc-500">{formatDate(tx.date, 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-mono text-lg font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => updateTransactionStatus(tx.id, 'paid')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-full text-xs transition"
                      >
                        Paid
                      </button>
                      <button 
                        onClick={() => updateTransactionStatus(tx.id, 'skipped')}
                        className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs transition"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running Balance */}
          <div className="mt-12 bg-zinc-900 rounded-3xl p-6">
            <h3 className="font-medium mb-4">Running Balance</h3>
            <div className="space-y-3 text-sm">
              {transactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>{formatDate(tx.date, 'MMM dd')}</div>
                  <div className="font-mono">{tx.amount > 0 ? '+' : ''}${tx.amount}</div>
                  <div className="font-semibold">${(initialBalance + transactions.slice(0, idx+1).reduce((a, t) => a + (t.status !== 'skipped' ? t.amount : 0), 0)).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Rules Modal */}
      {showRecurring && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowRecurring(false)}>
          <div className="bg-zinc-900 rounded-3xl max-w-md w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-semibold">Recurring Rules</h2>
            </div>
            <div className="p-6 space-y-6">
              {recurringRules.map(rule => (
                <div key={rule.id} className="flex justify-between items-center">
                  <div>
                    <div>{rule.desc}</div>
                    <div className="text-xs text-zinc-500">{rule.occurrence} {rule.dayOfWeek}</div>
                  </div>
                  <div className={`font-mono ${rule.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${rule.amount}</div>
                </div>
              ))}
              <button className="w-full py-4 bg-white text-black rounded-2xl font-medium">+ Add New Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav for iPhone feel */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 max-w-3xl mx-auto">
        <div className="flex justify-around py-3 text-xs">
          <div className="flex flex-col items-center text-emerald-400">
            <div>🏠</div>
            <div>Home</div>
          </div>
          <div className="flex flex-col items-center">
            <div>📅</div>
            <div>Calendar</div>
          </div>
          <div className="flex flex-col items-center">
            <div>📊</div>
            <div>Reports</div>
          </div>
          <div className="flex flex-col items-center">
            <div>⚙️</div>
            <div>Settings</div>
          </div>
        </div>
      </nav>
    </div>
  );
}

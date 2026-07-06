// app/(dashboard)/ai-insights/page.tsx
'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { BrainCircuit, Send, Sparkles, MessageSquare, AlertTriangle, Info, AlertOctagon, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useMutation } from '@apollo/client/react';

const AI_INSIGHTS_QUERY = gql`
  query GetAIInsights {
    aiInsights {
      type
      title
      description
      severity
      actionable
      suggestion
    }
    financialSummary {
      totalRevenue
      totalExpenses
      netProfit
      outstandingAmount
    }
  }
`;

const AI_CHAT_MUTATION = gql`
  mutation AiChat($message: String!) {
    aiChat(message: $message)
  }
`;

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export default function AIInsightsPage() {
  const { data, loading, error } = useQuery<any>(AI_INSIGHTS_QUERY);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hi, I am your Claude-powered finance assistant. I have compiled your cash flows, costs, and unpaid invoices. Ask me anything about your business financial health!',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [sendAiChat] = useMutation<any>(AI_CHAT_MUTATION);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Claude is analyzing your accounts...</p>
      </div>
    );
  }

  const insights = data?.aiInsights || [];
  const summary = data?.financialSummary;

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatLog((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data: chatData } = await sendAiChat({ variables: { message: userText } });
      const reply = chatData?.aiChat || 'Sorry, I could not process that request right now.';
      setChatLog((prev) => [...prev, { sender: 'assistant', text: reply }]);
    } catch (err: any) {
      setChatLog((prev) => [...prev, { sender: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return {
          icon: AlertOctagon,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      default:
        return {
          icon: Info,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-indigo-500" />
          AI Analytics & Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">Autonomous anomaly detection, ledger suggestions, and chat queries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Financial Indicators</h3>
          
          <div className="space-y-4">
            {insights.map((insight: any, idx: number) => {
              const style = getSeverityStyle(insight.severity);
              const Icon = style.icon;

              return (
                <div key={idx} className={`p-5 rounded-2xl border ${style.bg} flex gap-4 items-start`}>
                  <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${style.color} flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-2 flex-1 text-xs">
                    <div className="flex items-center gap-2 justify-between flex-wrap">
                      <h4 className="font-bold text-slate-200">{insight.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${style.color}`}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{insight.description}</p>
                    {insight.suggestion && (
                      <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-slate-400">
                        <strong className="text-white">Recommendation:</strong> {insight.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {insights.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No anomalies detected at this time. Ledger is healthy.
              </div>
            )}
          </div>
        </div>

        {/* Interactive Chatbot */}
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px] justify-between bg-slate-900/10">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-2.5 bg-slate-900/40">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Finance Assistant</h3>
              <p className="text-[10px] text-slate-500">Claude-3.5-Sonnet Offline Agent</p>
            </div>
          </div>

          {/* Messages Logs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.sender === 'user' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-indigo-400" />}
                </div>

                <div className={`p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-750 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2.5 mr-auto">
                <div className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-750 rounded-tl-none flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-950/40">
            <input
              type="text"
              placeholder="Ask about profits, overdue invoice collection..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

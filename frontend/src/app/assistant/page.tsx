"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Bot, Send, User, Sparkles, Cpu, AlertCircle, Loader2 } from "lucide-react";

export default function AssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! I am Swamy Jewellery CRM AI. I have full read access to your active deals, accounts, and contact matrices. Ask me to identify high-value targets, write outreach sequences, or summarize recent logs!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await api.ai.chat({ messages: nextMessages });
      setMessages([...nextMessages, { role: "assistant", content: result.response }]);
    } catch (err: any) {
      setMessages([...nextMessages, { role: "assistant", content: `Failed to retrieve AI response. Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Show high-value leads in Italy",
    "Which leads are most likely to convert?",
    "Summarize last conversation notes",
    "Generate follow-up outreach details"
  ];

  return (
    <div className="h-[80vh] flex flex-col gap-6 animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bot className="text-amber-400" />
            <span>AI Sales Assistant</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Query CRM pipelines, parse custom lists, and draft outreach sequences using NLP.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Cpu size={14} className="animate-pulse" />
          <span>Active Context Engine</span>
        </div>
      </div>

      {/* Chat Display Split Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Left Suggestions Pane */}
        <div className="hidden lg:flex flex-col gap-4 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl h-full justify-between shadow-neon-accent">
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Recommended Queries</span>
            </h3>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="w-full text-left p-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-xs text-slate-350 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-50 block"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed">
            <AlertCircle size={14} className="text-amber-400 mb-1.5" />
            <span>Swamy Jewellery CRM AI utilizes Vector similarity queries (`pgvector`) to read details from accounts and sync tasks dynamically.</span>
          </div>
        </div>

        {/* Right Chat Board panel */}
        <div className="lg:col-span-3 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col h-full overflow-hidden shadow-neon-accent">
          {/* Scroll messages box */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-[300px]">
            {messages.map((m, idx) => {
              const isAi = m.role === "assistant";
              return (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                  <div className={`
                    h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold
                    ${isAi ? "bg-amber-600 shadow-md shadow-amber-550/10" : "bg-slate-950 border border-slate-800"}
                  `}>
                    {isAi ? <Bot size={16} /> : <User size={16} className="text-amber-400" />}
                  </div>
                  <div className={`
                    p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap
                    ${isAi 
                      ? "bg-slate-950 border border-slate-900 text-slate-200" 
                      : "bg-amber-600/90 text-white font-medium"
                    }
                  `}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Loader2 size={12} className="animate-spin text-amber-400" />
                  <span>Swamy Jewellery AI is analyzing CRM datasets...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form message input */}
          <div className="p-4 bg-slate-950 border-t border-slate-900">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me: 'Show high value leads in Italy' or 'Write outbound email for NovaSoft'..."
                className="flex-grow bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 placeholder-slate-600 px-4 py-3 rounded-xl outline-none transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Send Query</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

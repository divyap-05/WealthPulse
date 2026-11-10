import React, { useEffect, useState } from 'react';
import { Bot, LoaderCircle, Send, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getDemoReply = (question) => {
  const normalized = question.toLowerCase();
  if (normalized.includes('budget')) {
    return 'Sample insight: compare each category’s spending with its monthly budget. If a category is close to its limit, review recent purchases and adjust the budget if your plans have changed.';
  }
  if (normalized.includes('sav') || normalized.includes('goal')) {
    return 'Sample insight: choose a regular amount to set aside and track it against a specific savings goal. Small, consistent contributions can make progress easier to see.';
  }
  if (normalized.includes('spend') || normalized.includes('expense') || normalized.includes('cash')) {
    return 'Sample insight: group expenses by category and compare the current month with earlier months. This can help you spot where spending changed and decide what to review.';
  }
  return 'This is a scripted demo response. In a personal account, the Money Coach can explain patterns using that account’s financial summary. No demo chat data is sent to an AI service.';
};

export const AIAssistantPage = () => {
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyNotice, setHistoryNotice] = useState('');
  const [historyLoading, setHistoryLoading] = useState(() => !user?.isDemo);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (isDemo) {
      setHistoryLoading(false);
      return undefined;
    }
    let active = true;
    apiRequest('/ai/chat/history')
      .then((response) => {
        if (!active) return;
        const exchanges = response.data.messages || [];
        setMessages(exchanges.flatMap((exchange) => [
          { role: 'user', text: exchange.question },
          { role: 'assistant', text: exchange.reply },
        ]));
      })
      .catch(() => {
        if (active) setHistoryNotice('Saved chat history could not be loaded. You can still ask a new question.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => { active = false; };
  }, [isDemo]);

  const handleClearHistory = async () => {
    if (!window.confirm('Clear your saved AI chat history? This cannot be undone.')) return;
    setClearingHistory(true);
    setHistoryNotice('');
    try {
      await apiRequest('/ai/chat/history', { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      setHistoryNotice(err.message || 'Could not clear chat history. Please try again.');
    } finally {
      setClearingHistory(false);
    }
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    const message = question.trim();
    if (!message || loading || (!isDemo && !consent)) return;
    setError('');
    setQuestion('');
    if (isDemo) {
      setMessages((current) => [
        ...current,
        { role: 'user', text: message },
        { role: 'assistant', text: getDemoReply(message) },
      ]);
      return;
    }
    setMessages((current) => [...current, { role: 'user', text: message }]);
    setLoading(true);
    try {
      const response = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setMessages((current) => {
        const updated = [...current];
        for (let index = updated.length - 1; index >= 0; index -= 1) {
          if (updated[index].role === 'user') {
            updated[index] = { ...updated[index], text: response.data.savedQuestion || message };
            break;
          }
        }
        return [...updated, { role: 'assistant', text: response.data.reply }];
      });
      setRemaining(response.data.usage.remaining);
      setHistoryNotice(response.data.historySaved ? '' : 'Your reply arrived, but this exchange could not be saved.');
    } catch (err) {
      setError(err.message || 'The AI coach could not answer right now.');
      setMessages((current) => current.slice(0, -1));
      setQuestion(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="AI Money Coach">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary dark:text-brand-secondary"><Sparkles className="h-6 w-6" /></div>
          <div><h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Money Coach</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ask about your spending, cash flow, budgets, or savings progress.</p></div>
        </div>

        {isDemo ? (
          <div className="mb-5 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Offline demo chat</div>
            Replies are scripted examples. Demo questions and account data are not sent to Gemini or another AI service.
          </div>
        ) : (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Privacy and free-tier notice</div>
          The backend sends your current question after masking common sensitive identifiers, along with a summary of your own account's monthly totals, categories, budgets, and goals. It does not send previous chat messages or transaction titles to Gemini. The latest 15 redacted question-and-answer exchanges are saved to your account; you can clear them at any time. Google may use free-tier content to improve its products and says not to submit sensitive, confidential, or personal information to unpaid services. Financial summaries may be sensitive, so continue only if you accept that policy. Do not include account numbers, addresses, or other details you would not share with Google. Read the <a className="underline" href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a>.
        </div>
        )}

        {!isDemo && (
          <label className="mb-5 flex items-start gap-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-violet-600" />
            <span>I understand that my redacted question and my own financial summary will be processed by Google's Gemini free tier.</span>
          </label>
        )}

        {!isDemo && messages.length > 0 && (
          <div className="mb-3 flex justify-end">
            <button type="button" onClick={handleClearHistory} disabled={clearingHistory || historyLoading} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-red-300">
              <Trash2 className="h-4 w-4" />{clearingHistory ? 'Clearing…' : 'Clear history'}
            </button>
          </div>
        )}

        <div className="mb-4 min-h-64 space-y-4 rounded-2xl border border-white/10 bg-white/70 p-4 dark:bg-white/5 sm:p-6" aria-live="polite">
          {historyLoading && <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading saved conversations…</div>}
          {!historyLoading && messages.length === 0 && <div className="flex min-h-56 flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400"><Bot className="mb-3 h-9 w-9 text-brand-primary" /><p className="font-semibold">{isDemo ? 'Try the offline Money Coach demo.' : 'Your account summary stays scoped to you.'}</p><p className="mt-1 text-sm">Try “How can I review my spending?”</p></div>}
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {item.role === 'assistant' && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary"><Bot className="h-4 w-4" /></span>}
              <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.role === 'user' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200'}`}>{item.text}</p>
              {item.role === 'user' && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"><UserRound className="h-4 w-4" /></span>}
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Reviewing your summary…</div>}
        </div>

        {(error || historyNotice) && <p role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error || historyNotice}</p>}
        <form onSubmit={submitQuestion} className="flex gap-2">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} placeholder={isDemo ? 'Try a sample finance question…' : 'Ask about your finances…'} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-primary focus:outline-none dark:border-white/10 dark:bg-[#191820] dark:text-white" />
          <button type="submit" disabled={(!isDemo && (!consent || historyLoading)) || !question.trim() || loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">Ask</span></button>
        </form>
        <p className="mt-2 text-right text-xs text-slate-500">{isDemo ? 'Offline sample replies · no AI requests' : remaining === null ? 'Up to 20 coach questions per day' : `${remaining} coach questions remaining today`} · Answers are informational, not professional financial advice.</p>
      </div>
    </AppLayout>
  );
};

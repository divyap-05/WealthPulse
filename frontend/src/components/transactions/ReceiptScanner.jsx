import React, { useState } from 'react';
import { AlertTriangle, FileText, LoaderCircle, ScanLine, ShieldCheck, Upload, X } from 'lucide-react';
import { extractDocumentText } from '../../services/aiDocuments';
import { apiRequest } from '../../services/api';

const DEMO_DRAFTS = [
  { title: 'Monthly salary', amount: 45000, type: 'income', date: '2026-11-01', categoryName: 'Salary', confidence: 0.98, possibleDuplicates: [] },
  { title: 'Fresh Market Groceries', amount: 1250, type: 'expense', date: '2026-11-03', categoryName: 'Food & Dining', confidence: 0.95, possibleDuplicates: [] },
  { title: 'Internet bill', amount: 799, type: 'expense', date: '2026-11-05', categoryName: 'Bills & Utilities', confidence: 0.92, possibleDuplicates: [{ title: 'Internet bill', amount: 799, date: '2026-11-05' }] },
];

const DEMO_STATEMENT_TEXT = `Date       Description             Debit     Credit\n01 Nov     Monthly salary                    45000.00\n03 Nov     Fresh Market Groceries  1250.00\n05 Nov     Internet bill             799.00`;

export const ReceiptScanner = ({ onClose, onAddDrafts, isDemo = false }) => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [selectedDrafts, setSelectedDrafts] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setText('');
    setDrafts([]);
    setSelectedDrafts({});
    setImportResults(null);
    setError('');
    setBusy(true);
    setProgress(0);
    try {
      const extracted = await extractDocumentText(selected, (value) => setProgress(value));
      setText(extracted);
      if (extracted.length < 10) setError('No readable text was found. Try a clearer image or enter the transaction manually.');
    } catch (err) {
      setError(err.message || 'Could not read that document.');
    } finally {
      setBusy(false);
    }
  };

  const handleScan = async () => {
    setError('');
    if (isDemo) {
      const demoDrafts = DEMO_DRAFTS.map((draft, scanId) => ({ ...draft, scanId }));
      setText(DEMO_STATEMENT_TEXT);
      setDrafts(demoDrafts);
      setSelectedDrafts(Object.fromEntries(demoDrafts.map((draft) => [draft.scanId, !draft.possibleDuplicates.length])));
      setImportResults(null);
      return;
    }
    setBusy(true);
    try {
      const response = await apiRequest('/ai/receipt/scan', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const extractedDrafts = (response.data.drafts || []).map((draft, index) => ({ ...draft, scanId: index }));
      setDrafts(extractedDrafts);
      setSelectedDrafts(Object.fromEntries(extractedDrafts.map((draft) => [draft.scanId, !draft.possibleDuplicates?.length])));
      setImportResults(null);
    } catch (err) {
      setError(err.message || 'The receipt scan failed. You can enter the transaction manually.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddSelected = async () => {
    const selected = drafts.filter((draft) => selectedDrafts[draft.scanId] && !['added', 'preview'].includes(importResults?.[draft.scanId]?.status));
    if (!selected.length) return;
    if (isDemo) {
      setImportResults((current) => ({
        ...current,
        ...Object.fromEntries(selected.map((draft) => [draft.scanId, { status: 'preview' }])),
      }));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const results = await onAddDrafts(selected);
      setImportResults((current) => ({ ...current, ...Object.fromEntries(results.map(({ scanId, ...result }) => [scanId, result])) }));
    } catch (err) {
      setError(err.message || 'Some transactions could not be added. You can retry the selected entries.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="receipt-scanner-title">
      <button type="button" className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close scanner" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl dark:bg-[#191820] dark:text-white sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="receipt-scanner-title" className="text-xl font-bold">AI receipt scanner</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Scans every transaction entry in a statement or list. Review each draft before adding it to your ledger.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isDemo ? (
          <div className="mb-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Offline scanner demo</div>
            Explore a sample statement and transaction list. No file is uploaded, no AI request is sent, and entries are not saved to the demo account.
          </div>
        ) : (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Privacy and free-tier notice</div>
          The document is read in your browser; the original file is not uploaded. Potential account, card, tax ID, phone, email, UPI, and labeled address details are masked locally and again on the backend. OCR can miss information, so review and remove personal details from the editable text before continuing. Only that text is sent to Google Gemini. Google may use free-tier content to improve its products and says not to submit sensitive, confidential, or personal information to unpaid services. Receipt details may be sensitive, so continue only if you accept that policy. See <a className="underline" href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a>.
        </div>
        )}

        {isDemo ? (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600 dark:border-white/20 dark:bg-white/5 dark:text-slate-300">
            <FileText className="h-4 w-4" /> Built-in sample statement · no upload needed
          </div>
        ) : (
          <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-700 hover:border-brand-primary dark:border-white/20 dark:bg-white/5 dark:text-slate-200">
            <Upload className="h-4 w-4" />
            <span>{file ? file.name : 'Choose a receipt, bill, or PDF (max 10 MB)'}</span>
            <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleFile} />
          </label>
        )}

        {busy && (
          <div className="mb-3 flex items-center gap-2 text-sm text-brand-primary" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {text ? 'Reading transaction details…' : `Extracting text locally… ${Math.round(progress * 100)}%`}
          </div>
        )}

        {text && (
          <div className="mb-4">
            <label htmlFor="receipt-ocr-text" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isDemo ? 'Sample statement text (offline preview)' : 'Sanitized text to be sent'}</label>
            <textarea id="receipt-ocr-text" rows={6} maxLength={12000} readOnly={isDemo} value={text} onChange={(event) => { setText(event.target.value); setDrafts([]); }} className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 focus:border-brand-primary focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-slate-200" />
          </div>
        )}

        {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        {!isDemo && (
          <label className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-violet-600" />
            <span>I reviewed the redacted text and agree to send it to Google Gemini's free API tier. I understand I should not include sensitive details.</span>
          </label>
        )}

        {drafts.length > 0 && (
          <div className="mb-4 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-brand-primary" />{drafts.length} transaction {drafts.length === 1 ? 'entry' : 'entries'} found</div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {drafts.map((draft, index) => (
                <div key={`${draft.date}-${draft.amount}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-black/20">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 items-start gap-2 font-semibold">
                      <input type="checkbox" checked={Boolean(selectedDrafts[draft.scanId])} disabled={['added', 'preview'].includes(importResults?.[draft.scanId]?.status)} onChange={(event) => setSelectedDrafts((current) => ({ ...current, [draft.scanId]: event.target.checked }))} className="mt-1 accent-violet-600" />
                      <span>{index + 1}. {draft.title}</span>
                    </label>
                    <span className="shrink-0 font-bold">{draft.amount == null ? 'Amount needs review' : `₹${Number(draft.amount).toFixed(2)}`}</span>
                  </div>
                  <div className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{draft.type} · {draft.date || 'Date not found'} · {draft.categoryName || 'No category match'} · confidence {draft.confidence == null ? 'n/a' : `${Math.round(draft.confidence * 100)}%`}{draft.needsReview ? ' · check details' : ''}</div>
                  {draft.possibleDuplicates?.length > 0 && <p className="mt-1 flex items-start gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" />Possible duplicate: {draft.possibleDuplicates.map((item) => item.title).join(', ')}</p>}
                  {importResults?.[draft.scanId] ? <p className={`mt-1 text-xs font-bold ${importResults[draft.scanId].status === 'added' ? 'text-emerald-600 dark:text-emerald-300' : importResults[draft.scanId].status === 'preview' ? 'text-brand-primary dark:text-brand-secondary' : 'text-red-600 dark:text-red-300'}`}>{importResults[draft.scanId].status === 'added' ? 'Added to transactions' : importResults[draft.scanId].status === 'preview' ? 'Sample preview only · not saved' : `Not added: ${importResults[draft.scanId].message}`}</p> : importResults && !selectedDrafts[draft.scanId] && <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">{draft.possibleDuplicates?.length ? 'Skipped as a possible duplicate' : 'Not selected'}</p>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">Possible duplicates start unchecked. {isDemo ? 'Select entries to preview the sample import; nothing is saved.' : 'Choose which entries to add; all selected entries are processed together.'} Added entries are marked above.</p>
            <button type="button" onClick={handleAddSelected} disabled={busy || !drafts.some((draft) => selectedDrafts[draft.scanId] && !['added', 'preview'].includes(importResults?.[draft.scanId]?.status))} className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Adding transactions…' : `${isDemo ? 'Preview' : 'Add'} ${drafts.filter((draft) => selectedDrafts[draft.scanId] && !['added', 'preview'].includes(importResults?.[draft.scanId]?.status)).length} selected transactions`}
            </button>
          </div>
        )}

        {drafts.length === 0 && (
          <button type="button" onClick={handleScan} disabled={(!isDemo && (!consent || text.trim().length < 10)) || busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {isDemo ? 'Load sample transactions' : 'Extract transaction fields'}
          </button>
        )}
      </div>
    </div>
  );
};

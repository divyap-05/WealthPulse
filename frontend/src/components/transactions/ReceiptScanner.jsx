import React, { useState } from 'react';
import { AlertTriangle, FileText, LoaderCircle, ScanLine, ShieldCheck, Upload, X } from 'lucide-react';
import { extractDocumentText } from '../../services/aiDocuments';
import { apiRequest } from '../../services/api';

export const ReceiptScanner = ({ onClose, onUseDraft }) => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setText('');
    setDraft(null);
    setDuplicates([]);
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
    setBusy(true);
    try {
      const response = await apiRequest('/ai/receipt/scan', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setDraft(response.data.draft);
      setDuplicates(response.data.possibleDuplicates || []);
    } catch (err) {
      setError(err.message || 'The receipt scan failed. You can enter the transaction manually.');
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
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review the extracted details before adding anything to your ledger.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Privacy and free-tier notice</div>
          The document is read in your browser; the original file is not uploaded. Potential account, card, tax ID, phone, email, UPI, and labeled address details are masked locally and again on the backend. OCR can miss information, so review and remove personal details from the editable text before continuing. Only that text is sent to Google Gemini. Google may use free-tier content to improve its products and says not to submit sensitive, confidential, or personal information to unpaid services. Receipt details may be sensitive, so continue only if you accept that policy. See <a className="underline" href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API terms</a>.
        </div>

        <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-700 hover:border-brand-primary dark:border-white/20 dark:bg-white/5 dark:text-slate-200">
          <Upload className="h-4 w-4" />
          <span>{file ? file.name : 'Choose a receipt, bill, or PDF (max 10 MB)'}</span>
          <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={handleFile} />
        </label>

        {busy && (
          <div className="mb-3 flex items-center gap-2 text-sm text-brand-primary" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {text ? 'Reading transaction details…' : `Extracting text locally… ${Math.round(progress * 100)}%`}
          </div>
        )}

        {text && (
          <div className="mb-4">
            <label htmlFor="receipt-ocr-text" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sanitized text to be sent</label>
            <textarea id="receipt-ocr-text" rows={6} maxLength={12000} value={text} onChange={(event) => { setText(event.target.value); setDraft(null); setDuplicates([]); }} className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 focus:border-brand-primary focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-slate-200" />
          </div>
        )}

        {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

        <label className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-violet-600" />
          <span>I reviewed the redacted text and agree to send it to Google Gemini's free API tier. I understand I should not include sensitive details.</span>
        </label>

        {draft && (
          <div className="mb-4 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-brand-primary" />Extracted draft (please verify)</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-500">Merchant / title</span><span className="font-medium">{draft.title}</span>
              <span className="text-slate-500">Amount</span><span className="font-medium">₹{Number(draft.amount).toFixed(2)}</span>
              <span className="text-slate-500">Type and date</span><span className="font-medium capitalize">{draft.type} · {draft.date || 'Date not found'}</span>
              <span className="text-slate-500">Category</span><span className="font-medium">{draft.categoryName || 'Choose in the transaction form'}</span>
              <span className="text-slate-500">Extraction confidence</span><span className="font-medium">{draft.confidence == null ? 'Not provided' : `${Math.round(draft.confidence * 100)}%`}</span>
            </div>
            {duplicates.length > 0 && <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" />Possible existing match: {duplicates.map((item) => item.title).join(', ')}. You will need to confirm before saving.</p>}
            <button type="button" onClick={() => onUseDraft(draft, duplicates)} className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600">Review in transaction form</button>
          </div>
        )}

        {!draft && (
          <button type="button" onClick={handleScan} disabled={!consent || text.trim().length < 10 || busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Extract transaction fields
          </button>
        )}
      </div>
    </div>
  );
};

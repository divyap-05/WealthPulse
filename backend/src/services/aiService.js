import { config } from '../config/env.js';

const MODEL = 'gemini-3.1-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const keepDocumentEnding = (text, maxCharacters = 12000) => {
  if (text.length <= maxCharacters) return text;
  const marker = '\n[Middle of document omitted; ending follows]\n';
  const contentLength = maxCharacters - marker.length;
  const firstPart = Math.floor(contentLength * 0.65);
  return `${text.slice(0, firstPart).trimEnd()}${marker}${text.slice(-(contentLength - firstPart)).trimStart()}`;
};

const redactText = (value) => String(value || '')
  .replace(/\b(?:account|a\/c)\s*(?:no\.?|number|#)?\s*[:=-]?\s*[0-9x*][0-9x*\s-]{5,24}/gi, '[REDACTED ACCOUNT]')
  .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, '[REDACTED IFSC]')
  .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED ID]')
  .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[REDACTED ID]')
  .replace(/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED CARD]')
  .replace(/\b(?:\+?91[ -]?)?[6-9]\d{9}\b/g, '[REDACTED PHONE]')
  .replace(/\b[\w.+-]{1,64}@[\w.-]{2,}\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]')
  .replace(/\b[\w.-]{2,}@[\w.-]{2,}\b/gi, '[REDACTED UPI]')
  .replace(/\b(?:(?:billing|shipping|home|office|customer)\s+)?address\s*[:=-]?[^\r\n]*/gi, '[REDACTED ADDRESS]')
  .replace(/\b(?:customer name|account holder|card holder|cardholder|name)\s*[:=-]\s*[^\r\n]*/gi, '[REDACTED NAME]')
  .replace(/\b(?:transaction|reference|ref)\s*(?:id|no\.?|number|#)\s*[:=-]?\s*[A-Z0-9-]{6,}\b/gi, '[REDACTED REFERENCE]');

export const redactSensitiveText = (value) => keepDocumentEnding(redactText(value));

export const parseModelJson = (text) => {
  const normalized = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(normalized);
};

export const assertGeminiConfigured = () => {
  if (!config.geminiApiKey) {
    const error = new Error('The AI features are not configured yet. Add GEMINI_API_KEY to the backend environment.');
    error.statusCode = 503;
    error.isOperational = true;
    throw error;
  }
};

export const requestGemini = async (prompt, { json = false, maxOutputTokens = 500 } = {}) => {
  assertGeminiConfigured();

  let response;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.geminiApiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens,
            ...(json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      });
    } catch (cause) {
      const error = new Error(cause.name === 'AbortError' ? 'The AI request took too long. Please try again.' : 'The AI service could not be reached. Please try again.');
      error.statusCode = 503;
      error.isOperational = true;
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 503 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      continue;
    }
    break;
  }

  if (response.status === 429) {
    const error = new Error('The free AI quota is temporarily unavailable. Please try again later.');
    error.statusCode = 503;
    error.isOperational = true;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(response.status === 403
      ? 'The AI service rejected its backend configuration. Check the backend API key and free-tier availability.'
      : 'The AI service could not process this request. Please try again.');
    error.statusCode = 502;
    error.isOperational = true;
    throw error;
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) {
    const error = new Error('The AI service returned an empty response. Please try again.');
    error.statusCode = 502;
    error.isOperational = true;
    throw error;
  }
  return text;
};

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = ({ className = '', ...inputProps }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary dark:text-slate-400 dark:hover:text-brand-secondary"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

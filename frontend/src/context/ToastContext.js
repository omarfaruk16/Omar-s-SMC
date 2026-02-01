import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const normalizeError = useCallback((input, fallback = 'Something went wrong.') => {
    if (!input) return fallback;
    if (typeof input === 'string') return input;
    if (input.response?.data) {
      const data = input.response.data;
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.error) return data.error;
      if (data.message) return data.message;
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const value = data[firstKey];
        if (Array.isArray(value) && value.length > 0) return value[0];
        if (typeof value === 'string') return value;
      }
    }
    if (input.message) return input.message;
    return fallback;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', ttl = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    if (ttl > 0) setTimeout(() => remove(id), ttl);
  }, [remove]);

  const api = {
    success: (msg, ttl) => push(msg, 'success', ttl),
    error: (msg, ttl) => push(normalizeError(msg), 'error', ttl),
    errorFrom: (err, fallback, ttl) => push(normalizeError(err, fallback), 'error', ttl),
    info: (msg, ttl) => push(msg, 'info', ttl),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded shadow text-white ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
            <div className="flex items-start">
              <div className="flex-1 pr-3">{t.message}</div>
              <button onClick={() => remove(t.id)} className="opacity-80 hover:opacity-100">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};


import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

const STYLES = {
  success: 'bg-emerald-950/90 border-emerald-800 text-emerald-300',
  error: 'bg-red-950/90 border-red-800 text-red-300',
  info: 'bg-slate-800/95 border-slate-700 text-slate-200',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type) => {
    const id = ++toastId;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  // Стабильный объект-API: success / error / info
  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto cursor-pointer px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md text-sm font-medium min-w-[240px] max-w-sm ${STYLES[t.type] || STYLES.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

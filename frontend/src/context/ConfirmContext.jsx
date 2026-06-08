import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// =============================================================================
// Контекст модалок подтверждения.
//
// useConfirm() возвращает функцию confirm(options) → Promise<boolean>:
//   const ok = await confirm({ title, message, confirmText, danger });
// Промис резолвится true (подтвердил) / false (отмена или Escape). Это удобнее
// нативного window.confirm и оформлено в стиле сайта. Используется перед
// необратимыми действиями (удаление рецензии, аккаунта).
// =============================================================================
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmText, danger }
  const resolver = useRef(null);

  // Возвращает Promise<boolean>: confirm({...}) -> true/false
  const confirm = useCallback((options) => {
    setState(options || {});
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    setState(null);
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  };

  // Закрытие по Escape (= отмена) пока окно открыто
  useEffect(() => {
    if (!state) return;
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              {state.title || 'Подтвердите действие'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">{state.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => close(false)}
                className="text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                onClick={() => close(true)}
                className={`px-5 py-2 rounded-xl font-bold text-white transition ${
                  state.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {state.confirmText || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);

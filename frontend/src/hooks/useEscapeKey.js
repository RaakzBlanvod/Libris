import { useEffect } from 'react';

// =============================================================================
// Хук: вызвать handler при нажатии Escape (закрытие модалок).
//
// Зачем файл: один и тот же useEffect со слушателем keydown→Escape повторялся
// в каждой модалке (EditProfileModal, EditReviewModal). Вынесено в хук, чтобы
// не дублировать подписку/отписку на событие.
//
// handler желательно оборачивать в useCallback на стороне вызова, иначе эффект
// будет переподписываться на каждый рендер (для модалок это некритично).
// =============================================================================

export function useEscapeKey(handler) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler]);
}

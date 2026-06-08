import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

const MIN = 1;
const MAX = 10;

// Поле оценки: «−  [число]  +».
// Кнопки меняют значение мышкой, число можно очистить и ввести вручную (1..10).
export default function RatingStepper({ value, onChange }) {
  // Локальный текст нужен, чтобы поле можно было временно очистить во время ввода.
  const [text, setText] = useState(String(value ?? MIN));

  // Если значение поменяли извне (кнопками) — подтягиваем в поле.
  useEffect(() => {
    setText(String(value ?? MIN));
  }, [value]);

  const dec = () => onChange(Math.max(MIN, (value || MIN) - 1));
  const inc = () => onChange(Math.min(MAX, (value || MIN) + 1));

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // только цифры
    if (raw === '') {
      setText(''); // разрешаем очистить поле во время ввода
      return;
    }
    let n = parseInt(raw, 10);
    if (n < MIN) {
      setText('');
      return;
    }
    if (n > MAX) n = MAX; // не даём ввести больше 10
    setText(String(n));
    onChange(n);
  };

  // На выходе из поля гарантируем валидное значение (пустое — возвращаем текущее).
  const handleBlur = () => {
    if (text === '') {
      setText(String(value ?? MIN));
    }
  };

  const btn =
    'flex items-center justify-center w-9 rounded-lg bg-slate-800 text-slate-300 ' +
    'hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-stretch gap-1">
      <button type="button" onClick={dec} disabled={(value || MIN) <= MIN} aria-label="Уменьшить" className={btn}>
        <Minus size={16} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className="flex-1 min-w-0 bg-slate-950 p-2 rounded-lg border border-slate-700 text-white text-center outline-none focus:border-blue-500"
      />
      <button type="button" onClick={inc} disabled={(value || MIN) >= MAX} aria-label="Увеличить" className={btn}>
        <Plus size={16} />
      </button>
    </div>
  );
}

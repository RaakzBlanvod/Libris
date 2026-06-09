import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingStepper from '@/components/RatingStepper/RatingStepper';

// Обёртка с состоянием: RatingStepper контролируемый, поэтому для проверки
// кликов нужен родитель, который реально меняет value.
function Controlled({ initial = 5 }) {
  const [v, setV] = useState(initial);
  return <RatingStepper value={v} onChange={setV} />;
}

describe('RatingStepper', () => {
  it('показывает текущее значение', () => {
    render(<RatingStepper value={7} onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('7');
  });

  it('«+» увеличивает, «−» уменьшает', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={5} />);
    await user.click(screen.getByLabelText('Увеличить'));
    expect(screen.getByRole('textbox')).toHaveValue('6');
    await user.click(screen.getByLabelText('Уменьшить'));
    expect(screen.getByRole('textbox')).toHaveValue('5');
  });

  it('на 10 кнопка «+» заблокирована', () => {
    render(<RatingStepper value={10} onChange={() => {}} />);
    expect(screen.getByLabelText('Увеличить')).toBeDisabled();
  });

  it('на 1 кнопка «−» заблокирована', () => {
    render(<RatingStepper value={1} onChange={() => {}} />);
    expect(screen.getByLabelText('Уменьшить')).toBeDisabled();
  });

  it('ручной ввод больше 10 обрезается до 10', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingStepper value={5} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '12');
    expect(onChange).toHaveBeenLastCalledWith(10);
  });
});

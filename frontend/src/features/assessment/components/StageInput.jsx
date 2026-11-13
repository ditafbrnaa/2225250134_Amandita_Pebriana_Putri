import { useRef } from 'react';

const KEYPAD = ['∪', '∩', 'ᶜ', '−', '+', '=', '(', ')', 'n(', 'x'];

function EquationInput({ value = '', onChange, disabled, id }) {
  const ref = useRef(null);
  const insert = (sym) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + sym + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + sym.length, start + sym.length);
    });
  };
  return (
    <div className="space-y-2">
      <input
        id={id}
        ref={ref}
        className="input font-math text-lg"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Contoh: 30 = 21 + x"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="flex flex-wrap gap-1.5" aria-label="Papan simbol">
        {KEYPAD.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => insert(k)}
            className="springy min-h-10 min-w-10 rounded-xl border-2 border-line bg-white px-2 font-math text-lg font-bold active:bg-lavender"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Isian satu tahap jawaban sesuai tipe pada instrumen. */
export default function StageInput({ stage, value, onChange, disabled, id }) {
  switch (stage.input) {
    case 'numeric':
      return (
        <input
          id={id}
          className="input w-40 text-center text-xl font-bold"
          inputMode="decimal"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,-]/g, ''))}
          placeholder="angka"
        />
      );
    case 'equation':
      return <EquationInput id={id} value={value ?? ''} onChange={onChange} disabled={disabled} />;
    case 'choice':
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {stage.options.map((opt) => (
            <label key={opt} className={`btn border-2 ${value === opt ? 'border-line bg-butter text-ink' : 'border-line bg-white'}`}>
              <input type="radio" className="sr-only" name={id} checked={value === opt} disabled={disabled} onChange={() => onChange(opt)} />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'choice+text': {
      const v = value ?? { choice: '', text: '' };
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {stage.options.map((opt) => (
              <label key={opt} className={`btn border-2 ${v.choice === opt ? 'border-line bg-butter text-ink' : 'border-line bg-white'}`}>
                <input type="radio" className="sr-only" name={id} checked={v.choice === opt} disabled={disabled} onChange={() => onChange({ ...v, choice: opt })} />
                {opt}
              </label>
            ))}
          </div>
          <textarea className="input min-h-20" value={v.text} disabled={disabled} onChange={(e) => onChange({ ...v, text: e.target.value })} placeholder="Jelaskan alasanmu…" />
        </div>
      );
    }
    default:
      return (
        <textarea id={id} className="input min-h-24" value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="Tulis jawabanmu…" />
      );
  }
}

export const isAnswered = (v) =>
  v !== undefined && v !== null && (typeof v === 'object' ? Boolean(v.choice) || Boolean(v.text?.trim()) : String(v).trim() !== '');

import { motion, AnimatePresence } from 'motion/react';
import { OPERATIONS } from '../lib/expression.js';
import symbols from '@/data/symbols.json';

const MNEMONIC = Object.fromEntries(symbols.filter((s) => s.expr).map((s) => [s.expr, s.tip]));

/**
 * Bilah tombol operasi himpunan. Simbol SELALU ditampilkan bersama kata (mengatasi ∩/∪ tertukar).
 * @param {{active:string|null, onSelect:(op:object|null)=>void, ops?:string[], showMnemonic?:boolean}} props
 */
export default function OperationBar({ active, onSelect, ops, showMnemonic = true }) {
  const list = ops ? OPERATIONS.filter((o) => ops.includes(o.id)) : OPERATIONS;
  const activeOp = OPERATIONS.find((o) => o.id === active);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Operasi himpunan">
        {list.map((op) => {
          const isActive = op.id === active;
          return (
            <motion.button
              key={op.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(isActive ? null : op)}
              aria-pressed={isActive}
              className={`relative min-h-11 rounded-xl border-2 px-3 py-1.5 text-left transition-colors ${
                isActive ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white text-ink hover:border-ink/40'
              }`}
            >
              <span className="block font-math text-lg leading-tight">{op.label}</span>
              <span className={`block text-[11px] font-semibold ${isActive ? 'text-white/80' : 'text-ink/60'}`}>{op.word}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {showMnemonic && activeOp && (
          <motion.div
            key={activeOp.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            <b className="font-math">{activeOp.label}</b> ({activeOp.word}): {activeOp.hint}
            {MNEMONIC[activeOp.id] && <span className="block text-amber-800/80">💡 {MNEMONIC[activeOp.id]}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

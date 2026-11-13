import { motion, AnimatePresence } from 'motion/react';
import { OPERATIONS } from '../lib/expression.js';
import { buttonHover, buttonTap, tapSpring } from '../lib/motion.js';
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
              whileHover={buttonHover}
              whileTap={buttonTap}
              transition={tapSpring}
              onClick={() => onSelect(isActive ? null : op)}
              aria-pressed={isActive}
              className={`relative min-h-11 rounded-2xl border-2 px-3 py-1.5 text-left transition-colors ${
                isActive ? 'border-line bg-linear-to-br from-butter to-blush text-ink cartoon-sm' : 'border-line bg-white text-ink'
              }`}
            >
              <span className="block font-math text-lg leading-tight">{op.label}</span>
              <span className={`block text-[11px] font-semibold ${isActive ? 'text-brand-dark/80' : 'text-ink/60'}`}>{op.word}</span>
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
            className="rounded-2xl border-2 border-line bg-peach px-3 py-2 text-sm text-amber-950"
          >
            <b className="font-math">{activeOp.label}</b> ({activeOp.word}): {activeOp.hint}
            {MNEMONIC[activeOp.id] && <span className="block text-amber-800/80">💡 {MNEMONIC[activeOp.id]}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

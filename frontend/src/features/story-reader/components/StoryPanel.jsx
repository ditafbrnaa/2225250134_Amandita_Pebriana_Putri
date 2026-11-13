import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { tokenizeKeywords, chunkStory } from '../lib/keywordTokenizer.js';

function Sentence({ text, keywordsOn, activeId, onKeyword }) {
  const segments = useMemo(() => (keywordsOn ? tokenizeKeywords(text) : [{ text }]), [text, keywordsOn]);
  return segments.map((seg, i) =>
    seg.keyword ? (
      <mark
        key={i}
        className="kw"
        role="button"
        tabIndex={0}
        aria-pressed={activeId === `${seg.keyword.id}-${i}`}
        title={seg.keyword.hint}
        onClick={() => onKeyword?.(seg.keyword, `${seg.keyword.id}-${i}`)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onKeyword?.(seg.keyword, `${seg.keyword.id}-${i}`))}
      >
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

/**
 * Pembaca soal cerita terintegrasi.
 * - keywordsOn: sorot kata kunci; ketuk → onKeyword(entry) untuk menyalakan daerah Venn (linked highlighting)
 * - chunked: tampilkan potongan informasi satu per satu (segmenting)
 */
export default function StoryPanel({ text, question, keywordsOn = true, chunked = false, onKeyword, className = '' }) {
  const chunks = useMemo(() => (chunked ? chunkStory(text) : [text]), [text, chunked]);
  const [shown, setShown] = useState(chunked ? 1 : chunks.length);
  const [activeId, setActiveId] = useState(null);
  const [tip, setTip] = useState(null);

  const handleKeyword = (entry, id) => {
    const off = activeId === id;
    setActiveId(off ? null : id);
    setTip(off ? null : entry);
    onKeyword?.(off ? null : entry);
  };

  const allShown = shown >= chunks.length;

  return (
    <div className={`card space-y-2 text-[1.05rem] leading-relaxed ${className}`}>
      {chunked ? (
        <ol className="space-y-1.5">
          <AnimatePresence initial={false}>
            {chunks.slice(0, shown).map((c, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: i === shown - 1 ? 1 : 0.7, x: 0 }}
                className="flex gap-2"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-800">{i + 1}</span>
                <span>
                  <Sentence text={c} keywordsOn={keywordsOn} activeId={activeId} onKeyword={handleKeyword} />
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      ) : (
        <p>
          <Sentence text={text} keywordsOn={keywordsOn} activeId={activeId} onKeyword={handleKeyword} />
        </p>
      )}

      {chunked && !allShown && (
        <button type="button" className="btn btn-secondary" onClick={() => setShown((n) => n + 1)}>
          Informasi berikutnya ↓
        </button>
      )}

      {question && allShown && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-ink/5 px-3 py-2 font-semibold">
          <Sentence text={question} keywordsOn={keywordsOn} activeId={activeId} onKeyword={handleKeyword} />
        </motion.p>
      )}

      <AnimatePresence>
        {keywordsOn && tip && (
          <motion.p
            key={tip.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border-2 border-line bg-butter px-3 py-2 text-sm text-amber-900"
            role="status"
          >
            🔑 <b>{tip.label}:</b> {tip.hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

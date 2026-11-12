import VennCanvas from '@/features/venn/components/VennCanvas.jsx';
import StoryPanel from '@/features/story-reader/components/StoryPanel.jsx';
import StageInput from './StageInput.jsx';
import { NEUTRAL_TAGS } from '../lib/examGuard.js';

const SCRATCH_ORDER = [1, 3, 2, 0];

/**
 * Satu butir soal dalam mode ujian. Teks soal, kanvas coretan, dan isian tahap berada
 * dalam satu layar (integrasi spasial), tetapi TANPA bantuan apa pun (scaffolds semua false).
 */
export default function ExamItem({ item, answers, scratch = {}, onAnswer, onScratch, disabled, scaffolds }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:items-start">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Soal {item.no}</p>
        </div>
        <StoryPanel text={item.stem} question={item.question} keywordsOn={scaffolds.keywords} chunked={scaffolds.chunking} />

        <details className="card p-3" open>
          <summary className="cursor-pointer text-sm font-bold">✏️ Kertas coretan Diagram Venn (tidak dinilai)</summary>
          <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
            <VennCanvas
              labels={{ A: 'A', B: 'B' }}
              counts={scratch}
              regionTags={NEUTRAL_TAGS}
              interactive={false}
              dimOthers={false}
              title="Kertas coretan Diagram Venn"
            />
            <div className="space-y-1.5">
              {SCRATCH_ORDER.map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-sm font-bold">
                  {NEUTRAL_TAGS[m]}
                  <input
                    className="input w-16 px-1 text-center"
                    inputMode="numeric"
                    value={scratch[m] ?? ''}
                    disabled={disabled}
                    onChange={(e) => onScratch(m, e.target.value.replace(/[^0-9]/g, ''))}
                    aria-label={`Coretan daerah ${NEUTRAL_TAGS[m]}`}
                  />
                </label>
              ))}
            </div>
          </div>
        </details>
      </div>

      <div className="card space-y-4">
        {item.stages.map((stage) => {
          const key = `${item.no}.${stage.no}`;
          return (
            <div key={key}>
              <label className="label" htmlFor={`st-${key}`}>
                Langkah {stage.no}: {stage.prompt}
              </label>
              <StageInput id={`st-${key}`} stage={stage} value={answers[key]} onChange={(v) => onAnswer(key, v)} disabled={disabled} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

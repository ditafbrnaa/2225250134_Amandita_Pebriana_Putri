// Aturan buka-kunci alur belajar: Pretest → Modul 1..6 (berurutan) → Posttest.
export function computeGates({ attempts, progress, unlockAll }, modules) {
  const preDone = attempts.pre?.status === 'submitted';
  const postDone = attempts.post?.status === 'submitted';
  const doneCount = modules.filter((m) => progress[m.id]?.done).length;
  const allModulesDone = doneCount === modules.length;
  const moduleOpen = (i) => unlockAll || (preDone && (i === 0 || Boolean(progress[modules[i - 1].id]?.done)));
  return {
    preDone,
    postDone,
    doneCount,
    allModulesDone,
    moduleOpen,
    postOpen: !postDone && (unlockAll || (preDone && allModulesDone)),
  };
}

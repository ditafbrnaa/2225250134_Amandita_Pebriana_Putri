import { Link, Navigate, useParams } from 'react-router-dom';
import modules from '@/data/modules.json';
import ModuleRunner from '@/features/learn/components/ModuleRunner.jsx';
import { useAppStore } from '@/store/useAppStore.js';
import { computeGates } from '@/utils/gating.js';

export default function ModulePage() {
  const { id } = useParams();
  const state = useAppStore();
  const index = modules.findIndex((m) => m.id === id);
  if (index < 0) return <Navigate to="/" replace />;
  if (!state.profile) return <Navigate to="/masuk" replace />;
  if (!computeGates(state, modules).moduleOpen(index)) return <Navigate to="/" replace />;
  const module = modules[index];

  return (
    <div className="space-y-3">
      <Link to="/" className="text-sm font-semibold text-violet-700">
        ← Peta Belajar
      </Link>
      <h1 className="text-2xl font-extrabold">
        Modul {index + 1}: {module.title}
      </h1>
      <ModuleRunner key={module.id} module={module} moduleIndex={index} />
    </div>
  );
}

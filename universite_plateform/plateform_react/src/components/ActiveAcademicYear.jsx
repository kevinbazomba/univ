import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { anneeApi } from '../services';

const ActiveAcademicYear = ({ compact = false, dark = false }) => {
  const [annee, setAnnee] = useState(null);

  useEffect(() => {
    anneeApi.getAll()
      .then((response) => setAnnee(response.data.find((item) => item.est_active) || null))
      .catch(() => setAnnee(null));
  }, []);

  return (
    <div
      title="Année académique active"
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${
        dark
          ? 'border-white/15 bg-white/10 text-white'
          : 'border-indigo-100 bg-indigo-50 text-indigo-800'
      }`}
    >
      <CalendarDays className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {!compact && <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-indigo-200' : 'text-indigo-500'}`}>Année active</p>}
        <p className="truncate text-xs font-bold">{annee?.nom || 'Non définie'}</p>
      </div>
    </div>
  );
};

export default ActiveAcademicYear;

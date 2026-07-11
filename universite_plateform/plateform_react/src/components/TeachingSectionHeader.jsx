import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import ActiveAcademicYear from './ActiveAcademicYear';

const TeachingSectionHeader = ({ title, description, icon: Icon = GraduationCap }) => (
  <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-7 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
    <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><Icon className="h-7 w-7" /></div>
        <div>
          <Link to="/enseignements" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Enseignements</Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-indigo-100/70">{description}</p>
        </div>
      </div>
      <ActiveAcademicYear dark />
    </div>
  </section>
);

export default TeachingSectionHeader;

import { useState } from 'react';
import { GraduationCap, School } from 'lucide-react';
import { Toaster } from 'sonner';
import ConnexionCorpsAcademique from './connexion/ConnexionCorpsAcademique';
import ConnexionEtudiant from './connexion/ConnexionEtudiant';

const Login = () => {
  const [accountType, setAccountType] = useState('academique');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_25%_15%,rgba(125,211,252,0.38),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617,#082f49_48%,#0c4a6e)] px-4 py-10 text-slate-900">
      <Toaster position="top-right" richColors />

      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="px-7 pb-3 pt-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="mt-1 text-sm text-gray-500">Choisissez votre espace</p>
        </div>

        <div className="mx-7 mt-3 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setAccountType('academique')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              accountType === 'academique'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Corps académique
          </button>
          <button
            type="button"
            onClick={() => setAccountType('etudiant')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              accountType === 'etudiant'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <School className="h-4 w-4" />
            Étudiant
          </button>
        </div>

        <div className="p-7">
          {accountType === 'academique'
            ? <ConnexionCorpsAcademique />
            : <ConnexionEtudiant />}
        </div>
      </section>
    </main>
  );
};

export default Login;

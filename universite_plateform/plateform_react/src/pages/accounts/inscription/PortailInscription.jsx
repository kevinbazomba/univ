import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BriefcaseBusiness, GraduationCap, School,
  UserCog, UsersRound,
} from 'lucide-react';
import Register from '../Register';
import ProfesseurForm from '../../enseignements/Professeurs/ProfesseurForm';
import FormulaireEtudiant from '../../etudiants/FormulaireEtudiant';
import { professeurService } from '../../../services/enseignements';

const PortailInscription = () => {
  const [view, setView] = useState('home');
  const [options, setOptions] = useState({ facultes: [], grades: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openTeacherRegistration = async () => {
    setLoading(true);
    try {
      const data = await professeurService.getRegistrationOptions();
      setOptions(data);
      setView('enseignant');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'agent') {
    return <Register onBack={() => setView('academique')} />;
  }

  if (view === 'etudiant') {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_25%_15%,rgba(125,211,252,0.38),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617,#082f49_48%,#0c4a6e)] py-8">
        <FormulaireEtudiant registrationMode onBack={() => setView('home')} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_25%_15%,rgba(125,211,252,0.38),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617,#082f49_48%,#0c4a6e)] px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">Portail d’inscription</h1>
          <p className="mt-2 text-slate-300">Sélectionnez la catégorie correspondant à votre dossier.</p>
        </div>

        {view === 'home' && (
          <div className="grid gap-6 md:grid-cols-2">
            <ChoiceCard
              icon={BriefcaseBusiness}
              title="Corps académique"
              description="Enseignant ou autre agent académique."
              color="indigo"
              onClick={() => setView('academique')}
            />
            <ChoiceCard
              icon={School}
              title="Étudiant"
              description="Créer votre dossier étudiant avec vos informations académiques."
              color="emerald"
              onClick={() => setView('etudiant')}
            />
          </div>
        )}

        {(view === 'academique' || view === 'enseignant') && (
          <section>
            <button onClick={() => setView('home')} className="mb-5 flex items-center gap-2 text-sm text-indigo-200 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Retour aux grandes sections
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Corps académique</h2>
              <p className="mt-1 text-slate-300">Choisissez votre catégorie professionnelle.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <ChoiceCard
                icon={UserCog}
                title="Corps enseignant"
                description="Le compte sera enregistré inactif jusqu’à sa validation par l’administration."
                color="violet"
                loading={loading}
                onClick={openTeacherRegistration}
              />
              <ChoiceCard
                icon={UsersRound}
                title="Autre agent académique"
                description="Créer un compte utilisateur académique classique."
                color="cyan"
                onClick={() => setView('agent')}
              />
            </div>
          </section>
        )}

        {view === 'enseignant' && (
          <ProfesseurForm
            visible
            registrationMode
            facultes={options.facultes}
            grades={options.grades}
            onCancel={() => setView('academique')}
            onSuccess={() => navigate('/login')}
          />
        )}
      </div>
    </main>
  );
};

const colors = {
  indigo: 'from-indigo-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  violet: 'from-violet-500 to-purple-600',
  cyan: 'from-cyan-500 to-sky-600',
};

const ChoiceCard = ({ icon: Icon, title, description, color, onClick, loading = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="group rounded-2xl border border-white/10 bg-white/10 p-7 text-left shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 disabled:opacity-60"
  >
    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
      <Icon className="h-6 w-6" />
    </div>
    <h2 className="text-xl font-bold">{loading ? 'Chargement...' : title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    <span className="mt-5 inline-block text-sm font-semibold text-indigo-200 group-hover:text-white">Continuer →</span>
  </button>
);

export default PortailInscription;

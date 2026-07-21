import { Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/accounts/Login';
import PortailInscription from './pages/accounts/inscription/PortailInscription';
import Dashboard from './pages/accounts/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import StudentRoute from './components/StudentRoute';
import ProfessorRoute from './components/ProfessorRoute';
import BarreNavigation from './components/BarreNavigation';
import JuryTokenGate from './components/JuryTokenGate';

// ========== IMPORTS ÉTUDIANTS ==========
import ListeEtudiants from './pages/etudiants/ListeEtudiants';
import FormulaireEtudiant from './pages/etudiants/FormulaireEtudiant';
import VoirEtudiant from './pages/etudiants/VoirEtudiant';
import ProfilEtudiant from './pages/etudiants/espace/ProfilEtudiant';

// ========== IMPORTS FRAIS ==========
import TarifsList from './pages/frais/TarifsList';
import TarifsCreate from './pages/frais/TarifsCreate';
import FraisList from './pages/frais/FraisList';
import CreatePaiement from './pages/frais/CreatePaiement';
import EtudiantPaiementsDetail from './pages/frais/EtudiantPaiementsDetail';
import EnregistrerPaiement from './pages/frais/EnregistrerPaiement';
import ApplicationsFraisList from './pages/frais/ApplicationsFraisList';
import StatistiquesFrais from './pages/frais/StatistiquesFrais';

// ========== IMPORTS ENSEIGNEMENTS ==========
// Dashboard Enseignements
import EnseignementsDashboard from './pages/enseignements';

// Grades
import GradeList from './pages/enseignements/Grades/GradeList';
import GradeForm from './pages/enseignements/Grades/GradeForm';
import GradeDetail from './pages/enseignements/Grades/GradeDetail';

// Professeurs
import ProfesseurList from './pages/enseignements/Professeurs/ProfesseurList';
import ProfesseurForm from './pages/enseignements/Professeurs/ProfesseurForm';
import ProfesseurDetail from './pages/enseignements/Professeurs/ProfesseurDetail';
import EspaceProfesseur from './pages/enseignements/espaceProfesseur/EspaceProfesseur';

// Cours
import CoursList from './pages/enseignements/Cours/CoursList';
import CoursForm from './pages/enseignements/Cours/CoursForm';
import CoursDetail from './pages/enseignements/Cours/CoursDetail';

// Gestion Applications
import GestionApplicationList from './pages/enseignements/GestionApplications/GestionApplicationList';
import GestionApplicationForm from './pages/enseignements/GestionApplications/GestionApplicationForm';
import GestionApplicationDetail from './pages/enseignements/GestionApplications/GestionApplicationDetail';

// Appliquer Cours
import AppliquerCoursList from './pages/enseignements/AppliquerCours/AppliquerCoursList';
import AppliquerCoursByEtudiant from './pages/enseignements/AppliquerCours/AppliquerCoursByEtudiant';
import JuryEtudiants from './pages/enseignements/Jury/JuryEtudiants';
import FusionCoursJury from './pages/enseignements/Jury/FusionCoursJury';
import JuryCotesEtudiants from './pages/enseignements/Jury/JuryCotesEtudiants';
import JuryFinAnnee from './pages/enseignements/Jury/JuryFinAnnee';


function App() {
  const location = useLocation();
  const isPersonalSpace = location.pathname.startsWith('/espace-etudiant')
    || location.pathname.startsWith('/espace-professeur');

  return (
    <>
      {!isPersonalSpace && <BarreNavigation />}
      <Routes>
        {/* ========== ROUTES AUTHENTIFICATION ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<PortailInscription />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/espace-etudiant"
          element={
            <StudentRoute>
              <ProfilEtudiant />
            </StudentRoute>
          }
        />
        <Route
          path="/espace-professeur"
          element={
            <ProfessorRoute>
              <EspaceProfesseur />
            </ProfessorRoute>
          }
        />

        {/* ========== ROUTES DASHBOARD ========== */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ========== ROUTES ÉTUDIANTS ========== */}
        <Route
          path="/etudiants"
          element={
            <PrivateRoute>
              <ListeEtudiants />
            </PrivateRoute>
          }
        />
        <Route
          path="/etudiants/:id"
          element={
            <PrivateRoute>
              <VoirEtudiant />
            </PrivateRoute>
          }
        />
        <Route
          path="/etudiants/nouveau"
          element={
            <PrivateRoute>
              <FormulaireEtudiant />
            </PrivateRoute>
          }
        />
        <Route
          path="/etudiants/modifier/:id"
          element={
            <PrivateRoute>
              <FormulaireEtudiant />
            </PrivateRoute>
          }
        />

        {/* ========== ROUTES FRAIS ========== */}
        <Route path="/frais/applications" element={<PrivateRoute><ApplicationsFraisList /></PrivateRoute>} />
        <Route path="/frais/statistiques" element={<PrivateRoute><StatistiquesFrais /></PrivateRoute>} />
        <Route
          path="/frais/tarifs"
          element={
            <PrivateRoute>
              <TarifsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/frais/tarifs/nouveau"
          element={
            <PrivateRoute>
              <TarifsCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/frais"
          element={
            <PrivateRoute>
              <FraisList />
            </PrivateRoute>
          }
        />
        <Route
          path="/frais/paiements/nouveau"
          element={
            <PrivateRoute>
              <CreatePaiement />
            </PrivateRoute>
          }
        />
        <Route
          path="/frais/etudiant/:etudiantId/paiements"
          element={
            <PrivateRoute>
              <EtudiantPaiementsDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/frais/etudiant/:etudiantId/nouveau-paiement"
          element={
            <PrivateRoute>
              <EnregistrerPaiement />
            </PrivateRoute>
          }
        />

        {/* ========== ROUTES ENSEIGNEMENTS ========== */}
        <Route path="/jury" element={<PrivateRoute><JuryTokenGate><JuryEtudiants /></JuryTokenGate></PrivateRoute>} />
        <Route path="/jury/resultats-consolides" element={<PrivateRoute><JuryTokenGate><JuryEtudiants resultatsConsolides /></JuryTokenGate></PrivateRoute>} />
        <Route path="/jury/fusions-cours" element={<PrivateRoute><JuryTokenGate><FusionCoursJury /></JuryTokenGate></PrivateRoute>} />
        <Route path="/jury/cotes" element={<PrivateRoute><JuryTokenGate><JuryCotesEtudiants /></JuryTokenGate></PrivateRoute>} />
        <Route path="/jury/fin-annee" element={<PrivateRoute><JuryTokenGate><JuryFinAnnee /></JuryTokenGate></PrivateRoute>} />
        {/* Dashboard Enseignements */}
        <Route
          path="/enseignements"
          element={
            <PrivateRoute>
              <EnseignementsDashboard />
            </PrivateRoute>
          }
        />

        {/* Grades */}
        <Route
          path="/enseignements/grades"
          element={
            <PrivateRoute>
              <GradeList />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/grades/nouveau"
          element={
            <PrivateRoute>
              <GradeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/grades/modifier/:id"
          element={
            <PrivateRoute>
              <GradeForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/grades/:id"
          element={
            <PrivateRoute>
              <GradeDetail />
            </PrivateRoute>
          }
        />

        {/* Professeurs */}
        <Route
          path="/enseignements/professeurs"
          element={
            <PrivateRoute>
              <ProfesseurList />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/professeurs/nouveau"
          element={
            <PrivateRoute>
              <ProfesseurForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/professeurs/modifier/:id"
          element={
            <PrivateRoute>
              <ProfesseurForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/professeurs/:id"
          element={
            <PrivateRoute>
              <ProfesseurDetail />
            </PrivateRoute>
          }
        />

        {/* Cours */}
        <Route
          path="/enseignements/cours"
          element={
            <PrivateRoute>
              <CoursList />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/cours/nouveau"
          element={
            <PrivateRoute>
              <CoursForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/cours/modifier/:id"
          element={
            <PrivateRoute>
              <CoursForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/cours/:id"
          element={
            <PrivateRoute>
              <CoursDetail />
            </PrivateRoute>
          }
        />

        {/* Gestion Applications */}
        <Route
          path="/enseignements/gestion-applications"
          element={
            <PrivateRoute>
              <GestionApplicationList />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/gestion-applications/nouveau"
          element={
            <PrivateRoute>
              <GestionApplicationForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/gestion-applications/modifier/:id"
          element={
            <PrivateRoute>
              <GestionApplicationForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/gestion-applications/:id"
          element={
            <PrivateRoute>
              <GestionApplicationDetail />
            </PrivateRoute>
          }
        />

        {/* Appliquer Cours */}
        <Route
          path="/enseignements/appliquer-cours"
          element={
            <PrivateRoute>
              <AppliquerCoursList />
            </PrivateRoute>
          }
        />
        <Route
          path="/enseignements/appliquer-cours/etudiant/:etudiantId"
          element={
            <PrivateRoute>
              <AppliquerCoursByEtudiant />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

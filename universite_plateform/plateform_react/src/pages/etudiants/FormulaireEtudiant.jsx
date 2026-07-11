import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { etudiantApi, faculteApi, departementApi, promotionApi, anneeApi } from '../../services';
import { ArrowLeft, GraduationCap, Save, UserPen } from 'lucide-react';

const FormulaireEtudiant = ({ registrationMode = false, onBack }) => {
  const { id } = useParams();
  const etudiantId = id ? id.replace(/^:/, '') : null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [annees, setAnnees] = useState([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    post_nom: '',
    prenom: '',
    sexe: 'M',
    date_naissance: '',
    lieu_naissance: '',
    telephone: '',
    email: '',
    adresse: '',
    matricule: '',
    mot_de_passe: '',
    faculte: '',
    departement: '',
    promotion: '',
    annee_academique: '',
    parent_nom: '',
    parent_telephone: '',
    parent_email: '',
    statut_frais: 'IMPAYE',
    photo: null
  });

  useEffect(() => {
    chargerDonnees();
    if (etudiantId) {
      chargerEtudiant();
    }
  }, [etudiantId]);

  const chargerDonnees = async () => {
    try {
      const [facultesRes, departementsRes, promotionsRes, anneesRes] = await Promise.all([
        faculteApi.getAll(),
        departementApi.getAll(),
        promotionApi.getAll(),
        anneeApi.getAll()
      ]);
      setFacultes(facultesRes.data);
      setDepartements(departementsRes.data);
      setPromotions(promotionsRes.data);
      setAnnees(anneesRes.data);
      
      // Sélectionner l'année active par défaut
      const activeAnnee = anneesRes.data.find(a => a.est_active);
      if (activeAnnee && !formData.annee_academique) {
        setFormData(prev => ({ ...prev, annee_academique: activeAnnee.id }));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const chargerEtudiant = async () => {
    try {
      const response = await etudiantApi.getById(etudiantId);
      const data = response.data;
      setFormData({
        nom: data.nom,
        post_nom: data.post_nom,
        prenom: data.prenom,
        sexe: data.sexe,
        date_naissance: data.date_naissance,
        lieu_naissance: data.lieu_naissance || '',
        telephone: data.telephone,
        email: data.email || '',
        adresse: data.adresse,
        matricule: data.matricule,
        mot_de_passe: '',
        faculte: data.faculte,
        departement: data.departement || '',
        promotion: data.promotion,
        annee_academique: data.annee_academique || '',
        parent_nom: data.parent_nom,
        parent_telephone: data.parent_telephone,
        parent_email: data.parent_email || '',
        statut_frais: data.statut_frais,
        photo: null
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, [e.target.name]: e.target.files?.[0] || null });
      return;
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const creerPayload = (source, champsExclus = []) => {
        const payload = new FormData();
        Object.entries(source).forEach(([champ, valeur]) => {
          if (!champsExclus.includes(champ) && valeur !== null) {
            payload.append(champ, valeur);
          }
        });
        return payload;
      };

      if (registrationMode) {
        const donneesInscription = creerPayload(formData, ['matricule', 'annee_academique']);

        const response = await etudiantApi.register(donneesInscription);
        const matriculeGenere = response.data.etudiant.matricule;
        alert(`Inscription enregistrée avec succès ! Votre matricule est : ${matriculeGenere}`);
        navigate('/login');
        return;
      } else if (etudiantId) {
        await etudiantApi.update(etudiantId, creerPayload(formData));
        alert('Étudiant modifié avec succès !');
      } else {
        await etudiantApi.create(creerPayload(formData));
        alert('Étudiant ajouté avec succès !');
      }
      navigate('/etudiants');
    } catch (error) {
      console.error('Erreur:', error);
      const erreurs = error.response?.data;
      if (erreurs && typeof erreurs === 'object') {
        const message = Object.entries(erreurs)
          .map(([champ, details]) => `${champ} : ${Array.isArray(details) ? details.join(' ') : details}`)
          .join('\n');
        alert(message || 'Une erreur est survenue');
      } else {
        alert('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${registrationMode ? 'bg-[radial-gradient(circle_at_25%_15%,rgba(125,211,252,0.38),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617,#082f49_48%,#0c4a6e)]' : 'bg-slate-50'}`}>
      <main className="mx-auto max-w-5xl">
      {registrationMode && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux types d’inscription
        </button>
      )}

      {!registrationMode && (
        <button type="button" onClick={() => navigate('/etudiants')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </button>
      )}

      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><UserPen className="h-7 w-7" /></div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200"><GraduationCap className="h-4 w-4" />Dossier étudiant</div>
            <h1 className="text-3xl font-bold tracking-tight">
              {registrationMode ? 'Inscription étudiant' : (id ? 'Modifier l\'étudiant' : 'Ajouter un étudiant')}
            </h1>
            <p className="mt-2 text-sm text-indigo-100/75">Complétez soigneusement les informations personnelles et académiques.</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 [&_label]:text-sm [&_label]:font-semibold [&_label]:text-slate-700 [&_input]:min-h-11 [&_input]:border-slate-200 [&_input]:bg-white [&_input]:transition [&_input]:focus:bg-white [&_select]:min-h-11 [&_select]:border-slate-200 [&_select]:bg-white [&_textarea]:border-slate-200 [&_textarea]:bg-white">
        <div className="mb-7 border-b border-slate-100 pb-5">
          <h2 className="text-xl font-bold text-slate-900">Informations de l’étudiant</h2>
          <p className="mt-1 text-sm text-slate-500">Les champs marqués d’un astérisque sont obligatoires.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">Nom *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Post-nom *</label>
            <input
              type="text"
              name="post_nom"
              value={formData.post_nom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Prénom *</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Sexe *</label>
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Date de naissance *</label>
            <input
              type="date"
              name="date_naissance"
              value={formData.date_naissance}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Lieu de naissance</label>
            <input
              type="text"
              name="lieu_naissance"
              value={formData.lieu_naissance}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Téléphone *</label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Adresse</label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              rows="2"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              {etudiantId ? 'Nouveau mot de passe' : 'Mot de passe *'}
            </label>
            <input
              type="password"
              name="mot_de_passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              required={!etudiantId}
              minLength="8"
              autoComplete="new-password"
              placeholder={etudiantId ? 'Laisser vide pour ne pas modifier' : 'Minimum 8 caractères'}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Photo (optionnelle)</label>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP ou GIF — optimisation automatique.</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Faculté *</label>
            <select
              name="faculte"
              value={formData.faculte}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une faculté</option>
              {facultes.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Département</label>
            <select
              name="departement"
              value={formData.departement}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un département</option>
              {departements
                .filter((departement) => !formData.faculte || String(departement.faculte) === String(formData.faculte))
                .map((departement) => <option key={departement.id} value={departement.id}>{departement.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Promotion *</label>
            <select
              name="promotion"
              value={formData.promotion}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une promotion</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {!registrationMode && (
            <div>
              <label className="block text-gray-700 mb-2">Année académique *</label>
              <select
                name="annee_academique"
                value={formData.annee_academique}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une année</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom} {a.est_active ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">Nom du parent/tuteur *</label>
            <input
              type="text"
              name="parent_nom"
              value={formData.parent_nom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Téléphone du parent *</label>
            <input
              type="tel"
              name="parent_telephone"
              value={formData.parent_telephone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email du parent</label>
            <input
              type="email"
              name="parent_email"
              value={formData.parent_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <button
            type="button"
            onClick={() => registrationMode && onBack ? onBack() : navigate('/etudiants')}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Enregistrement...' : (registrationMode ? 'Envoyer mon inscription' : (id ? 'Modifier' : 'Enregistrer'))}
          </button>
        </div>
      </form>
      </main>
    </div>
  );
};

export default FormulaireEtudiant;

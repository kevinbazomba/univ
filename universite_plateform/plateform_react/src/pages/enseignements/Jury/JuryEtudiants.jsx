import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  Award,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Gavel,
  Layers3,
  LockKeyhole,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { api } from "../../../services/apiClient";

const JuryEtudiants = () => {
  const [sessions, setSessions] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [referentiels, setReferentiels] = useState({
    facultes: [],
    departements: [],
    promotions: [],
  });
  const [anneeSelectionnee, setAnneeSelectionnee] = useState("");
  const [etudiants, setEtudiants] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    session: "",
    faculte: "",
    departement: "",
    promotion: "",
    search: "",
  });
  const [decision, setDecision] = useState("ADMIS");
  const [loading, setLoading] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [promotionsEnAttente, setPromotionsEnAttente] = useState([]);
  const [afficherCloture, setAfficherCloture] = useState(false);
  const [afficherConsolides, setAfficherConsolides] = useState(false);
  const [afficherPromotion, setAfficherPromotion] = useState(false);
  const [anneeCible, setAnneeCible] = useState("");
  const [filtreConsolide, setFiltreConsolide] = useState("TOUS");
  const [rapport, setRapport] = useState(null);
  const [cloture, setCloture] = useState({
    nom: "",
    date_debut: "",
    date_fin: "",
    session_ids: [],
  });

  async function charger() {
    setLoading(true);
    try {
      const response = await api.get(
        "jury/contexte/",
        Object.fromEntries(
          Object.entries(filters).filter(
            ([key, value]) => key !== "search" && value,
          ),
        ),
      );
      const sessionsChargees = response.data.sessions || [];
      const anneesChargees = response.data.annees || [];
      setSessions(sessionsChargees);
      setAnnees(anneesChargees);
      setReferentiels({
        facultes: response.data.facultes || [],
        departements: response.data.departements || [],
        promotions: response.data.promotions || [],
      });
      setPromotionsEnAttente(response.data.promotions_en_attente || []);
      setEtudiants(response.data.etudiants || []);
      setSelected([]);
      if (!anneeSelectionnee) {
        const anneeParDefaut =
          anneesChargees.find((annee) => annee.est_active) || anneesChargees[0];
        if (anneeParDefaut) setAnneeSelectionnee(String(anneeParDefaut.id));
      }
      if (!filters.session) {
        const anneeParDefaut =
          anneesChargees.find((annee) => annee.est_active) || anneesChargees[0];
        const sessionParDefaut =
          sessionsChargees.find(
            (session) =>
              String(session.annee_academique) === String(anneeParDefaut?.id) &&
              session.est_active,
          ) ||
          sessionsChargees.find(
            (session) =>
              String(session.annee_academique) === String(anneeParDefaut?.id),
          );
        if (sessionParDefaut)
          setFilters((courants) => ({
            ...courants,
            session: String(sessionParDefaut.id),
          }));
      }
    } catch {
      toast.error("Impossible de charger les données du jury");
    } finally {
      setLoading(false);
    }
  
  }

  useEffect(() => {
    Promise.resolve().then(charger);
  }, [
    filters.session,
    filters.faculte,
    filters.departement,
    filters.promotion,
  ]);

  const visibles = useMemo(
    () =>
      etudiants.filter((item) =>
        `${item.matricule} ${item.nom_complet}`
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      ),
    [etudiants, filters.search],
  );
  const options = (champ) => {
    const cle = `${champ}s`;
    const valeurs = referentiels[cle] || [];
    if (champ === "departement" && filters.faculte) {
      return valeurs.filter(
        (item) => String(item.faculte_id) === String(filters.faculte),
      );
    }
    return valeurs;
  };
  const sessionsAnnee = useMemo(
    () =>
      sessions.filter(
        (session) =>
          String(session.annee_academique) === String(anneeSelectionnee),
      ),
    [sessions, anneeSelectionnee],
  );
  const anneeCourante = annees.find(
    (annee) => String(annee.id) === String(anneeSelectionnee),
  );
  const sessionCourante = sessions.find(
    (session) => String(session.id) === String(filters.session),
  );
  const anneeModifiable = Boolean(
    sessions.find((session) => String(session.id) === String(filters.session))
      ?.annee_academique_est_active,
  );

  const changerAnnee = (anneeId) => {
    const sessionsCorrespondantes = sessions.filter(
      (session) => String(session.annee_academique) === String(anneeId),
    );
    const sessionParDefaut =
      sessionsCorrespondantes.find((session) => session.est_active) ||
      sessionsCorrespondantes[0];
    setAnneeSelectionnee(anneeId);
    setFilters({
      session: sessionParDefaut ? String(sessionParDefaut.id) : "",
      faculte: "",
      departement: "",
      promotion: "",
      search: "",
    });
  };

  async function publier() {
    if (!filters.session || !selected.length)
      return toast.error("Sélectionnez une session et au moins un étudiant");
    try {
      const response = await api.post("jury/publier/", {
        session_id: filters.session,
        etudiant_ids: selected,
        decision,
      });
      toast.success(response.data.message);
      await charger();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Publication impossible");
    }
  
  }

  async function changerVisibilite(resultatsPublies) {
    if (!filters.session || !selected.length)
      return toast.error("Sélectionnez une session et au moins un étudiant");
    setActionEnCours(true);
    try {
      const response = await api.post("jury/visibilite/", {
        session_id: filters.session,
        etudiant_ids: selected,
        resultats_publies: resultatsPublies,
      });
      toast.success(response.data.message);
      await charger();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error ||
          "Modification de la visibilité impossible",
      );
    } finally {
      setActionEnCours(false);
    }
  
  }

  async function creerCloture(event) {
    event.preventDefault();
    setActionEnCours(true);
    try {
      const response = await api.post("jury/creer-cloture/", {
        ...cloture,
        annee_academique_id: anneeSelectionnee,
      });
      toast.success("Session de clôture créée");
      setAfficherCloture(false);
      setCloture({ nom: "", date_debut: "", date_fin: "", session_ids: [] });
      setFilters((courants) => ({
        ...courants,
        session: String(response.data.id),
      }));
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.nom?.[0] ||
          error.response?.data?.error ||
          "Création impossible",
      );
    } finally {
      setActionEnCours(false);
    }
  
  }

  async function promouvoirAdmis() {
    if (!promotionsEnAttente.length)
      return toast.error("Aucun étudiant en attente de promotion");
    if (!anneeCible)
      return toast.error("Choisissez la nouvelle année académique");
    setActionEnCours(true);
    try {
      const response = await api.post("jury/promouvoir/", {
        promotion_ids: promotionsEnAttente.map((item) => item.id),
        annee_cible_id: anneeCible,
        activer_annee: true,
      });
      toast.success(response.data.message);
      setAfficherPromotion(false);
      setAnneeCible("");
      await charger();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Promotion impossible");
    } finally {
      setActionEnCours(false);
    }
  
  }

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <Gavel className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-indigo-200">Délibération académique</p>
              <h1 className="text-3xl font-bold">Jury des étudiants</h1>
              <p className="mt-1 text-sm text-indigo-100/70">
                Validez et publiez les résultats individuellement ou
                collectivement.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Outils du jury</p>
            <p className="text-xs text-slate-500">
              Consolidez les meilleures cotes puis gérez la promotion des admis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAfficherConsolides(!afficherConsolides)}
              disabled={!sessionCourante?.est_cloture}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 disabled:opacity-40"
            >
              <Award className="h-4 w-4" />
              Résultats consolidés
            </button>
            <button
              onClick={() => setAfficherCloture(true)}
              disabled={!anneeCourante?.est_active}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <Layers3 className="h-4 w-4" />
              Créer une clôture
            </button>
            <button
              onClick={() => setAfficherPromotion(true)}
              disabled={actionEnCours || !promotionsEnAttente.length}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Promouvoir les admis ({promotionsEnAttente.length})
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600" />
              <div>
                <h2 className="font-bold text-slate-900">Périmètre du jury</h2>
                <p className="text-xs text-slate-400">
                  Choisissez d’abord l’année, puis sa session d’évaluation.
                </p>
              </div>
            </div>
            {anneeCourante && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${anneeCourante.est_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {anneeCourante.est_active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <LockKeyhole className="h-3.5 w-3.5" />
                )}
                {anneeCourante.est_active
                  ? "Année active"
                  : "Consultation seule"}
              </span>
            )}
          </div>

          <div className="grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-700">
                <CalendarDays className="h-4 w-4" />
                Année académique
              </span>
              <select
                value={anneeSelectionnee}
                onChange={(e) => changerAnnee(e.target.value)}
                className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Choisir une année</option>
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom} · {annee.date_debut} — {annee.date_fin}
                    {annee.est_active ? " · Active" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700">
                <Gavel className="h-4 w-4" />
                Session du jury
              </span>
              <select
                value={filters.session}
                onChange={(e) =>
                  setFilters({ ...filters, session: e.target.value })
                }
                disabled={!anneeSelectionnee || !sessionsAnnee.length}
                className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {sessionsAnnee.length
                    ? "Choisir une session"
                    : "Aucune session pour cette année"}
                </option>
                {sessionsAnnee.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.nom} · {session.date_debut} — {session.date_fin}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {["faculte", "departement", "promotion"].map((champ) => (
              <select
                key={champ}
                value={filters[champ]}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    [champ]: e.target.value,
                    ...(champ === "faculte" ? { departement: "" } : {}),
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">
                  {champ[0].toUpperCase() + champ.slice(1)} : tous
                </option>
                {options(champ).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom}
                  </option>
                ))}
              </select>
            ))}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Matricule ou nom"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {filters.session && !anneeModifiable && (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
              Année clôturée — consultation uniquement.
            </div>
          )}
          {sessionCourante?.est_cloture && (
            <div className="border-b bg-violet-50/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-violet-700" />
                <div>
                  <h3 className="font-black text-violet-950">
                    Résultats consolidés sans répétition
                  </h3>
                  <p className="text-xs text-violet-700">
                    Pour chaque cours, la meilleure cote parmi les sessions
                    incluses est retenue.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibles.map((etudiant) => (
                  <button
                    key={etudiant.id}
                    onClick={() => setRapport(etudiant)}
                    className="rounded-xl border border-violet-200 bg-white p-4 text-left transition hover:border-violet-400 hover:shadow-sm"
                  >
                    <p className="font-bold text-slate-900">
                      {etudiant.nom_complet}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {etudiant.matricule}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {etudiant.cours_reussis} réussi(s)
                      </span>
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {etudiant.cours_echoues} échoué(s)
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Étudiants concernés</h2>
              <p className="text-sm text-slate-500">
                {visibles.length} dossier(s), {selected.length} sélectionné(s)
              </p>
            </div>
            {anneeModifiable && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="ADMIS">Admis</option>
                  <option value="AJOURNE">Ajourné</option>
                  <option value="NON_ADMIS">Non admis</option>
                  <option value="EN_ATTENTE">En attente</option>
                </select>
                <button
                  onClick={publier}
                  disabled={actionEnCours}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Publier
                </button>
                <button
                  onClick={() => changerVisibilite(false)}
                  disabled={actionEnCours}
                  className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  <EyeOff className="h-4 w-4" />
                  Masquer
                </button>
                <button
                  onClick={() => changerVisibilite(true)}
                  disabled={actionEnCours}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" />
                  Démasquer
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={
                        visibles.length > 0 &&
                        selected.length === visibles.length
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? visibles.map((x) => x.id) : [],
                        )
                      }
                    />
                  </th>
                  {[
                    "Matricule",
                    "Étudiant",
                    "Faculté",
                    "Département",
                    "Promotion",
                    "Publication",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 text-left text-xs font-bold uppercase text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibles.map((e) => (
                  <tr key={e.id} className="hover:bg-indigo-50/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(e.id)}
                        onChange={() =>
                          setSelected(
                            selected.includes(e.id)
                              ? selected.filter((id) => id !== e.id)
                              : [...selected, e.id],
                          )
                        }
                      />
                    </td>
                    <td className="p-4 font-mono text-sm">{e.matricule}</td>
                    <td className="p-4 font-semibold">{e.nom_complet}</td>
                    <td className="p-4 text-sm">{e.faculte_nom}</td>
                    <td className="p-4 text-sm">{e.departement_nom || "—"}</td>
                    <td className="p-4 text-sm">{e.promotion_nom}</td>
                    <td className="p-4">
                      {e.jury?.resultats_publies ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Publié
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !visibles.length && (
              <div className="p-12 text-center text-slate-400">
                <Users className="mx-auto mb-2 h-9 w-9" />
                Choisissez une session pour afficher les étudiants.
              </div>
            )}
          </div>
        </section>
      </div>

      {afficherCloture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={creerCloture}
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Créer une session de clôture
                </h3>
                <p className="text-sm text-slate-500">
                  Les meilleures cotes des sessions choisies seront consolidées.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAfficherCloture(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-bold text-slate-700">
                Nom
                <input
                  required
                  value={cloture.nom}
                  onChange={(e) =>
                    setCloture({ ...cloture, nom: e.target.value })
                  }
                  placeholder="Jury final L1"
                  className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Date début
                <input
                  required
                  type="date"
                  value={cloture.date_debut}
                  onChange={(e) =>
                    setCloture({ ...cloture, date_debut: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Date fin
                <input
                  required
                  type="date"
                  value={cloture.date_fin}
                  onChange={(e) =>
                    setCloture({ ...cloture, date_fin: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-bold text-slate-700">
                  Sessions à consolider
                </legend>
                <div className="max-h-52 space-y-2 overflow-auto rounded-xl border p-3">
                  {sessionsAnnee
                    .filter((session) => !session.est_cloture)
                    .map((session) => (
                      <label
                        key={session.id}
                        className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-violet-50"
                      >
                        <input
                          type="checkbox"
                          checked={cloture.session_ids.includes(session.id)}
                          onChange={(e) =>
                            setCloture({
                              ...cloture,
                              session_ids: e.target.checked
                                ? [...cloture.session_ids, session.id]
                                : cloture.session_ids.filter(
                                    (id) => id !== session.id,
                                  ),
                            })
                          }
                        />
                        {session.nom}{" "}
                        {session.est_rattrapage ? "· Rattrapage" : ""}
                      </label>
                    ))}
                </div>
              </fieldset>
            </div>
            <button
              disabled={actionEnCours}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Layers3 className="h-4 w-4" />
              Créer et consolider
            </button>
          </form>
        </div>
      )}

      {afficherPromotion && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Promouvoir les étudiants admis
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Chaque étudiant sera réinscrit une seule fois dans le niveau
                  supérieur.
                </p>
              </div>
              <button
                onClick={() => setAfficherPromotion(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block text-sm font-bold text-slate-700">
              Nouvelle année académique
              <select
                value={anneeCible}
                onChange={(e) => setAnneeCible(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
              >
                <option value="">Choisir l’année cible</option>
                {annees
                  .filter(
                    (annee) => String(annee.id) !== String(anneeSelectionnee),
                  )
                  .map((annee) => (
                    <option key={annee.id} value={annee.id}>
                      {annee.nom} · {annee.date_debut} — {annee.date_fin}
                      {annee.est_active ? " · Active" : ""}
                    </option>
                  ))}
              </select>
            </label>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              L’année choisie deviendra l’année active. Les anciennes
              inscriptions et décisions resteront intactes et consultables.
            </div>
            <div className="mt-4 max-h-48 space-y-2 overflow-auto rounded-xl border p-3">
              {promotionsEnAttente.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <div>
                    <b>{item.inscription_origine__etudiant__matricule}</b> ·{" "}
                    {item.inscription_origine__etudiant__nom}{" "}
                    {item.inscription_origine__etudiant__prenom}
                    <p className="text-xs text-slate-500">
                      {item.inscription_origine__promotion__nom} →{" "}
                      {item.promotion_cible__nom ||
                        "Niveau supérieur non configuré"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${item.statut === "BLOQUE" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {item.statut}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={promouvoirAdmis}
              disabled={actionEnCours || !anneeCible}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Confirmer la promotion ({promotionsEnAttente.length})
            </button>
          </div>
        </div>
      )}

      {rapport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Relevé consolidé · {rapport.nom_complet}
                </h3>
                <p className="text-sm text-slate-500">
                  Une ligne par cours avec composantes, crédits, meilleure
                  tentative et session source.
                </p>
              </div>
              <button
                onClick={() => setRapport(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Cours",
                      "TP",
                      "Interro",
                      "Examen",
                      "Total",
                      "Maximum",
                      "Crédits",
                      "Pondération",
                      "Session retenue",
                      "Résultat",
                    ].map((titre) => (
                      <th
                        key={titre}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase text-slate-500"
                      >
                        {titre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rapport.consolidation?.map((note) => (
                    <tr key={note.cours_id}>
                      <td className="px-4 py-3 font-bold">{note.cours_nom}</td>
                      <td className="px-4 py-3">{note.points_tp ?? "—"}</td>
                      <td className="px-4 py-3">
                        {note.points_interro ?? "—"}
                      </td>
                      <td className="px-4 py-3">{note.points_examen ?? "—"}</td>
                      <td className="px-4 py-3 font-black">{note.total}</td>
                      <td className="px-4 py-3">{note.maximum}</td>
                      <td className="px-4 py-3">{note.credit}</td>
                      <td className="px-4 py-3">{note.ponderation}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {note.session_nom}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${note.reussi ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {note.reussi ? "Réussi" : "Échoué"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {afficherConsolides && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Résultats consolidés
                </h3>
                <p className="text-sm text-slate-500">
                  Meilleure cote par cours, crédits et détails des tentatives
                  retenues.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filtreConsolide}
                  onChange={(e) => setFiltreConsolide(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="TOUS">Tous les étudiants</option>
                  <option value="REUSSI">Tous les cours réussis</option>
                  <option value="ECHEC">Avec cours échoués</option>
                  <option value="SANS_NOTE">Sans résultat consolidé</option>
                </select>
                <button
                  onClick={() => setAfficherConsolides(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibles
                .filter(
                  (etudiant) =>
                    filtreConsolide === "TOUS" ||
                    (filtreConsolide === "REUSSI" &&
                      etudiant.consolidation?.length > 0 &&
                      etudiant.cours_echoues === 0) ||
                    (filtreConsolide === "ECHEC" &&
                      etudiant.cours_echoues > 0) ||
                    (filtreConsolide === "SANS_NOTE" &&
                      !etudiant.consolidation?.length),
                )
                .map((etudiant) => {
                  const credits =
                    etudiant.consolidation
                      ?.filter((note) => note.reussi)
                      .reduce(
                        (total, note) => total + Number(note.credit || 0),
                        0,
                      ) || 0;
                  return (
                    <article
                      key={etudiant.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="font-black text-slate-900">
                        {etudiant.nom_complet}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {etudiant.matricule} · {etudiant.promotion_nom}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-emerald-50 p-2">
                          <b className="block text-emerald-700">
                            {etudiant.cours_reussis}
                          </b>
                          <span className="text-[10px] text-emerald-600">
                            Réussis
                          </span>
                        </div>
                        <div className="rounded-lg bg-rose-50 p-2">
                          <b className="block text-rose-700">
                            {etudiant.cours_echoues}
                          </b>
                          <span className="text-[10px] text-rose-600">
                            Échoués
                          </span>
                        </div>
                        <div className="rounded-lg bg-indigo-50 p-2">
                          <b className="block text-indigo-700">{credits}</b>
                          <span className="text-[10px] text-indigo-600">
                            Crédits
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setRapport(etudiant)}
                        className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white"
                      >
                        Voir tous les détails
                      </button>
                    </article>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default JuryEtudiants;

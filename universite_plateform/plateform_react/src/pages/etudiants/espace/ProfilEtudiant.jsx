import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Milestone,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  User,
  Users,
  X,
  BadgeCheck,
  Banknote,
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  WalletCards,
  RefreshCw,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import studentAccountApi, {
  clearStudentSession,
} from "../../../services/etudiants/studentAccountApi";
import { universityApi } from "../../../services/universityApi";

const editableFields = [
  ["date_naissance", "Date de naissance", "date"],
  ["telephone", "Téléphone", "tel"],
  ["email", "Email", "email"],
  ["lieu_naissance", "Lieu de naissance", "text"],
  ["parent_nom", "Parent / tuteur", "text"],
  ["parent_telephone", "Téléphone du parent", "tel"],
  ["parent_email", "Email du parent", "email"],
];

const resultatAcademique = (points, maximum) => {
  if (points === null || points === undefined) {
    return { label: "En attente", classes: "bg-slate-100 text-slate-600" };
  }
  const note = Number(points);
  const seuil = Number(maximum) / 2;
  if (note >= seuil) {
    return { label: "Réussi", classes: "bg-emerald-100 text-emerald-700" };
  }
  if (note >= seuil - 2) {
    return { label: "Échec léger", classes: "bg-amber-100 text-amber-700" };
  }
  return { label: "Échec grave", classes: "bg-rose-100 text-rose-700" };
};

const ProfilEtudiant = () => {
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [passwords, setPasswords] = useState({ ancien_mot_de_passe: "", nouveau_mot_de_passe: "", confirmer_mot_de_passe: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [space, setSpace] = useState({
    cours: [],
    frais: [],
    paiements: [],
    resume_financier: {},
  });
  const [university, setUniversity] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([studentAccountApi.getSpace(), universityApi.getIdentity()])
      .then(([data, universityData]) => {
        setStudent(data.etudiant);
        setForm(data.etudiant);
        setSpace(data);
        setSelectedYear(String(data.annee_academique?.id || ""));
        setSelectedSession(
          (current) => current || String(data.sessions?.[0]?.id || ""),
        );
        setUniversity(universityData);
        localStorage.setItem("student_profile", JSON.stringify(data.etudiant));
      })
      .catch(() => {
        clearStudentSession();
        navigate("/login", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = editableFields.reduce(
        (values, [name]) => {
          values[name] = form[name] ?? "";
          return values;
        },
        { adresse: form.adresse ?? "" },
      );
      const data = await studentAccountApi.updateProfile(payload);
      setStudent(data);
      setForm(data);
      localStorage.setItem("student_profile", JSON.stringify(data));
      setEditing(false);
      toast.success("Vos informations ont été mises à jour");
    } catch (error) {
      const details = error.response?.data;
      const message =
        details && typeof details === "object"
          ? Object.values(details).flat()[0]
          : "Impossible de modifier le profil";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearStudentSession();
    navigate("/login", { replace: true });
  };

  const refreshDisplayedData = async () => {
    setRefreshing(true);
    try {
      const data = await studentAccountApi.getSpace(selectedYear);
      setStudent(data.etudiant);
      setForm(data.etudiant);
      setSpace(data);
      setSelectedYear(String(data.annee_academique?.id || ""));
      setSelectedSession(
        (current) => current || String(data.sessions?.[0]?.id || ""),
      );
      localStorage.setItem("student_profile", JSON.stringify(data.etudiant));
      toast.success("Données actualisées");
    } catch {
      toast.error("Impossible d’actualiser les données");
    } finally {
      setRefreshing(false);
    }
  };

  const changeAcademicYear = async (anneeId) => {
    setRefreshing(true);
    try {
      const data = await studentAccountApi.getSpace(anneeId);
      setStudent(data.etudiant);
      setForm(data.etudiant);
      setSpace(data);
      setSelectedYear(String(data.annee_academique?.id || anneeId));
      setSelectedSession(String(data.sessions?.[0]?.id || ""));
      toast.success(`Résultats de ${data.annee_academique?.nom || 'l’année sélectionnée'} chargés`);
    } catch (error) {
      toast.error(error.response?.data?.annee_academique?.[0] || "Impossible de charger cette année");
    } finally {
      setRefreshing(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const response = await studentAccountApi.changePassword(passwords);
      toast.success(response.message);
      setPasswords({ ancien_mot_de_passe: "", nouveau_mot_de_passe: "", confirmer_mot_de_passe: "" });
      setVisiblePasswords({});
    } catch (error) {
      const details = error.response?.data;
      toast.error(details && typeof details === "object" ? Object.values(details).flat()[0] : "Impossible de modifier le mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Chargement de votre espace...
      </div>
    );
  }

  if (!student) return null;
  const anneeAcademique = space.annee_academique;
  const sessionAffichee = space.sessions?.find((session) => String(session.id) === selectedSession);

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" richColors />
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 ring-1 ring-white/15">
              {university?.logo || university?.logo_url ? (
                <img
                  src={university.logo || university.logo_url}
                  alt="Logo de l’université"
                  className="h-full w-full rounded-lg object-contain"
                />
              ) : (
                <GraduationCap className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {university?.sigle || university?.nom || "Université"}
              </p>
              <p className="text-xs text-emerald-200">
                Espace étudiant · {student.matricule}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshDisplayedData}
              disabled={refreshing}
              title="Actualiser les données"
              aria-label="Actualiser les données"
              className="rounded-lg bg-white/10 p-2.5 transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <section className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-3xl font-bold ring-4 ring-white/15">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.nom_complet}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  {student.prenom?.[0]}
                  {student.nom?.[0]}
                </>
              )}
            </div>
            <div>
              <p className="text-sm text-emerald-100">
                Bienvenue dans votre espace
              </p>
              <h1 className="text-3xl font-bold">{student.nom_complet}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-emerald-50">
                <span>{student.faculte_nom}</span>
                <span>•</span>
                <span>{student.promotion_nom}</span>
              </div>
            </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:min-w-80"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Année académique affichée</p><p className="mt-1 text-lg font-black">{anneeAcademique?.nom || 'Non définie'}</p></div><CalendarDays className="h-7 w-7 text-emerald-100" /></div><select value={selectedYear} onChange={(event) => changeAcademicYear(event.target.value)} disabled={refreshing} className="mt-3 w-full rounded-xl border border-white/20 bg-emerald-950/70 px-3 py-2 text-sm font-bold text-white outline-none disabled:opacity-50">{student.parcours_academique?.map((inscription) => <option key={inscription.id} value={inscription.annee_academique}>{inscription.annee_academique_nom} · {inscription.promotion_nom}{inscription.est_courante ? ' · Courante' : ''}</option>)}</select><p className="mt-3 text-sm text-emerald-50">{anneeAcademique ? `${anneeAcademique.date_debut} — ${anneeAcademique.date_fin}` : 'Période non disponible'}</p><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${anneeAcademique?.est_active ? 'bg-emerald-300/20 text-white' : 'bg-amber-300/20 text-amber-50'}`}>{anneeAcademique?.est_active ? 'Année active par défaut' : 'Consultation des résultats passés'}</span></div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ["overview", "Aperçu", GraduationCap],
            ["courses", "Mes cours", BookOpen],
            ["fees", "Mes frais", WalletCards],
            ["journey", "Mon parcours", Milestone],
            ["profile", "Mon profil", User],
            ["security", "Sécurité", ShieldCheck],
          ].map(([section, label, Icon]) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeSection === section ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeSection === "overview" && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Cours appliqués",
                space.cours.length,
                BookOpen,
                "bg-indigo-600",
              ],
              [
                "Cours évalués",
                space.cours.filter((cours) => cours.points_obtenus !== null)
                  .length,
                ClipboardList,
                "bg-violet-600",
              ],
              [
                "Total payé",
                `${Number(space.resume_financier.total_paye || 0).toLocaleString("fr-FR")} FC`,
                BadgeCheck,
                "bg-emerald-600",
              ],
              [
                "Solde restant",
                `${Number(space.resume_financier.solde || 0).toLocaleString("fr-FR")} FC`,
                Banknote,
                "bg-amber-500",
              ],
            ].map(([label, value, Icon, color]) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {value}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 text-white ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeSection === "courses" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Mes cours et mes points
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consultez vos résultats selon la session d’évaluation. Les
                  anciennes sessions restent disponibles.
                </p>
              </div>
              <label className="text-sm font-semibold text-slate-600">
                Session
                <select
                  value={selectedSession}
                  onChange={(event) => setSelectedSession(event.target.value)}
                  className="mt-1.5 block min-w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal"
                >
                  <option value="">Sélectionner une session</option>
                  {(space.sessions || []).map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.est_active ? "● " : ""}
                      {session.nom}
                      {session.est_rattrapage
                        ? ` — rattrapage de ${session.session_origine_nom}`
                        : ""}
                      {!session.resultats_publies ? " — résultats en attente" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Cours",
                      "TP",
                      "Interro",
                      "Examen",
                      "Total",
                      "Résultat",
                      "Observation",
                    ].map((titre) => (
                      <th
                        key={titre}
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        {titre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {space.cours.length ? (
                    space.cours.map((cours) => {
                      const cotation = sessionAffichee?.est_cloture
                        ? sessionAffichee.resultats_consolides?.find((item) => String(item.cours_id) === String(cours.cours))
                        : cours.cotations?.find((item) => String(item.session) === selectedSession);
                      const obtenu = cotation?.total ?? null;
                      const maximum = Number(cours.cours_points || 0);
                      const resultat = resultatAcademique(obtenu, maximum);
                      const note = (valeur, max) =>
                        valeur == null ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span className="font-semibold">
                            {Number(valeur).toLocaleString("fr-FR")}
                            <small className="text-slate-400">/{max}</small>
                          </span>
                        );
                      const maxExamen = Math.max(
                        0,
                        maximum -
                          (cotation?.points_tp != null ? 5 : 0) -
                          (cotation?.points_interro != null ? 5 : 0),
                      );
                      return (
                        <tr key={cours.id} className="hover:bg-emerald-50/30">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {cours.cours_nom}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {note(cotation?.points_tp, 5)}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {note(cotation?.points_interro, 5)}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {note(cotation?.points_examen, maxExamen)}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {obtenu === null
                              ? "Non coté"
                              : `${Number(obtenu).toLocaleString("fr-FR")} / ${maximum}`}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${resultat.classes}`}
                            >
                              {resultat.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {cotation?.observation || "—"}
                            {cotation?.session_source_nom ? <span className="mt-1 block text-xs text-violet-600">Meilleure cote : {cotation.session_source_nom}</span> : null}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-sm text-slate-400"
                      >
                        Aucun cours ne vous est encore appliqué.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "journey" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Progression académique</p><h2 className="mt-1 text-2xl font-black text-slate-900">Mon parcours universitaire</h2><p className="mt-1 text-sm text-slate-500">Chaque étape correspond à une inscription annuelle du même étudiant et du même matricule.</p></div>
            {student.parcours_academique?.length ? (
              <div className="relative space-y-4 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-0.5 before:bg-emerald-100">
                {student.parcours_academique.map((inscription) => {
                  const statuts = { INSCRIT: 'Inscrit', ADMIS: 'Admis au niveau suivant', AJOURNE: 'Ajourné', TERMINE: 'Cursus terminé' };
                  return <article key={inscription.id} className="relative ml-0 flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 pl-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"><div className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${inscription.est_courante ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}><GraduationCap className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-black text-slate-900">{inscription.annee_academique_nom} · {inscription.promotion_nom}</h3><p className="mt-1 text-sm text-slate-600">{inscription.faculte_nom}{inscription.departement_nom ? ` · ${inscription.departement_nom}` : ''}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${inscription.est_courante ? 'bg-emerald-100 text-emerald-700' : inscription.statut === 'AJOURNE' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>{inscription.est_courante ? 'Inscription courante' : statuts[inscription.statut] || inscription.statut}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">Inscrit le {new Date(`${inscription.date_inscription}T00:00:00`).toLocaleDateString('fr-FR')}</span><span className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">Statut : {statuts[inscription.statut] || inscription.statut}</span></div></div></article>;
                })}
              </div>
            ) : <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500"><Milestone className="mx-auto mb-3 h-9 w-9 text-slate-300" />Aucun historique académique disponible.</div>}
          </section>
        )}

        {activeSection === "fees" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Détail de mes frais
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Montants appliqués et paiements validés pour votre année
                académique.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {space.frais.length ? (
                space.frais.map((frais) => (
                  <article
                    key={frais.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {frais.type_frais?.nom || "Frais académique"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {frais.semestre === 1
                            ? "1er semestre"
                            : "2ème semestre"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${frais.statut_paiement === "paye" ? "bg-emerald-100 text-emerald-700" : frais.statut_paiement === "partiel" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {frais.statut_paiement === "paye"
                          ? "Payé"
                          : frais.statut_paiement === "partiel"
                            ? "Partiel"
                            : "Non payé"}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-slate-400">À payer</p>
                        <p className="mt-1 text-sm font-bold">
                          {Number(frais.montant_total).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Payé</p>
                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          {Number(frais.total_paye).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Solde</p>
                        <p className="mt-1 text-sm font-bold text-amber-700">
                          {Number(frais.solde_restant).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  Aucun frais ne vous est encore appliqué.
                </p>
              )}
            </div>
          </section>
        )}

        {activeSection === "profile" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Informations personnelles
                  </h2>
                  <p className="text-sm text-slate-500">
                    Vous pouvez mettre à jour vos coordonnées.
                  </p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" /> Modifier
                  </button>
                )}
              </div>

              {editing ? (
                <form
                  onSubmit={handleSave}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {editableFields.map(([name, label, type]) => (
                    <label
                      key={name}
                      className="text-sm font-medium text-slate-700"
                    >
                      {label}
                      <input
                        type={type}
                        value={form[name] ?? ""}
                        onChange={(event) =>
                          setForm({ ...form, [name]: event.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                  ))}
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Adresse
                    <textarea
                      rows="3"
                      value={form.adresse ?? ""}
                      onChange={(event) =>
                        setForm({ ...form, adresse: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <div className="flex justify-end gap-3 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(student);
                        setEditing(false);
                      }}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" /> Annuler
                    </button>
                    <button
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />{" "}
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Info
                    icon={User}
                    label="Identité"
                    value={student.nom_complet}
                  />
                  <Info
                    icon={CalendarDays}
                    label="Date de naissance"
                    value={student.date_naissance}
                  />
                  <Info
                    icon={Phone}
                    label="Téléphone"
                    value={student.telephone}
                  />
                  <Info
                    icon={Mail}
                    label="Email"
                    value={student.email || "Non renseigné"}
                  />
                  <Info icon={MapPin} label="Adresse" value={student.adresse} />
                  <Info
                    icon={Users}
                    label="Parent / tuteur"
                    value={`${student.parent_nom} — ${student.parent_telephone}`}
                  />
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 font-bold text-slate-900">
                  Situation académique
                </h2>
                <div className="space-y-4">
                  <Info
                    icon={GraduationCap}
                    label="Faculté"
                    value={student.faculte_nom}
                  />
                  <Info
                    icon={GraduationCap}
                    label="Département"
                    value={student.departement_nom || 'Non défini'}
                  />
                  <Info
                    icon={BookOpen}
                    label="Promotion"
                    value={student.promotion_nom}
                  />
                  <Info
                    icon={CalendarDays}
                    label="Année académique"
                    value={student.annee_academique_nom || "Non définie"}
                  />
                  <Info
                    icon={ShieldCheck}
                    label="Statut des frais"
                    value={student.statut_frais}
                  />
                </div>
              </section>
            </aside>
          </div>
        )}

        {activeSection === "security" && (
          <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><KeyRound className="h-6 w-6" /></div>
              <div><h2 className="text-xl font-bold text-slate-900">Changer mon mot de passe</h2><p className="text-sm text-slate-500">Utilisez au moins 8 caractères pour votre nouveau mot de passe.</p></div>
            </div>
            <form onSubmit={changePassword} className="space-y-4">
              {[["ancien_mot_de_passe", "Mot de passe actuel"], ["nouveau_mot_de_passe", "Nouveau mot de passe"], ["confirmer_mot_de_passe", "Confirmer le nouveau mot de passe"]].map(([name, label]) => (
                <label key={name} className="block text-sm font-semibold text-slate-700">{label}
                  <div className="relative mt-1.5">
                    <input type={visiblePasswords[name] ? "text" : "password"} required minLength={name === "ancien_mot_de_passe" ? undefined : 8} value={passwords[name]} onChange={(event) => setPasswords({...passwords, [name]: event.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                    <button type="button" onClick={() => setVisiblePasswords({...visiblePasswords, [name]: !visiblePasswords[name]})} aria-label={visiblePasswords[name] ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700">{visiblePasswords[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </label>
              ))}
              <button disabled={savingPassword} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{savingPassword ? "Modification..." : "Modifier le mot de passe"}</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

const Info = ({ icon: Icon, label, value }) => (
  <div className="flex gap-3">
    <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-700">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">
        {value || "Non renseigné"}
      </p>
    </div>
  </div>
);

export default ProfilEtudiant;

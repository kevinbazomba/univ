/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, GraduationCap, Save, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { api } from "../../../services/apiClient";

const JuryCotesEtudiants = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [cotes, setCotes] = useState([]);
  const [coursOptions, setCoursOptions] = useState([]);
  const [coursId, setCoursId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    points_tp: "",
    points_interro: "",
    points_examen: "",
    observation: "",
  });

  const stats = useMemo(() => {
    const notes = cotes.filter((item) => item.total !== null && item.total !== undefined);
    const nonNotes = cotes.length - notes.length;
    const moyenne = notes.length
      ? notes.reduce((total, item) => total + Number(item.total || 0), 0) / notes.length
      : 0;
    return { notes: notes.length, nonNotes, moyenne };
  }, [cotes]);

  async function chargerContexte() {
    const response = await api.get("jury/contexte/");
    const sessionsChargees = response.data.sessions || [];
    setSessions(sessionsChargees);
    const sessionParDefaut =
      sessionsChargees.find((session) => session.est_active) || sessionsChargees[0];
    if (sessionParDefaut) {
      setSessionId(String(sessionParDefaut.id));
    }
  }

  async function chargerCotes(session = sessionId) {
    if (!session) return;
    setLoading(true);
    try {
      const response = await api.get("jury/cotes/", {
        session,
        search,
        cours: coursId,
      });
      setCoursOptions(response.data.cours || []);
      setCotes(response.data.cotes || []);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.error ||
          "Impossible de charger les cotes",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerContexte();
  }, []);

  useEffect(() => {
    chargerCotes();
  }, [sessionId]);

  function ouvrirModification(item) {
    setSelected(item);
    setForm({
      points_tp: item.points_tp ?? "",
      points_interro: item.points_interro ?? "",
      points_examen: item.points_examen ?? "",
      observation: item.observation || "",
    });
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!selected) return;
    try {
      await api.post("jury/modifier-cote/", {
        application_id: selected.application_id,
        session_id: selected.session_id,
        ...form,
      });
      toast.success("Cote délibérée");
      setSelected(null);
      await chargerCotes();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.points_tp?.[0] ||
          error.response?.data?.points_interro?.[0] ||
          error.response?.data?.points_examen?.[0] ||
          error.response?.data?.error ||
          "Modification impossible",
      );
    }
  }

  const maximumExamen = selected
    ? Math.max(
        0,
        Number(selected.cours_points || 20) -
          (form.points_tp !== "" ? 5 : 0) -
          (form.points_interro !== "" ? 5 : 0),
      )
    : 0;
  const formatNote = (value) => value ?? "ND";
  const ligneClasse = (item) => {
    if (item.total === null || item.total === undefined) return "hover:bg-slate-50/80";
    return Number(item.total) >= Number(item.cours_points || 20) / 2
      ? "bg-blue-100 hover:bg-blue-200/80"
      : "bg-rose-100 hover:bg-rose-200/80";
  };

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8 text-white shadow-xl">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-blue-200">Jury académique</p>
                <h1 className="text-3xl font-black">Cotes des étudiants</h1>
                <p className="mt-1 max-w-3xl text-sm text-blue-100/75">
                  Visualisez et modifiez les points des étudiants dans le
                  périmètre autorisé par le jeton.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => chargerCotes()}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                Actualiser
              </button>
              <button
                onClick={() => navigate("/jury")}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au jury
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Cotes saisies" value={stats.notes} color="emerald" />
          <StatCard label="Non cotés" value={stats.nonNotes} color="amber" />
          <StatCard label="Moyenne générale" value={stats.moyenne.toFixed(2)} color="blue" />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[240px_260px_1fr_auto] lg:items-end">
            <label className="block text-sm font-bold text-slate-700">
              Session
              <select
                value={sessionId}
                onChange={(event) => {
                  setSessionId(event.target.value);
                  setCoursId("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Cours
              <select
                value={coursId}
                onChange={(event) => setCoursId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500"
              >
                <option value="">Tous les cours</option>
                {coursOptions.map((cours) => (
                  <option key={cours.id} value={cours.id}>
                    {cours.nom_cours}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Recherche
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nom, matricule ou cours..."
                  className="w-full bg-transparent font-normal outline-none"
                />
              </div>
            </label>
            <button
              onClick={() => chargerCotes()}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Rechercher
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Étudiant", "Cours", "TP", "Interro", "Examen", "Total", "Action"].map((titre) => (
                    <th key={titre} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      {titre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                      Chargement des cotes...
                    </td>
                  </tr>
                ) : cotes.length ? (
                  cotes.map((item) => (
                    <tr key={`${item.application_id}-${item.session_id}`} className={ligneClasse(item)}>
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-900">{item.nom_complet}</p>
                        <p className="text-xs text-slate-500">{item.matricule}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{item.cours_nom}</td>
                      <td className="px-4 py-3">{formatNote(item.points_tp)}</td>
                      <td className="px-4 py-3">{formatNote(item.points_interro)}</td>
                      <td className="px-4 py-3">{formatNote(item.points_examen)}</td>
                      <td className="px-4 py-3 font-black">{formatNote(item.total)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => ouvrirModification(item)}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Délibérer
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                      Aucune cote trouvée pour cette session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form
              onSubmit={enregistrer}
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Délibérer la cote
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.nom_complet} · {selected.cours_nom}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="TP / 5">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={form.points_tp}
                    onChange={(event) => setForm({ ...form, points_tp: event.target.value })}
                  />
                </Field>
                <Field label="Interro / 5">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={form.points_interro}
                    onChange={(event) => setForm({ ...form, points_interro: event.target.value })}
                  />
                </Field>
                <Field label={`Examen / ${maximumExamen}`}>
                  <input
                    type="number"
                    min="0"
                    max={maximumExamen}
                    step="0.01"
                    value={form.points_examen}
                    onChange={(event) => setForm({ ...form, points_examen: event.target.value })}
                  />
                </Field>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase text-blue-500">Total</p>
                  <p className="mt-1 text-2xl font-black text-blue-800">
                    {[form.points_tp, form.points_interro, form.points_examen]
                      .filter((value) => value !== "")
                      .reduce((total, value) => total + Number(value || 0), 0)
                      .toFixed(2)}{" "}
                    / {selected.cours_points}
                  </p>
                </div>
              </div>

              <Field label="Observation">
                <textarea
                  rows="3"
                  value={form.observation}
                  onChange={(event) => setForm({ ...form, observation: event.target.value })}
                />
              </Field>

              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800">
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${colors[color]}`}>
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="mt-4 block text-sm font-bold text-slate-700">
    {label}
    <div className="mt-2 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:px-4 [&_input]:py-3 [&_input]:font-normal [&_input]:outline-none [&_input:focus]:border-blue-500 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:font-normal [&_textarea]:outline-none [&_textarea:focus]:border-blue-500">
      {children}
    </div>
  </label>
);

export default JuryCotesEtudiants;

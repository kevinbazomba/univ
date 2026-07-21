/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Medal, RefreshCw, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { api } from "../../../services/apiClient";

const JuryFinAnnee = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const stats = useMemo(() => ({
    total: resultats.length,
    promouvables: resultats.filter((item) => item.promouvable).length,
    ajournes: resultats.filter((item) => !item.promouvable).length,
  }), [resultats]);

  async function chargerContexte() {
    const response = await api.get("jury/contexte/");
    const clotures = (response.data.sessions || []).filter(
      (session) => session.est_cloture && session.est_fin_annee,
    );
    setSessions(clotures);
    if (clotures[0]) setSessionId(String(clotures[0].id));
  }

  async function chargerResultats(session = sessionId) {
    if (!session) return;
    setLoading(true);
    try {
      const response = await api.get("jury/resultats-fin-annee/", { session });
      setResultats(response.data.resultats || []);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.session?.[0] ||
          error.response?.data?.error ||
          "Impossible de charger les résultats fin d’année",
      );
    } finally {
      setLoading(false);
    }
  }

  async function appliquerDecisions() {
    if (!sessionId) return;
    if (!window.confirm("Appliquer les décisions calculées par le jury ?")) return;
    setLoading(true);
    try {
      const response = await api.post("jury/appliquer-resultats-fin-annee/", {
        session_id: sessionId,
      });
      toast.success(response.data.message || "Décisions appliquées");
      await chargerResultats();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Application impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerContexte();
  }, []);

  useEffect(() => {
    chargerResultats();
  }, [sessionId]);

  const decisionClasse = (decision) => {
    if (["S", "D", "GD"].includes(decision)) return "bg-blue-700 text-white";
    if (decision === "NF") return "bg-slate-200 text-slate-800";
    return "bg-red-700 text-white";
  };

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950 to-orange-900 p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Medal className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-amber-200">Clôture annuelle</p>
                <h1 className="text-3xl font-black">Résultats fin d’année</h1>
                <p className="mt-1 max-w-3xl text-sm text-amber-100/75">
                  Calcul automatique du pourcentage, des échecs, des cotes
                  manquantes et de la décision finale du jury.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/jury")}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au jury
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Étudiants traitables" value={stats.total} />
          <Stat label="Promouvables S/D/GD" value={stats.promouvables} />
          <Stat label="Non promouvables" value={stats.ajournes} />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <label className="block text-sm font-bold text-slate-700">
              Session de clôture fin d’année
              <select
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-amber-500"
              >
                <option value="">Choisir une clôture fin d’année</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.nom} · {session.date_debut} — {session.date_fin}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => chargerResultats()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
            <button
              onClick={appliquerDecisions}
              disabled={!resultats.length || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Appliquer
            </button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Étudiant", "Promotion", "%", "Décision", "EL", "EG", "ND", "Action"].map((titre) => (
                    <th key={titre} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">
                      {titre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">Calcul en cours...</td></tr>
                ) : resultats.length ? resultats.map((item) => (
                  <tr key={item.etudiant_id} className={item.promouvable ? "bg-blue-200/80" : "bg-red-200/90"}>
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900">{item.nom_complet}</p>
                      <p className="text-xs text-slate-500">{item.matricule}</p>
                    </td>
                    <td className="px-4 py-3">{item.promotion_nom}</td>
                    <td className="px-4 py-3 font-black">{item.pourcentage_arrondi}%</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${decisionClasse(item.decision)}`}>
                        {item.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.echecs_legers}</td>
                    <td className="px-4 py-3">{item.echecs_graves}</td>
                    <td className="px-4 py-3">{item.cotes_manquantes}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(item)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                        <Eye className="h-3.5 w-3.5" />
                        Détail
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">Aucun étudiant à calculer pour cette clôture.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {detail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{detail.nom_complet}</h2>
                  <p className="text-sm text-slate-500">
                    Total max {detail.total_max} · Total pondéré {detail.total_pondere} · Points pondérés {detail.total_points_ponderes} · {detail.pourcentage_arrondi}%
                  </p>
                </div>
                <button onClick={() => setDetail(null)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">Fermer</button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Mini label="Échec léger" value={detail.echecs_legers} />
                <Mini label="Échec grave" value={detail.echecs_graves} />
                <Mini label="Cotes manquantes" value={detail.cotes_manquantes} />
                <Mini label="Décision" value={detail.decision} />
                <Mini label="Promotion" value={detail.promouvable ? "Oui" : "Non"} />
              </div>
              <div className="mt-5 overflow-x-auto rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Cours", "Total", "Max", "Pond.", "Session", "Branches"].map((titre) => (
                        <th key={titre} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{titre}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detail.details?.map((note) => (
                      <tr key={note.cours_id}>
                        <td className="px-4 py-3 font-bold">{note.cours_nom}</td>
                        <td className="px-4 py-3">{note.total}</td>
                        <td className="px-4 py-3">{note.maximum}</td>
                        <td className="px-4 py-3">{note.ponderation}</td>
                        <td className="px-4 py-3">{note.session_nom}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {note.branches?.map((branche) => branche.cours_nom).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
    <p className="text-xs font-black uppercase text-amber-600">{label}</p>
    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
  </div>
);

const Mini = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
  </div>
);

export default JuryFinAnnee;

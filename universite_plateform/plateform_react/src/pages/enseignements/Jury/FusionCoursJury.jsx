/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Filter,
  GitBranch,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { api } from "../../../services/apiClient";

const FusionCoursJury = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cours, setCours] = useState([]);
  const [fusions, setFusions] = useState([]);
  const [rechercheCours, setRechercheCours] = useState("");
  const [referentiels, setReferentiels] = useState({
    annees: [],
    facultes: [],
    departements: [],
    promotions: [],
  });
  const [filters, setFilters] = useState({
    annee_academique: "",
    faculte: "",
    departement: "",
    promotion: "",
    search: "",
  });
  const [form, setForm] = useState({
    nom_cours_fusionne: "",
    cours: [],
    annee_academique: "",
    faculte: "",
    departement: "",
    promotion: "",
    est_active: true,
  });

  const anneeActive = useMemo(
    () => referentiels.annees.find((annee) => annee.est_active) || null,
    [referentiels.annees],
  );

  const departementsForm = useMemo(() => {
    if (!form.faculte) return referentiels.departements;
    return referentiels.departements.filter(
      (departement) => String(departement.faculte_id) === String(form.faculte),
    );
  }, [referentiels.departements, form.faculte]);

  const departementsFiltres = useMemo(() => {
    if (!filters.faculte) return referentiels.departements;
    return referentiels.departements.filter(
      (departement) =>
        String(departement.faculte_id) === String(filters.faculte),
    );
  }, [referentiels.departements, filters.faculte]);

  const coursSelectionnes = useMemo(
    () => cours.filter((item) => form.cours.includes(String(item.id))),
    [cours, form.cours],
  );

  const coursDisponibles = useMemo(
    () =>
      cours.filter((item) => {
        const dejaChoisi = form.cours.includes(String(item.id));
        const texte = `${item.nom_cours} ${item.code_cours || ""}`.toLowerCase();
        return !dejaChoisi && texte.includes(rechercheCours.toLowerCase());
      }),
    [cours, form.cours, rechercheCours],
  );

  const fusionsFiltrees = useMemo(
    () =>
      fusions.filter((fusion) =>
        `${fusion.nom_cours_fusionne} ${fusion.cours_details
          ?.map((item) => item.nom_cours)
          .join(" ")}`
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      ),
    [fusions, filters.search],
  );

  async function chargerReferentiels() {
    const response = await api.get("jury/contexte/");
    const annees = response.data.annees || [];
    const active = annees.find((annee) => annee.est_active) || annees[0];

    setReferentiels({
      annees,
      facultes: response.data.facultes || [],
      departements: response.data.departements || [],
      promotions: response.data.promotions || [],
    });

    if (active) {
      const activeId = String(active.id);
      setForm((courant) => ({ ...courant, annee_academique: activeId }));
      setFilters((courant) => ({ ...courant, annee_academique: activeId }));
    }
  }

  async function chargerCours() {
    const response = await api.get("cours/");
    const donnees = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
    setCours(donnees);
  }

  async function chargerFusions() {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) => key !== "search" && value,
        ),
      );
      const response = await api.get("fusions-cours-jury/", params);
      const donnees = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setFusions(donnees);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les fusions de cours");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([chargerReferentiels(), chargerCours()]);
  }, []);

  useEffect(() => {
    chargerFusions();
  }, [
    filters.annee_academique,
    filters.faculte,
    filters.departement,
    filters.promotion,
  ]);

  function ajouterCours(coursId) {
    setForm((courant) => ({
      ...courant,
      cours: courant.cours.includes(String(coursId))
        ? courant.cours
        : [...courant.cours, String(coursId)],
    }));
  }

  function retirerCours(coursId) {
    setForm((courant) => ({
      ...courant,
      cours: courant.cours.filter((id) => String(id) !== String(coursId)),
    }));
  }

  async function creerFusion(event) {
    event.preventDefault();
    if (!form.annee_academique) {
      return toast.error("Aucune année académique active trouvée");
    }
    if (!form.nom_cours_fusionne.trim()) {
      return toast.error("Définissez le nom du cours fusionné");
    }
    if (form.cours.length < 2) {
      return toast.error("Choisissez au moins deux branches/cours");
    }

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== ""),
      );
      await api.post("fusions-cours-jury/", payload);
      toast.success("Fusion de cours enregistrée");
      setForm({
        nom_cours_fusionne: "",
        cours: [],
        annee_academique: anneeActive ? String(anneeActive.id) : "",
        faculte: "",
        departement: "",
        promotion: "",
        est_active: true,
      });
      setRechercheCours("");
      await chargerFusions();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.cours?.[0] ||
          error.response?.data?.nom_cours_fusionne?.[0] ||
          "Création impossible",
      );
    }
  }

  async function changerEtat(fusion) {
    try {
      await api.patch(`fusions-cours-jury/${fusion.id}/`, {
        est_active: !fusion.est_active,
      });
      toast.success(!fusion.est_active ? "Fusion activée" : "Fusion désactivée");
      await chargerFusions();
    } catch (error) {
      console.error(error);
      toast.error("Modification impossible");
    }
  }

  async function supprimerFusion(fusion) {
    const ok = window.confirm(
      `Supprimer la fusion "${fusion.nom_cours_fusionne}" ? Les cours réels ne seront pas supprimés.`,
    );
    if (!ok) return;

    try {
      await api.delete(`fusions-cours-jury/${fusion.id}/`);
      toast.success("Fusion supprimée");
      await chargerFusions();
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-[1450px]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 p-8 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <GitBranch className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-cyan-200">Jury académique</p>
                <h1 className="text-3xl font-black">Fusionnement des cours</h1>
                <p className="mt-1 max-w-3xl text-sm text-cyan-100/75">
                  Regroupez plusieurs branches en un seul cours de jury, par
                  exemple Ostéologie + Myologie sous Anatomie.
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

        <section className="mt-6 grid gap-6 xl:grid-cols-[480px_1fr]">
          <form
            onSubmit={creerFusion}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-900">Nouvelle fusion</h2>
                <p className="text-xs text-slate-500">
                  L’année active est appliquée automatiquement.
                </p>
              </div>
            </div>

            {anneeActive && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Année active : {anneeActive.nom}
              </div>
            )}

            <label className="block text-sm font-bold text-slate-700">
              Nom du cours fusionné
              <input
                value={form.nom_cours_fusionne}
                onChange={(event) =>
                  setForm((courant) => ({
                    ...courant,
                    nom_cours_fusionne: event.target.value,
                  }))
                }
                placeholder="Ex. Anatomie"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-cyan-500"
              />
            </label>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="block text-sm font-bold text-slate-700">
                Rechercher un cours / une branche
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={rechercheCours}
                    onChange={(event) => setRechercheCours(event.target.value)}
                    placeholder="Ex. anatomie, ostéologie, myologie..."
                    className="w-full bg-transparent text-sm font-normal outline-none"
                  />
                </div>
              </label>

              <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                {coursDisponibles.slice(0, 12).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => ajouterCours(item.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    <span className="block text-sm font-black text-slate-900">
                      {item.nom_cours}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.code_cours || "Sans code"} · {item.credit || 0}{" "}
                      crédit(s) · {item.points || 20} pts
                    </span>
                  </button>
                ))}
                {!coursDisponibles.length && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                    Aucun cours disponible pour cette recherche.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-cyan-950">
                    Canevas récapitulatif
                  </p>
                  <p className="text-xs text-cyan-700">
                    {coursSelectionnes.length} cours/branche(s) choisi(s)
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">
                  Min. 2
                </span>
              </div>

              {coursSelectionnes.length ? (
                <div className="space-y-2">
                  {coursSelectionnes.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {index + 1}. {item.nom_cours}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.code_cours || "Sans code"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => retirerCours(item.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-cyan-300 bg-white/70 p-4 text-center text-xs text-cyan-700">
                  Cliquez sur les cours recherchés pour constituer la fusion.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectFiltre
                label="Faculté"
                value={form.faculte}
                onChange={(value) =>
                  setForm((courant) => ({
                    ...courant,
                    faculte: value,
                    departement: "",
                  }))
                }
                options={referentiels.facultes}
              />
              <SelectFiltre
                label="Département"
                value={form.departement}
                onChange={(value) =>
                  setForm((courant) => ({ ...courant, departement: value }))
                }
                options={departementsForm}
              />
              <SelectFiltre
                label="Promotion"
                value={form.promotion}
                onChange={(value) =>
                  setForm((courant) => ({ ...courant, promotion: value }))
                }
                options={referentiels.promotions}
              />
            </div>

            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800">
              <Save className="h-4 w-4" />
              Enregistrer la fusion
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-black text-slate-900">Règles de fusion</h2>
                <p className="text-sm text-slate-500">
                  Ces règles s’appliquent automatiquement aux résultats
                  consolidés de l’année active.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((courant) => ({
                      ...courant,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Rechercher..."
                  className="bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <SelectFiltre
                label="Faculté"
                value={filters.faculte}
                onChange={(value) =>
                  setFilters((courant) => ({
                    ...courant,
                    faculte: value,
                    departement: "",
                  }))
                }
                options={referentiels.facultes}
                icon={<Filter className="h-3.5 w-3.5" />}
              />
              <SelectFiltre
                label="Département"
                value={filters.departement}
                onChange={(value) =>
                  setFilters((courant) => ({ ...courant, departement: value }))
                }
                options={departementsFiltres}
              />
              <SelectFiltre
                label="Promotion"
                value={filters.promotion}
                onChange={(value) =>
                  setFilters((courant) => ({ ...courant, promotion: value }))
                }
                options={referentiels.promotions}
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Chargement...
              </div>
            ) : fusionsFiltrees.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {fusionsFiltrees.map((fusion) => (
                  <article
                    key={fusion.id}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-900">
                          {fusion.nom_cours_fusionne}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            fusion.annee_academique_nom,
                            fusion.faculte_nom,
                            fusion.departement_nom,
                            fusion.promotion_nom,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Règle générale"}
                        </p>
                      </div>
                      <button
                        onClick={() => changerEtat(fusion)}
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          fusion.est_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {fusion.est_active ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {fusion.cours_details?.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700"
                        >
                          {item.nom_cours}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => supprimerFusion(fusion)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                Aucune fusion de cours trouvée pour l’année active.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
};

const SelectFiltre = ({ label, value, onChange, options, icon = null }) => (
  <label className="block text-xs font-black uppercase tracking-wide text-slate-500">
    <span className="flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case text-slate-700 outline-none focus:border-cyan-500"
    >
      <option value="">Tous</option>
      {options.map((item) => (
        <option key={item.id} value={item.id}>
          {item.nom}
        </option>
      ))}
    </select>
  </label>
);

export default FusionCoursJury;

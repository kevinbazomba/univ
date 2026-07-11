import { useEffect, useMemo, useState } from "react";
import { etudiantApi } from "../../services/etudiants/etudiantApi";
import { anneeApi } from "../../services/etudiants/anneeApi";
import { Link } from "react-router-dom";
import {
  User,
  Eye,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
  Search,
  Download,
  Filter,
  X,
  Banknote,
  WalletCards,
  Users,
  ChevronRight,
} from "lucide-react";
import { fraisApi } from "../../services/frais";
import { universityApi } from "../../services/universityApi";
import * as XLSX from "xlsx";

export default function FraisList() {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [university, setUniversity] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [annees, setAnnees] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(null);
  const [fraisAnnee, setFraisAnnee] = useState([]);
  const [paiementsAnnee, setPaiementsAnnee] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    faculte: "all",
    promotion: "all",
    statut: "all",
  });
  const anneeModifiable = Boolean(
    annees.find((annee) => String(annee.id) === String(anneeSelectionnee))
      ?.est_active,
  );

  useEffect(() => {
    universityApi
      .getIdentity()
      .then(setUniversity)
      .catch(() => null);
    anneeApi
      .getAll()
      .then((response) => {
        const liste = response.data || [];
        setAnnees(liste);
        setAnneeSelectionnee(
          liste.find((annee) => annee.est_active)?.id || liste[0]?.id || "",
        );
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!anneeSelectionnee) return;
      try {
        // Récupérer les données
        const etudiantsRes = await etudiantApi.getAll(anneeSelectionnee);
        const fraisRes = await fraisApi.getFrais(anneeSelectionnee);
        const paiementsRes = await fraisApi.getPaiements(anneeSelectionnee);

        if (!mounted) return;

        // Extraire les données des réponses
        let etudiantsList = etudiantsRes?.data || etudiantsRes || [];
        const fraisList = fraisRes?.data || fraisRes || [];
        const paiementsList = paiementsRes?.data || paiementsRes || [];
        setFraisAnnee(fraisList);
        setPaiementsAnnee(paiementsList);

        console.log("Étudiants reçus:", etudiantsList);
        console.log("Frais reçus:", fraisList);
        console.log("Paiements reçus:", paiementsList);

        // Sinon, on calcule les totaux manuellement
        const etudiantsParMatricule = new Map();
        etudiantsList = etudiantsList.map((etudiant) => {
          const matricule = etudiant.matricule || "";
          etudiantsParMatricule.set(matricule, etudiant);
          return {
            ...etudiant,
            total_a_payer: 0,
            total_paye: 0,
            solde: 0,
          };
        });

        // Map des totaux par matricule
        const totalsMap = new Map();

        // Agréger les frais (montant_total)
        fraisList.forEach((frais) => {
          let matricule = null;

          if (frais.etudiant && typeof frais.etudiant === "string") {
            matricule = frais.etudiant.split(" - ")[0];
          } else if (frais.etudiant?.matricule) {
            matricule = frais.etudiant.matricule;
          }

          if (matricule) {
            if (!totalsMap.has(matricule)) {
              totalsMap.set(matricule, { totalAPayer: 0, totalPaye: 0 });
            }
            const total = totalsMap.get(matricule);
            total.totalAPayer += Number(frais.montant_total || 0);
            totalsMap.set(matricule, total);
          }
        });

        // Agréger les paiements (montant_paye)
        paiementsList.forEach((paiement) => {
          if (paiement.statut !== "valide") return;

          let matricule = null;

          if (paiement.etudiant && typeof paiement.etudiant === "string") {
            matricule = paiement.etudiant.split(" - ")[0];
          } else if (paiement.frais?.etudiant) {
            if (typeof paiement.frais.etudiant === "string") {
              matricule = paiement.frais.etudiant.split(" - ")[0];
            } else if (paiement.frais.etudiant?.matricule) {
              matricule = paiement.frais.etudiant.matricule;
            }
          } else if (paiement.etudiant?.matricule) {
            matricule = paiement.etudiant.matricule;
          }

          if (matricule) {
            if (!totalsMap.has(matricule)) {
              totalsMap.set(matricule, { totalAPayer: 0, totalPaye: 0 });
            }
            const total = totalsMap.get(matricule);
            total.totalPaye += Number(paiement.montant_paye || 0);
            totalsMap.set(matricule, total);
          }
        });

        // Ajouter les dossiers financiers des étudiants qui ont changé de
        // promotion et ne figurent donc plus dans la liste de l'année.
        const dossiersHistoriques = new Map();
        const memoriserDossier = (frais, paiement = null) => {
          const representation = frais?.etudiant || paiement?.etudiant;
          const matricule =
            typeof representation === "string"
              ? representation.split(" - ")[0]
              : representation?.matricule;
          if (
            !matricule ||
            etudiantsParMatricule.has(matricule) ||
            dossiersHistoriques.has(matricule)
          )
            return;
          const nomComplet =
            typeof representation === "string"
              ? representation.split(" - ").slice(1).join(" - ")
              : representation?.nom_complet || "";
          dossiersHistoriques.set(matricule, {
            id: frais?.etudiant_id || paiement?.etudiant_id,
            matricule,
            nom_complet: nomComplet,
            nom: nomComplet,
            faculte_nom: frais?.faculte_nom || "",
            promotion_nom: frais?.promotion_nom || "",
          });
        };
        fraisList.forEach((frais) => memoriserDossier(frais));
        paiementsList.forEach((paiement) =>
          memoriserDossier(paiement.frais, paiement),
        );

        // Fusionner les données avec tous les étudiants ayant une trace financière.
        const listeComplete = [
          ...etudiantsList,
          ...dossiersHistoriques.values(),
        ];
        const etudiantsAvecTotaux = listeComplete.map((etudiant) => {
          const matricule = etudiant.matricule || "";
          const totals = totalsMap.get(matricule) || {
            totalAPayer: 0,
            totalPaye: 0,
          };
          const solde = Math.max(0, totals.totalAPayer - totals.totalPaye);

          return {
            ...etudiant,
            total_a_payer: totals.totalAPayer,
            total_paye: totals.totalPaye,
            solde: solde,
          };
        });

        setEtudiants(etudiantsAvecTotaux);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error("Erreur détaillée:", err);
        setError(err?.message || "Erreur lors de la récupération des données");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [anneeSelectionnee]);

  const getStatutInfo = (etudiant) => {
    // Utiliser directement les valeurs de l'étudiant si disponibles
    const totalAPayer = Number(etudiant.total_a_payer || 0);
    const totalPaye = Number(etudiant.total_paye || 0);
    const solde = Number(etudiant.solde || 0);

    let statut;
    let statutLabel;

    if (totalAPayer === 0) {
      statut = "aucun";
      statutLabel = "Aucun frais";
    } else if (solde === 0) {
      statut = "paye";
      statutLabel = "Payé";
    } else if (totalPaye > 0 && solde > 0) {
      statut = "partiel";
      statutLabel = "Partiel";
    } else {
      statut = "non_paye";
      statutLabel = "Non payé";
    }

    return { statut, statutLabel, totalAPayer, totalPaye, solde };
  };

  // Fonction pour obtenir la faculté et la promotion
  const getFaculteEtPromotion = (etudiant) => {
    const faculte = etudiant.faculte_nom || etudiant.faculte?.nom || "";
    const promotion = etudiant.promotion_nom || etudiant.promotion?.nom || "";

    if (faculte && promotion) {
      return `${faculte} - ${promotion}`;
    } else if (faculte) {
      return faculte;
    } else if (promotion) {
      return promotion;
    }
    return "-";
  };

  const filterOptions = useMemo(
    () => ({
      facultes: [
        ...new Set(etudiants.map((e) => e.faculte_nom).filter(Boolean)),
      ].sort(),
      promotions: [
        ...new Set(etudiants.map((e) => e.promotion_nom).filter(Boolean)),
      ].sort(),
    }),
    [etudiants],
  );

  const filteredEtudiants = useMemo(
    () =>
      etudiants.filter((etudiant) => {
        const search = filters.search.trim().toLowerCase();
        const searchable = [
          etudiant.matricule,
          etudiant.nom,
          etudiant.post_nom,
          etudiant.prenom,
          etudiant.email,
          etudiant.telephone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (search && !searchable.includes(search)) return false;
        if (
          filters.faculte !== "all" &&
          etudiant.faculte_nom !== filters.faculte
        )
          return false;
        if (
          filters.promotion !== "all" &&
          etudiant.promotion_nom !== filters.promotion
        )
          return false;
        if (
          filters.statut !== "all" &&
          getStatutInfo(etudiant).statut !== filters.statut
        )
          return false;
        return true;
      }),
    [etudiants, filters],
  );

  const resetFilters = () =>
    setFilters({
      search: "",
      faculte: "all",
      promotion: "all",
      statut: "all",
    });

  const handleExport = () => {
    const annee = annees.find((item) => String(item.id) === String(anneeSelectionnee));
    const matricules = new Set(filteredEtudiants.map((item) => item.matricule));
    const matricule = (valeur) => typeof valeur === "string" ? valeur.split(" - ")[0] : valeur?.matricule;
    const nom = (valeur) => typeof valeur === "string" ? valeur.split(" - ").slice(1).join(" - ") : valeur?.nom_complet || "";

    const creerFeuille = (titre, entetes, lignes, colonneSolde = null) => {
      const institution = university?.nom || "Gestion universitaire";
      const contact = [university?.adresse, university?.ville, university?.pays, university?.telephone, university?.email, university?.site_web].filter(Boolean).join(" | ");
      const contenu = [
        [institution],
        [[university?.sigle, university?.devise].filter(Boolean).join(" · ")],
        [contact],
        [`${titre} — Année ${annee?.nom || "non définie"}`],
        [`Généré le ${new Date().toLocaleString("fr-FR")}`],
        [],
        entetes,
        ...lignes,
      ];
      const feuille = XLSX.utils.aoa_to_sheet(contenu);
      const derniereColonne = entetes.length - 1;
      feuille["!merges"] = [0, 1, 2, 3, 4].map((ligne) => ({ s: { r: ligne, c: 0 }, e: { r: ligne, c: derniereColonne } }));
      feuille["!cols"] = entetes.map((entete, index) => ({ wch: Math.min(Math.max(entete.length + 4, index === 1 ? 28 : 14), 38) }));
      feuille["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 6, c: 0 }, e: { r: 6 + lignes.length, c: derniereColonne } }) };
      const styleInstitution = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 }, fill: { fgColor: { rgb: "064E3B" } }, alignment: { horizontal: "center" } };
      const styleTitre = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 }, fill: { fgColor: { rgb: "0F766E" } }, alignment: { horizontal: "center" } };
      const styleEntete = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "059669" } }, alignment: { horizontal: "center", wrapText: true } };
      const styleRetard = { font: { bold: true, color: { rgb: "9A3412" } }, fill: { fgColor: { rgb: "FED7AA" } } };
      if (feuille.A1) feuille.A1.s = styleInstitution;
      if (feuille.A4) feuille.A4.s = styleTitre;
      for (let c = 0; c <= derniereColonne; c += 1) {
        const cellule = feuille[XLSX.utils.encode_cell({ r: 6, c })];
        if (cellule) cellule.s = styleEntete;
      }
      if (colonneSolde !== null) lignes.forEach((ligne, index) => {
        if (Number(ligne[colonneSolde]) <= 0) return;
        for (let c = 0; c <= derniereColonne; c += 1) {
          const cellule = feuille[XLSX.utils.encode_cell({ r: 7 + index, c })];
          if (cellule) cellule.s = styleRetard;
        }
      });
      return feuille;
    };

    const synthese = filteredEtudiants.map((item) => { const statut = getStatutInfo(item); return [item.matricule, item.nom_complet || item.nom, item.faculte_nom || "-", item.departement_nom || "-", item.promotion_nom || "-", statut.totalAPayer, statut.totalPaye, statut.solde, statut.solde > 0 ? "À recouvrer" : statut.statutLabel]; });
    const detailsFrais = fraisAnnee.filter((item) => matricules.has(matricule(item.etudiant))).map((item) => [matricule(item.etudiant), nom(item.etudiant), item.faculte_nom || "-", item.departement_nom || "-", item.promotion_nom || "-", item.semestre, item.type_frais?.code || "-", item.type_frais?.nom || "-", Number(item.montant_total || 0), Number(item.total_paye || 0), Number(item.solde_restant || 0), item.statut_paiement]);
    const detailsPaiements = paiementsAnnee.filter((item) => matricules.has(matricule(item.etudiant))).map((item) => [item.reference, item.date_paiement, matricule(item.etudiant), nom(item.etudiant), item.frais?.faculte_nom || "-", item.frais?.departement_nom || "-", item.frais?.promotion_nom || "-", item.frais?.type_frais?.nom || "-", Number(item.montant_paye || 0), item.mode_paiement, item.statut, item.agent?.username || "-"]);

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, creerFeuille("Situation financière", ["Matricule", "Étudiant", "Faculté", "Département", "Promotion", "Total frais (FC)", "Total payé (FC)", "Solde (FC)", "Situation"], synthese, 7), "Synthèse");
    XLSX.utils.book_append_sheet(classeur, creerFeuille("Détails des frais", ["Matricule", "Étudiant", "Faculté", "Département", "Promotion", "Semestre", "Code frais", "Type de frais", "Montant (FC)", "Payé (FC)", "Solde (FC)", "Statut"], detailsFrais, 10), "Détails frais");
    XLSX.utils.book_append_sheet(classeur, creerFeuille("Historique des paiements", ["Référence", "Date", "Matricule", "Étudiant", "Faculté", "Département", "Promotion", "Type de frais", "Montant (FC)", "Mode", "Statut", "Agent"], detailsPaiements), "Paiements");
    const sigle = (university?.sigle || "universite").replace(/[^a-z0-9_-]/gi, "_");
    XLSX.writeFile(classeur, `${sigle}_situation_financiere_${annee?.nom || "annee"}_${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true, cellStyles: true });
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Chargement de la situation financière...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-red-100 bg-red-50 p-8 text-red-800 shadow-sm">
        <p className="font-semibold">Erreur :</p>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-800 px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
                <WalletCards className="h-4 w-4" />
                {university?.nom || "Gestion universitaire"}
                <ChevronRight className="h-3 w-3" />
                Finances
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Situation financière des étudiants
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-100/75">
                Suivez les frais appliqués, les paiements validés et les soldes
                restant à recouvrer.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <Filter className="h-4 w-4" /> Filtres
              </button>
              <button
                onClick={handleExport}
                disabled={!filteredEtudiants.length}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 shadow-lg transition hover:bg-emerald-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
            </div>
          </div>
        </section>

        {filteredEtudiants.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total à payer",
                value: filteredEtudiants.reduce(
                  (sum, e) => sum + Number(e.total_a_payer || 0),
                  0,
                ),
                icon: WalletCards,
                color: "bg-indigo-600",
                text: "text-indigo-700",
              },
              {
                label: "Total encaissé",
                value: filteredEtudiants.reduce(
                  (sum, e) => sum + Number(e.total_paye || 0),
                  0,
                ),
                icon: CheckCircle,
                color: "bg-emerald-600",
                text: "text-emerald-700",
              },
              {
                label: "Solde restant",
                value: filteredEtudiants.reduce(
                  (sum, e) => sum + Number(e.solde || 0),
                  0,
                ),
                icon: Banknote,
                color: "bg-amber-500",
                text: "text-amber-700",
              },
              {
                label: "Étudiants affichés",
                value: filteredEtudiants.length,
                icon: Users,
                color: "bg-sky-600",
                text: "text-sky-700",
                count: true,
              },
            ].map(({ label, value, icon: Icon, color, text, count }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {label}
                    </p>
                    <p
                      className={`mt-2 text-2xl font-bold tracking-tight ${text}`}
                    >
                      {count ? value : `${value.toLocaleString("fr-FR")} FC`}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-3 text-white ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Filtres de recherche
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Affinez la situation financière affichée
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-red-600"
              >
                <X className="h-4 w-4" /> Réinitialiser
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium text-gray-700">
                Année académique
                <select
                  value={anneeSelectionnee || ""}
                  onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 font-normal"
                >
                  {annees.map((annee) => (
                    <option key={annee.id} value={annee.id}>
                      {annee.nom} ({annee.date_debut} — {annee.date_fin})
                      {annee.est_active ? " · Active" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Recherche
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    placeholder="Matricule, nom, téléphone..."
                    className="w-full rounded-lg border py-2 pl-9 pr-3 font-normal"
                  />
                </div>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Faculté
                <select
                  value={filters.faculte}
                  onChange={(e) =>
                    setFilters({ ...filters, faculte: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 font-normal"
                >
                  <option value="all">Toutes</option>
                  {filterOptions.facultes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Promotion
                <select
                  value={filters.promotion}
                  onChange={(e) =>
                    setFilters({ ...filters, promotion: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 font-normal"
                >
                  <option value="all">Toutes</option>
                  {filterOptions.promotions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Situation
                <select
                  value={filters.statut}
                  onChange={(e) =>
                    setFilters({ ...filters, statut: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 font-normal"
                >
                  <option value="all">Toutes</option>
                  <option value="paye">Payé</option>
                  <option value="partiel">Partiel</option>
                  <option value="non_paye">Non payé</option>
                  <option value="aucun">Aucun frais</option>
                </select>
              </label>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {filteredEtudiants.length} étudiant(s) sur {etudiants.length}
            </p>
          </div>
        )}

        {!anneeModifiable && anneeSelectionnee && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Année clôturée — consultation uniquement.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Dossiers financiers
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {filteredEtudiants.length} résultat
                {filteredEtudiants.length > 1 ? "s" : ""}
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-slate-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-slate-50/80 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Matricule
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Étudiant
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Faculté - Promotion
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    À payer
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Payé
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Solde
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEtudiants.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      Aucun étudiant trouvé
                    </td>
                  </tr>
                )}

                {filteredEtudiants.map((etudiant) => {
                  const id = etudiant.id;
                  const nom_complet =
                    etudiant.nom_complet ||
                    `${etudiant.nom || ""} ${etudiant.post_nom || ""} ${etudiant.prenom || ""}`.trim() ||
                    "-";
                  const matricule = etudiant.matricule || "-";
                  const facultePromotion = getFaculteEtPromotion(etudiant);
                  const { statut, statutLabel, totalAPayer, totalPaye, solde } =
                    getStatutInfo(etudiant);

                  return (
                    <tr
                      key={id}
                      className="border-t border-slate-100 transition-colors hover:bg-emerald-50/30"
                    >
                      <td className="px-4 py-3 align-top font-mono text-sm">
                        {matricule}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-indigo-100">
                            {etudiant.photo ? (
                              <img
                                src={etudiant.photo}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center">
                                <User className="h-4 w-4 text-indigo-700" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {nom_complet}
                            </div>
                            {etudiant.email && (
                              <div className="text-xs text-gray-500">
                                {etudiant.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {facultePromotion}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right font-semibold text-gray-800">
                        {totalAPayer > 0
                          ? `${totalAPayer.toLocaleString("fr-FR")} FC`
                          : "0 FC"}
                      </td>
                      <td className="px-4 py-3 align-top text-right text-green-600 font-semibold">
                        {totalPaye > 0
                          ? `${totalPaye.toLocaleString("fr-FR")} FC`
                          : "0 FC"}
                      </td>
                      <td className="px-4 py-3 align-top text-right text-orange-600 font-semibold">
                        {solde > 0
                          ? `${solde.toLocaleString("fr-FR")} FC`
                          : "0 FC"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                        ${
                          statut === "paye"
                            ? "bg-green-100 text-green-700"
                            : statut === "partiel"
                              ? "bg-yellow-100 text-yellow-700"
                              : statut === "aucun"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                        }`}
                        >
                          {statut === "paye" && (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {statut === "partiel" && (
                            <Clock className="w-4 h-4" />
                          )}
                          {(statut === "non_paye" || statut === "aucun") && (
                            <XCircle className="w-4 h-4" />
                          )}
                          {statutLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Link
                          to={`/frais/etudiant/${id}/paiements?annee=${anneeSelectionnee}`}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Eye className="w-4 h-4" /> Détails
                          </Link>
                          {anneeModifiable && (
                            <Link
                              to={`/frais/etudiant/${id}/nouveau-paiement`}
                              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                              <CreditCard className="w-4 h-4" /> Paiement
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

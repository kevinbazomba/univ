import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fraisApi } from "../../services/frais";
import { etudiantApi } from "../../services/etudiants/etudiantApi";
import { anneeApi } from "../../services/etudiants/anneeApi";

export default function EtudiantPaiementsDetail() {
  const { etudiantId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [frais, setFrais] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState(1);
  const [etudiantNom, setEtudiantNom] = useState("");
  const [etudiantMatricule, setEtudiantMatricule] = useState("");
  const [annees, setAnnees] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fraisApi.getFrais(null, etudiantId),
      fraisApi.getPaiements(null, etudiantId),
      etudiantApi.getById(etudiantId).catch(() => null),
      anneeApi.getAll(),
    ])
      .then(([fraisData, paiementsData, etRes, anneesRes]) => {
        const fraisList = fraisData ?? [];
        const paiementsList = paiementsData ?? [];
        const etudiant = etRes?.data ?? etRes;
        const listeAnnees = anneesRes?.data ?? anneesRes ?? [];

        // Récupérer le matricule de l'étudiant
        const representationEtudiant =
          fraisList[0]?.etudiant || paiementsList[0]?.etudiant || "";
        const matricule =
          etudiant?.matricule ||
          (typeof representationEtudiant === "string"
            ? representationEtudiant.split(" - ")[0]
            : "");
        setEtudiantMatricule(matricule);

        // Récupérer le nom complet
        const nom =
          etudiant?.nom_complet ||
          `${etudiant?.nom || ""} ${etudiant?.post_nom || ""} ${etudiant?.prenom || ""}`.trim() ||
          etudiant?.full_name ||
          (typeof representationEtudiant === "string"
            ? representationEtudiant.split(" - ").slice(1).join(" - ")
            : "") ||
          "";
        setEtudiantNom(nom || `Étudiant ${etudiantId}`);

        // Filtrer les frais par matricule (car le champ etudiant est "98U9J9 - NG NGOma joseph")
        const etFrais = (Array.isArray(fraisList) ? fraisList : []).filter(
          (f) => {
            let fraisMatricule = null;

            if (f.etudiant && typeof f.etudiant === "string") {
              fraisMatricule = f.etudiant.split(" - ")[0];
            } else if (f.etudiant?.matricule) {
              fraisMatricule = f.etudiant.matricule;
            }

            return fraisMatricule === matricule;
          },
        );

        // Filtrer les paiements par matricule
        const etPaiements = (
          Array.isArray(paiementsList) ? paiementsList : []
        ).filter((p) => {
          let paiementMatricule = null;

          if (p.etudiant && typeof p.etudiant === "string") {
            paiementMatricule = p.etudiant.split(" - ")[0];
          } else if (p.etudiant?.matricule) {
            paiementMatricule = p.etudiant.matricule;
          } else if (p.frais?.etudiant) {
            if (typeof p.frais.etudiant === "string") {
              paiementMatricule = p.frais.etudiant.split(" - ")[0];
            } else if (p.frais.etudiant?.matricule) {
              paiementMatricule = p.frais.etudiant.matricule;
            }
          }

          return paiementMatricule === matricule;
        });

        if (!mounted) return;

        console.log("Matricule étudiant:", matricule);
        console.log("Frais filtrés:", etFrais);
        console.log("Paiements filtrés:", etPaiements);

        setFrais(etFrais);
        setPaiements(etPaiements);
        setAnnees(listeAnnees);
        const anneeDemandee = searchParams.get("annee");
        const anneeParDefaut =
          listeAnnees.find(
            (annee) => String(annee.id) === String(anneeDemandee),
          ) ||
          listeAnnees.find((annee) => annee.est_active) ||
          listeAnnees[0];
        setAnneeSelectionnee(anneeParDefaut ? String(anneeParDefaut.id) : "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur:", err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [etudiantId, searchParams]);

  if (loading) return <div className="p-6">Chargement…</div>;

  const anneeCourante = annees.find(
    (annee) => String(annee.id) === String(anneeSelectionnee),
  );
  const etudiantFrais = frais.filter(
    (f) =>
      f.semestre == selectedSemestre &&
      (!anneeCourante ||
        String(f.annee_academique) === String(anneeCourante.id)),
  );
  const etudiantPaiements = paiements.filter((p) => {
    // Vérifier plusieurs façons d'obtenir le semestre
    const semestre = p.frais?.semestre || p.semestre;
    return (
      semestre == selectedSemestre &&
      (!anneeCourante ||
        String(p.frais?.annee_academique) === String(anneeCourante.id))
    );
  });

  const totalFrais = etudiantFrais.reduce(
    (acc, f) => acc + parseFloat(f.montant_total || 0),
    0,
  );
  const totalPaye = etudiantPaiements.reduce(
    (acc, p) => acc + parseFloat(p.montant_paye || 0),
    0,
  );
  const soldeRestant = totalFrais - totalPaye;
  const pourcentagePaye =
    totalFrais > 0 ? Math.round((totalPaye / totalFrais) * 100) : 0;
  const nomAnnee = (anneeId) =>
    annees.find((annee) => String(annee.id) === String(anneeId))?.nom || "-";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/frais")}
        className="mb-4 rounded bg-gray-500 px-3 py-1 text-white text-sm hover:bg-gray-600"
      >
        ← Retour
      </button>

      <h2 className="text-2xl font-semibold mb-6">
        Détails des paiements - {etudiantNom || `Étudiant ${etudiantId}`}
      </h2>

      {etudiantMatricule && (
        <p className="text-sm text-gray-500 mb-4">
          Matricule: {etudiantMatricule}
        </p>
      )}

      {anneeCourante && !anneeCourante.est_active && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Année clôturée — consultation uniquement. Les données restent
          disponibles après le changement de promotion.
        </div>
      )}

      {/* Sélection du semestre */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Année académique
          <select
            value={anneeSelectionnee}
            onChange={(e) => setAnneeSelectionnee(e.target.value)}
            className="mt-2 w-full rounded border px-3 py-2"
          >
            {annees.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.nom}
                {annee.est_active ? " · Active" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Semestre
          <select
            value={selectedSemestre}
            onChange={(e) => setSelectedSemestre(Number(e.target.value))}
            className="mt-2 w-full rounded border px-3 py-2"
          >
            <option value={1}>1er Semestre</option>
            <option value={2}>2ème Semestre</option>
          </select>
        </label>
      </div>

      {/* Bilan financier */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded bg-blue-100 p-4">
          <p className="text-sm text-gray-600">Total frais</p>
          <p className="text-xl font-bold text-blue-700">
            {totalFrais.toLocaleString("fr-FR")} FC
          </p>
        </div>
        <div className="rounded bg-green-100 p-4">
          <p className="text-sm text-gray-600">Total payé</p>
          <p className="text-xl font-bold text-green-700">
            {totalPaye.toLocaleString("fr-FR")} FC
          </p>
        </div>
        <div className="rounded bg-red-100 p-4">
          <p className="text-sm text-gray-600">Solde restant</p>
          <p className="text-xl font-bold text-red-700">
            {soldeRestant.toLocaleString("fr-FR")} FC
          </p>
        </div>
        <div className="rounded bg-purple-100 p-4">
          <p className="text-sm text-gray-600">Progression</p>
          <p className="text-xl font-bold text-purple-700">
            {pourcentagePaye}%
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-2">Progression du paiement</p>
        <div className="w-full bg-gray-300 rounded-full h-6">
          <div
            className="bg-green-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ width: `${pourcentagePaye}%` }}
          >
            {pourcentagePaye > 5 && `${pourcentagePaye}%`}
          </div>
        </div>
      </div>

      {/* Frais pour ce semestre */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Frais applicables</h3>
        {etudiantFrais.length === 0 ? (
          <p className="text-gray-500">Aucun frais pour ce semestre</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Type de frais</th>
                <th className="border px-4 py-2 text-left">Année académique</th>
                <th className="border px-4 py-2 text-left">Montant total</th>
                <th className="border px-4 py-2 text-left">Payé</th>
                <th className="border px-4 py-2 text-left">Restant</th>
                <th className="border px-4 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {etudiantFrais.map((f) => {
                const paye = etudiantPaiements
                  .filter((p) => p.frais_id === f.id || p.frais?.id === f.id)
                  .reduce((acc, p) => acc + parseFloat(p.montant_paye || 0), 0);
                const restant = parseFloat(f.montant_total || 0) - paye;
                return (
                  <tr key={f.id} className="border-b">
                    <td className="border px-4 py-2">
                      {f.type_frais?.nom || "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {nomAnnee(f.annee_academique)}
                    </td>
                    <td className="border px-4 py-2">
                      {parseFloat(f.montant_total).toLocaleString("fr-FR")} FC
                    </td>
                    <td className="border px-4 py-2 text-green-600 font-semibold">
                      {paye.toLocaleString("fr-FR")} FC
                    </td>
                    <td className="border px-4 py-2 text-red-600 font-semibold">
                      {restant.toLocaleString("fr-FR")} FC
                    </td>
                    <td className="border px-4 py-2">
                      {restant <= 0 ? (
                        <span className="rounded bg-green-200 px-2 py-1 text-green-800 text-sm">
                          Payé
                        </span>
                      ) : paye > 0 ? (
                        <span className="rounded bg-yellow-200 px-2 py-1 text-yellow-800 text-sm">
                          Partiel
                        </span>
                      ) : (
                        <span className="rounded bg-red-200 px-2 py-1 text-red-800 text-sm">
                          Non payé
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historique des paiements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historique des paiements</h3>
        {etudiantPaiements.length === 0 ? (
          <p className="text-gray-500">
            Aucun paiement enregistré pour ce semestre
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">N° Reçu</th>
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Type de frais</th>
                <th className="border px-4 py-2 text-left">Année académique</th>
                <th className="border px-4 py-2 text-left">Montant</th>
                <th className="border px-4 py-2 text-left">Mode</th>
                <th className="border px-4 py-2 text-left">Agent</th>
                <th className="border px-4 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {etudiantPaiements.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="border px-4 py-2 font-mono text-sm">
                    {p.reference}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(p.date_paiement).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="border px-4 py-2">
                    {p.frais?.type_frais?.nom || "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {nomAnnee(p.frais?.annee_academique)}
                  </td>
                  <td className="border px-4 py-2 font-semibold">
                    {parseFloat(p.montant_paye).toLocaleString("fr-FR")} FC
                  </td>
                  <td className="border px-4 py-2 text-sm capitalize">
                    {p.mode_paiement === "mobile_money"
                      ? "Mobile Money"
                      : p.mode_paiement}
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    {p.agent?.username || p.agent || "-"}
                  </td>
                  <td className="border px-4 py-2">
                    <span
                      className={`rounded px-2 py-1 text-sm ${
                        p.statut === "valide"
                          ? "bg-green-200 text-green-800"
                          : p.statut === "en_attente"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                      }`}
                    >
                      {p.statut === "valide"
                        ? "Validé"
                        : p.statut === "en_attente"
                          ? "En attente"
                          : "Annulé"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

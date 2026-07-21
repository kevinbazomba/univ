/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { KeyRound, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { toast, Toaster } from "sonner";
import { api } from "../services/apiClient";

const JuryTokenGate = ({ children }) => {
  const [code, setCode] = useState("");
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function invaliderJeton() {
      setScope(null);
      setCode("");
      toast.error("Jeton du jury expiré, invalide ou désactivé");
    }
    window.addEventListener("jury-token-invalid", invaliderJeton);
    const savedScope = sessionStorage.getItem("jury_access_scope");
    const savedToken = sessionStorage.getItem("jury_access_token");
    if (savedToken && savedScope) {
      try {
        setScope(JSON.parse(savedScope));
      } catch {
        sessionStorage.removeItem("jury_access_token");
        sessionStorage.removeItem("jury_access_scope");
      }
    }
    return () => window.removeEventListener("jury-token-invalid", invaliderJeton);
  }, []);

  async function verifier(event) {
    event.preventDefault();
    if (!code.trim()) {
      return toast.error("Entrez le code jeton du jury");
    }
    setLoading(true);
    try {
      const response = await api.post("jetons-jury/verifier/", {
        code: code.trim(),
      });
      sessionStorage.setItem("jury_access_token", response.data.token);
      sessionStorage.setItem("jury_access_scope", JSON.stringify(response.data.scope));
      setScope(response.data.scope);
      toast.success("Jeton accepté");
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem("jury_access_token");
      sessionStorage.removeItem("jury_access_scope");
      toast.error(error.response?.data?.error || "Code jeton invalide");
    } finally {
      setLoading(false);
    }
  }

  function sortir() {
    sessionStorage.removeItem("jury_access_token");
    sessionStorage.removeItem("jury_access_scope");
    setScope(null);
    setCode("");
  }

  if (!scope) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <Toaster richColors position="top-right" />
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <form
            onSubmit={verifier}
            className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-8 text-white">
              <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-black">Accès sécurisé au jury</h1>
              <p className="mt-2 text-sm text-cyan-100/80">
                Entrez le code jeton créé par l’administration pour ouvrir
                uniquement le périmètre autorisé.
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700">
                Code jeton
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-indigo-500">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Ex. A1B2C3D4..."
                    className="w-full bg-transparent uppercase outline-none"
                  />
                </div>
              </label>

              <button
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-800 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {loading ? "Vérification..." : "Ouvrir le jury"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-cyan-100 bg-cyan-50 px-4 py-2 text-sm text-cyan-900">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold">
            Jeton jury actif : {scope.annee_academique_nom}
            {scope.faculte_nom ? ` · ${scope.faculte_nom}` : ""}
            {scope.departement_nom ? ` · ${scope.departement_nom}` : ""}
            {scope.promotion_nom ? ` · ${scope.promotion_nom}` : ""}
          </span>
          <button
            onClick={sortir}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-cyan-800 ring-1 ring-cyan-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Changer de jeton
          </button>
        </div>
      </div>
      {children}
    </>
  );
};

export default JuryTokenGate;

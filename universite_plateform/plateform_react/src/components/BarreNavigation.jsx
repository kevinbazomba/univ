import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  ChevronDown,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  Shield,
  UserCog,
  UserPlus,
  Users,
  X,
  Gavel,
  WalletCards,
  BarChart3,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import { universityApi } from "../services/universityApi";
import ActiveAcademicYear from "./ActiveAcademicYear";

const groupes = [
  {
    id: "etudiants",
    label: "Étudiants",
    icon: Users,
    links: [
      {
        to: "/etudiants",
        label: "Liste des étudiants",
        description: "Consulter les dossiers",
        icon: Users,
      },
      {
        to: "/etudiants/nouveau",
        label: "Nouvel étudiant",
        description: "Créer une inscription",
        icon: UserPlus,
      },
    ],
  },
  {
    id: "frais",
    label: "Frais",
    icon: DollarSign,
    links: [
      {
        to: "/frais",
        label: "Frais académiques",
        description: "Suivi des frais appliqués",
        icon: DollarSign,
      },
      {
        to: "/frais/applications",
        label: "Applications des frais",
        description: "Voir, modifier et supprimer",
        icon: WalletCards,
      },
      {
        to: "/frais/statistiques",
        label: "Statistiques",
        description: "Analyse et export des paiements",
        icon: BarChart3,
      },
      {
        to: "/frais/tarifs",
        label: "Tarifs",
        description: "Consulter les grilles tarifaires",
        icon: CreditCard,
      },
      {
        to: "/frais/tarifs/nouveau",
        label: "Créer un tarif",
        description: "Définir un nouveau tarif",
        icon: PlusCircle,
      },
    ],
  },
  {
    id: "enseignements",
    label: "Enseignements",
    icon: GraduationCap,
    links: [
      {
        to: "/enseignements",
        label: "Vue d’ensemble",
        description: "Pilotage académique",
        icon: LayoutDashboard,
      },
      {
        to: "/enseignements/grades",
        label: "Grades",
        description: "Hiérarchie académique",
        icon: Award,
      },
      {
        to: "/enseignements/professeurs",
        label: "Professeurs",
        description: "Corps enseignant",
        icon: UserCog,
      },
      {
        to: "/enseignements/cours",
        label: "Cours",
        description: "Catalogue des cours",
        icon: BookOpen,
      },
      {
        to: "/enseignements/gestion-applications",
        label: "Applications",
        description: "Plans d’application",
        icon: Settings,
      },
      {
        to: "/enseignements/appliquer-cours",
        label: "Affectations",
        description: "Cours appliqués aux étudiants",
        icon: FileText,
      },
    ],
  },
];

const MenuDeroulant = ({ groupe, ouvert, actif, onToggle, onClose }) => {
  const Icon = groupe.icon;
  return (
    <div className="relative" onMouseLeave={onClose}>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={onToggle}
        aria-expanded={ouvert}
        className={`relative flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition-all ${actif || ouvert ? "bg-white/10 text-white ring-1 ring-white/10" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}
      >
        <Icon className="h-4 w-4" />
        {groupe.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${ouvert ? "rotate-180" : ""}`}
        />
      </button>
      {ouvert && (
        <div className="absolute left-0 top-full z-50 w-80 pt-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 text-slate-800 shadow-[0_24px_70px_-18px_rgba(15,23,42,0.45)]">
            <div className="mb-1 border-b border-slate-100 px-3 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-800">
                {groupe.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Accès aux fonctions du module
              </p>
            </div>
            {groupe.links.map((link) => {
              const LinkIcon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive ? "bg-blue-50 text-blue-800 ring-1 ring-blue-100" : "hover:bg-slate-50"}`
                  }
                >
                  <span className="rounded-lg bg-slate-100 p-2 text-blue-600 transition group-hover:bg-blue-100">
                    <LinkIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {link.label}
                    </span>
                    <span className="block truncate text-xs font-normal text-slate-400">
                      {link.description}
                    </span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const BarreNavigation = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuMobile, setMenuMobile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(null);
  const [universite, setUniversite] = useState(null);
  const [tokenPresent, setTokenPresent] = useState(() =>
    Boolean(localStorage.getItem("access_token")),
  );

  useEffect(() => {
    universityApi
      .getIdentity()
      .then(setUniversite)
      .catch(() => null);
  }, []);

  useEffect(() => {
    const verifierSession = () => {
      const present = Boolean(localStorage.getItem("access_token"));
      setTokenPresent(present);
      if (!present && useAuthStore.getState().isAuthenticated) {
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        setMenuOuvert(null);
        setMenuMobile(false);
      }
    };
    window.addEventListener("storage", verifierSession);
    const interval = window.setInterval(verifierSession, 1000);
    return () => {
      window.removeEventListener("storage", verifierSession);
      window.clearInterval(interval);
    };
  }, []);

  const deconnexion = async () => {
    await logout();
    navigate("/login");
  };

  const initiale = user?.first_name?.[0] || user?.username?.[0] || "U";
  const role = user?.is_superuser ? "Super administrateur" : "Agent académique";
  const sessionValide = Boolean(isAuthenticated && user && tokenPresent);

  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-white/10 bg-slate-950/95 text-white shadow-[0_8px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
        <div className="absolute -left-24 top-0 h-24 w-96 bg-blue-500/[0.08] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[74px] items-center justify-between gap-4">
          <Link
            to={sessionValide ? "/dashboard" : "/login"}
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/20 transition group-hover:ring-blue-300/60">
              {universite?.logo || universite?.logo_url ? (
                <img
                  src={universite.logo || universite.logo_url}
                  alt="Logo de l’université"
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : (
                <GraduationCap className="h-6 w-6 text-blue-700" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-tight text-white">
                {universite?.sigle ||
                  universite?.nom ||
                  "Gestion universitaire"}
              </p>
              <p className="hidden truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:block">
                Plateforme de gestion académique
              </p>
            </div>
          </Link>

          {sessionValide && (
            <div className="hidden items-center gap-1 rounded-xl bg-black/10 p-1 xl:flex">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition ${isActive ? "bg-white/10 text-white ring-1 ring-white/10" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                Tableau de bord
              </NavLink>
              <NavLink
                to="/jury"
                className={({ isActive }) =>
                  `flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition ${isActive ? "bg-white/10 text-white ring-1 ring-white/10" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`
                }
              >
                <Gavel className="h-4 w-4" />
                Jury
              </NavLink>
              {groupes.map((groupe) => (
                <MenuDeroulant
                  key={groupe.id}
                  groupe={groupe}
                  ouvert={menuOuvert === groupe.id}
                  actif={groupe.links.some(
                    (link) =>
                      pathname === link.to ||
                      pathname.startsWith(`${link.to}/`),
                  )}
                  onToggle={() => setMenuOuvert(groupe.id)}
                  onClose={() => setMenuOuvert(null)}
                />
              ))}
            </div>
          )}

          <div className="hidden items-center gap-3 xl:flex">
            <div className="hidden 2xl:block">
              <ActiveAcademicYear compact dark />
            </div>
            {sessionValide ? (
              <>
                <div className="flex items-center gap-2.5 border-l border-white/10 pl-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold shadow-inner ring-2 ring-white/10">
                    {initiale.toUpperCase()}
                  </span>
                  <span className="max-w-32">
                    <span className="block truncate text-xs font-bold">
                      {user?.first_name || user?.username}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">
                      {role}
                    </span>
                  </span>
                </div>
                {user?.is_superuser && (
                  <a
                    href="/admin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Administration — ${universite?.sigle || universite?.nom || "Université"}`}
                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-amber-300"
                  >
                    <Shield className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={deconnexion}
                  title="Déconnexion"
                  className="rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  <LogIn className="mr-2 inline h-4 w-4" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-950"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuMobile(!menuMobile)}
            aria-label="Ouvrir la navigation"
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-slate-200 transition hover:bg-white/10 xl:hidden"
          >
            {menuMobile ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {menuMobile && (
        <div className="relative z-10 border-t border-white/10 bg-slate-950 shadow-2xl xl:hidden">
          <div className="mx-auto max-h-[calc(100vh-74px)] max-w-3xl space-y-4 overflow-y-auto px-4 py-5">
            {sessionValide && <ActiveAcademicYear dark />}
            {sessionValide && (
              <NavLink
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold"
              >
                <LayoutDashboard className="h-5 w-5 text-indigo-300" />
                Tableau de bord
              </NavLink>
            )}
            {sessionValide && (
              <NavLink
                to="/jury"
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold"
              >
                <Gavel className="h-5 w-5 text-indigo-300" />
                Jury des étudiants
              </NavLink>
            )}
            {sessionValide &&
              groupes.map((groupe) => {
                const Icon = groupe.icon;
                const ouvert = menuOuvert === groupe.id;
                return (
                  <section
                    key={groupe.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <button
                      type="button"
                      onClick={() => setMenuOuvert(ouvert ? null : groupe.id)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <Icon className="h-5 w-5 text-indigo-300" />
                      <span className="flex-1 text-sm font-bold">
                        {groupe.label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition ${ouvert ? "rotate-180" : ""}`}
                      />
                    </button>
                    {ouvert && (
                      <div className="space-y-1 border-t border-white/10 p-2">
                        {groupe.links.map((link) => {
                          const LinkIcon = link.icon;
                          return (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-indigo-500/20 text-white" : "text-slate-300 hover:bg-white/5"}`
                              }
                            >
                              <LinkIcon className="h-4 w-4" />
                              {link.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

            <div className="border-t border-white/10 pt-4">
              {sessionValide ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-bold">
                      {initiale.toUpperCase()}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">
                        {user?.first_name || user?.username}
                      </span>
                      <span className="text-xs text-indigo-200/70">{role}</span>
                    </span>
                  </div>
                  {user?.is_superuser && (
                    <a
                      href="/admin/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200"
                    >
                      <Shield className="h-5 w-5" />
                      Administration {universite?.sigle || universite?.nom || "universitaire"}
                    </a>
                  )}
                  <button
                    onClick={deconnexion}
                    className="flex w-full items-center gap-3 rounded-xl bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-200"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-indigo-950"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ocean-current {
          position: absolute;
          width: 75%;
          height: 190%;
          top: -55%;
          border-radius: 45%;
          filter: blur(18px);
          will-change: transform;
        }

        .ocean-current-one {
          left: -18%;
          background: radial-gradient(circle, rgba(14, 165, 233, .38), rgba(6, 182, 212, .08) 55%, transparent 72%);
          animation: ocean-drift-one 13s ease-in-out infinite alternate;
        }

        .ocean-current-two {
          right: -22%;
          background: radial-gradient(circle, rgba(45, 212, 191, .28), rgba(37, 99, 235, .12) 52%, transparent 72%);
          animation: ocean-drift-two 16s ease-in-out infinite alternate;
        }

        .ocean-wave {
          position: absolute;
          left: -20%;
          width: 140%;
          height: 42px;
          border-radius: 50%;
          border-top: 2px solid rgba(186, 230, 253, .22);
          background: linear-gradient(180deg, rgba(125, 211, 252, .08), transparent 70%);
          will-change: transform;
        }

        .ocean-wave-one {
          bottom: -16px;
          animation: ocean-wave 9s linear infinite;
        }

        .ocean-wave-two {
          bottom: 8px;
          opacity: .55;
          animation: ocean-wave-reverse 12s linear infinite;
        }

        @keyframes ocean-drift-one {
          from { transform: translate3d(-4%, -3%, 0) rotate(-5deg) scale(1); }
          to { transform: translate3d(24%, 6%, 0) rotate(8deg) scale(1.15); }
        }

        @keyframes ocean-drift-two {
          from { transform: translate3d(8%, 4%, 0) rotate(8deg) scale(1.08); }
          to { transform: translate3d(-26%, -5%, 0) rotate(-7deg) scale(.96); }
        }

        @keyframes ocean-wave {
          from { transform: translateX(-4%) skewX(-8deg); }
          50% { transform: translateX(4%) skewX(8deg); }
          to { transform: translateX(-4%) skewX(-8deg); }
        }

        @keyframes ocean-wave-reverse {
          from { transform: translateX(5%) skewX(7deg); }
          50% { transform: translateX(-5%) skewX(-7deg); }
          to { transform: translateX(5%) skewX(7deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ocean-current,
          .ocean-wave { animation: none; }
        }
      `}</style>
    </nav>
  );
};

export default BarreNavigation;

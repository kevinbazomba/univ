/**
 * PAGE D'INSCRIPTION - Formulaire pour créer un nouveau compte
 * Permet aux nouveaux utilisateurs de s'enregistrer
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { toast, Toaster } from 'sonner';

const Inscription = () => {
  // ============================================
  // ÉTATS DU FORMULAIRE
  // ============================================
  const [formulaire, setFormulaire] = useState({
    nom_utilisateur: '',
    email: '',
    prenom: '',
    nom: '',
    mot_de_passe: '',
    confirmation_mot_de_passe: '',
  });
  
  const { inscription, chargement } = useAuthStore();
  const navigate = useNavigate();

  // ============================================
  // FONCTIONS PERSONNALISÉES
  // ============================================
  
  /**
   * Gère les changements dans les champs du formulaire
   */
  const gererChangement = (evenement) => {
    setFormulaire({
      ...formulaire,
      [evenement.target.name]: evenement.target.value,
    });
  };

  /**
   * Valide le formulaire avant soumission
   * @returns {boolean} True si le formulaire est valide
   */
  const validerFormulaire = () => {
    // Vérifier la longueur du mot de passe
    if (formulaire.mot_de_passe.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    // Vérifier que les mots de passe correspondent
    if (formulaire.mot_de_passe !== formulaire.confirmation_mot_de_passe) {
      toast.error('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Vérifier l'email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(formulaire.email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return false;
    }
    
    // Vérifier que le nom d'utilisateur est rempli
    if (formulaire.nom_utilisateur.length < 3) {
      toast.error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }
    
    return true;
  };

  /**
   * Gère la soumission du formulaire d'inscription
   */
  const gererInscription = async (evenement) => {
    evenement.preventDefault();
    
    // Valider le formulaire
    if (!validerFormulaire()) {
      return;
    }
    
    // Préparer les données à envoyer
    const donneesInscription = {
      nom_utilisateur: formulaire.nom_utilisateur,
      email: formulaire.email,
      first_name: formulaire.prenom,
      last_name: formulaire.nom,
      mot_de_passe: formulaire.mot_de_passe,
      confirmation_mot_de_passe: formulaire.confirmation_mot_de_passe,
    };
    
    // Appeler l'API d'inscription
    const resultat = await inscription(donneesInscription);
    
    if (resultat.success) {
      toast.success('Inscription réussie ! Bienvenue !');
      navigate('/tableau-de-bord');
    } else {
      // Afficher les erreurs de validation
      const erreurs = resultat.erreur;
      if (erreurs.username) {
        toast.error(`Nom d'utilisateur: ${erreurs.username[0]}`);
      }
      if (erreurs.email) {
        toast.error(`Email: ${erreurs.email[0]}`);
      }
      if (erreurs.mot_de_passe) {
        toast.error(`Mot de passe: ${erreurs.mot_de_passe[0]}`);
      }
      if (erreurs.nom_utilisateur) {
        toast.error(erreurs.nom_utilisateur);
      }
    }
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <Toaster position="top-right" richColors />
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 max-w-md transform transition-all duration-300 hover:shadow-2xl">
        {/* Titre de la page */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Inscription</h1>
          <p className="text-gray-500">Créez votre compte gratuitement</p>
        </div>
        
        {/* Formulaire d'inscription */}
        <form onSubmit={gererInscription}>
          {/* Nom d'utilisateur */}
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom_utilisateur"
              value={formulaire.nom_utilisateur}
              onChange={gererChangement}
              placeholder="ex: jean_dupont"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Email */}
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formulaire.email}
              onChange={gererChangement}
              placeholder="ex: jean@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Prénom */}
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Prénom
            </label>
            <input
              type="text"
              name="prenom"
              value={formulaire.prenom}
              onChange={gererChangement}
              placeholder="Jean"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Nom */}
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Nom
            </label>
            <input
              type="text"
              name="nom"
              value={formulaire.nom}
              onChange={gererChangement}
              placeholder="Dupont"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Mot de passe */}
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="mot_de_passe"
              value={formulaire.mot_de_passe}
              onChange={gererChangement}
              placeholder="Minimum 8 caractères"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Confirmation mot de passe */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              Confirmer mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmation_mot_de_passe"
              value={formulaire.confirmation_mot_de_passe}
              onChange={gererChangement}
              placeholder="Retapez votre mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Bouton inscription */}
          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {chargement ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>
        
        {/* Lien vers connexion */}
        <p className="mt-6 text-center text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Inscription;
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, User, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import useAuthStore from "../../store/authStore";
import { toast, Toaster } from 'sonner';

const Register = ({ onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    const result = await register(formData);
    if (result.success) {
      toast.success('Inscription réussie ! Bienvenue !');
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      const errors = result.error;
      if (errors.username) toast.error(`Username: ${errors.username[0]}`);
      if (errors.email) toast.error(`Email: ${errors.email[0]}`);
      if (errors.password) toast.error(`Password: ${errors.password[0]}`);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_25%_15%,rgba(125,211,252,0.38),transparent_30%),radial-gradient(circle_at_80%_85%,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#020617,#082f49_48%,#0c4a6e)] p-4">

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-6 max-h-[90vh] overflow-y-auto">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 flex items-center gap-2 text-sm text-emerald-100 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Retour aux types d’inscription
            </button>
          )}
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="flex justify-center mb-3"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-full">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-1">Inscription</h1>
            <p className="text-emerald-200">Créez votre compte gratuitement</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-white mb-1 text-sm font-medium">
                Nom d'utilisateur *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-300" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Votre nom d'utilisateur"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-white mb-1 text-sm font-medium">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-300" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* First Name & Last Name in grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white mb-1 text-sm font-medium">
                  Prénom
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-white mb-1 text-sm font-medium">
                  Nom
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Dupont"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white mb-1 text-sm font-medium">
                Mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Minimum 8 caractères"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white mb-1 text-sm font-medium">
                Confirmer mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-300" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Retapez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Inscription en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Créer mon compte</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Login link */}
          <div className="mt-5 text-center">
            <p className="text-emerald-200 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-white font-semibold hover:underline transition">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Register;

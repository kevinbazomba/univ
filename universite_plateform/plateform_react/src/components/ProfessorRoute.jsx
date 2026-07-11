import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProfessorRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.account_type !== 'professeur') return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProfessorRoute;

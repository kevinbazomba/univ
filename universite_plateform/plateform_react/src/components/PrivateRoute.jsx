import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  const sessionValide = Boolean(isAuthenticated && user && localStorage.getItem('access_token'));
  if (!sessionValide) return <Navigate to="/login" replace />;
  if (user?.account_type === 'professeur') {
    return <Navigate to="/espace-professeur" replace />;
  }
  return children;
};

export default PrivateRoute;

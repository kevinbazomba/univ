import { Navigate } from 'react-router-dom';

const StudentRoute = ({ children }) => {
  const isAuthenticated = Boolean(localStorage.getItem('student_access_token'));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default StudentRoute;

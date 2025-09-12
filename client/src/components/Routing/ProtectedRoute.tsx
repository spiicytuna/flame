import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom'; // updated for v6 pattern
import { State } from '../../store/reducers';

interface Props {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: Props): JSX.Element => {
  const { isAuthenticated } = useSelector((state: State) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // not authenticated => homepage
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated => render
  return children;
};

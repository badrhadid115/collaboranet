import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const pubRoutes = ['/connexion', '/req-reinitialisation', '/reinitialisation-mdp'];

  if (pubRoutes.includes(location.pathname)) {
    return children;
  }
  if (!user) {
    return <Navigate to="/connexion" replace />;
  }
  return children;
};
AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthGuard;

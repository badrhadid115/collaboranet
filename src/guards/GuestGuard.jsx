import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

const GuestGuard = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const pubRoutes = ['/connexion', '/req-reinitialisation', '/reinitialisation-mdp'];

  if (user && pubRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return children;
};
GuestGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default GuestGuard;

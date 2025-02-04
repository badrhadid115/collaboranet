import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Loading, Page500, Page403, Page404 } from 'views/pages';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth');
        setUser(response.data);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          console.error('Internal server error:', error.response.data);
          setError(500);
        } else if (error.response && error.response.status === 401) {
          console.error('Unauthorized:', error.response.data);
          setError(401);
        } else if (error.response && error.response.status === 403) {
          console.error('Forbidden:', error.response.data);
          setError(403);
        } else if (error.response && error.response.status === 404) {
          console.error('Not found:', error.response.data);
          setError(404);
        } else {
          console.error('Unexpected error:', error.message);
          setError('unexpected');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const value = useMemo(() => ({ user }), [user]);

  if (loading) {
    return <Loading />;
  }

  if (error === 500) {
    return <Page500 />;
  }
  if (error === 403) {
    return <Page403 />;
  }
  if (error === 404) {
    return <Page404 />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
export default AuthContext;

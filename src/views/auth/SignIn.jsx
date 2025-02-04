import React from 'react';
import { Card } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

import Breadcrumb from '../../layouts/AdminLayout/Breadcrumb';

import AuthLogin from './LoginForm';

import Logo from '../../assets/brand/logo.png';
const SignIn = () => {
  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-hero" />
        <div className="auth-content">
          <div className="auth-bg">
            <span className="r" />
            <span className="r s" />
            <span className="r s" />
            <span className="r" />
          </div>

          <Card className="borderless text-center">
            <Card.Body>
              <div className="mb-4">
                <img src={Logo} alt="" className="img-fluid" />
              </div>
              <div className="mb-4">
                <i className="feather icon-user auth-icon" />
              </div>
              <AuthLogin />
              <p className="mb-2 text-muted">
                Mot de Passe oublé ?{' '}
                <NavLink to={'/req-reinitialisation'} className="f-w-400">
                  Réinitialiser
                </NavLink>
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SignIn;

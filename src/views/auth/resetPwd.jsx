import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import Breadcrumb from '../../layouts/AdminLayout/Breadcrumb';
import { Result, Button } from 'antd';
import ResetPwdForm from './resetPwdForm';

import Logo from '../../assets/brand/logo.png';
const ResetPwd = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    setToken(token);
  }, []);
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (token) {
          await axios.get(`/api/verify-token?token=${token}`);
        } else {
          setError('Le lien est invalide ou a expiré.');
        }
      } catch (error) {
        console.error('Error verifying token:', error.response.data);
        setError('Le lien est invalide ou a expiré.');
      }
    };

    verifyToken();
  }, [token]);

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
                <i className="feather icon-lock auth-icon" />
              </div>
              {error && (
                <Result
                  status="error"
                  title={error}
                  extra={
                    <Button type="primary" onClick={() => (window.location.href = '/')}>
                      Retour
                    </Button>
                  }
                />
              )}
              {!error && <ResetPwdForm />}
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPwd;

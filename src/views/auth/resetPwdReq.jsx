import React from 'react';
import { Card } from 'react-bootstrap';

import Breadcrumb from '../../layouts/AdminLayout/Breadcrumb';

import ResetReqForm from './RPRForm';

import Logo from '../../assets/brand/logo.png';
const ResetPwdReq = () => {
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
              <ResetReqForm />
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPwdReq;

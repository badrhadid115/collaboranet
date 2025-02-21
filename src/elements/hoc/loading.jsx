import React from 'react';
import sygnet from '../../assets/brand/sygnet.svg';
const Loading = () => {
  return (
    <div className="app-loading-container d-flex justify-content-center align-items-center vh-100">
      <img src={sygnet} alt="Loading" className="loading-svg" />
    </div>
  );
};

export default React.memo(Loading);

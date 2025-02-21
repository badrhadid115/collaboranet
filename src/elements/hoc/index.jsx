import React from 'react';
import PropTypes from 'prop-types';
import Loading from './loading';
import Page500 from './page500';
import Page403 from './page403';
import Page404 from './page404';

const PageState = ({ loading, error, children }) => {
  if (loading) return <Loading />;

  if (error) {
    switch (error) {
      case 500:
        return <Page500 />;
      case 403:
        return <Page403 />;
      case 404:
        return <Page404 />;
      default:
        return children;
    }
  }

  return children;
};
PageState.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.number,
  children: PropTypes.node.isRequired
};

export default PageState;

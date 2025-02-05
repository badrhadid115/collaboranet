import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import Loading from './views/pages/loading';
import AdminLayout from './layouts/AdminLayout';
import AuthGuard from 'views/auth/AuthGuard';
export const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loading />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;
        return (
          <Route
            key={i}
            path={route.path}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Element props={true} />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

const authRoutes = [
  {
    exact: true,
    path: '/connexion',
    element: lazy(() => import('./views/auth/SignIn'))
  },
  {
    exact: true,
    path: '/req-reinitialisation',
    element: lazy(() => import('./views/auth/resetPwdReq'))
  },
  {
    exact: true,
    path: '/reinitialisation-mdp',
    element: lazy(() => import('./views/auth/resetPwd'))
  }
];

const commercialRoutes = [
  {
    exact: true,
    path: '/clients',
    element: lazy(() => import('./views/commercial/clients/clients/clients'))
  },
  {
    exact: true,
    path: '/methodes',
    element: lazy(() => import('./views/commercial/articles/methodes/methodes'))
  },
  {
    exact: true,
    path: '/essais',
    element: lazy(() => import('./views/commercial/articles/essais/essais'))
  },
  {
    exact: true,
    path: '/saisir-devis/:type',
    element: lazy(() => import('./views/commercial/devis/saisir-devis/saisirDevis'))
  },
  {
    exact: true,
    path: '/devis',
    element: lazy(() => import('./views/commercial/devis/devis'))
  },
  {
    exact: true,
    path: '/factures',
    element: lazy(() => import('./views/commercial/factures/factures'))
  },
  {
    exact: true,
    path: '/saisir-facture',
    element: lazy(() => import('./views/commercial/factures/saisir-facture/saisirFacture'))
  },
  {
    exact: true,
    path: '/commandes',
    element: lazy(() => import('./views/commercial/commandes/commandes'))
  },
  {
    exact: true,
    path: '/bons-de-livraison',
    element: lazy(() => import('./views/commercial/bons-livraison/bonsLivraison'))
  },
  {
    exact: true,
    path: '/avoirs',
    element: lazy(() => import('./views/commercial/avoirs/avoirs'))
  }
];

const laboratoryRoutes = [
  {
    exact: true,
    path: '/echantillons',
    element: lazy(() => import('./views/laboratoires/echantillons/echantillons'))
  },
  {
    exact: true,
    path: '/rapports',
    element: lazy(() => import('./views/laboratoires/rapports/rapports'))
  }
];

const otherRoutes = [
  {
    exact: true,
    path: '/',
    element: lazy(() => import('./views/dashboard'))
  },
  {
    exact: true,
    path: '/notifications',
    element: lazy(() => import('./views/auth/Notifications'))
  },
  {
    path: '*',
    exact: true,
    element: lazy(() => import('./views/pages/page404'))
  }
];

// Main Routes
const routes = [
  ...authRoutes,
  {
    path: '*',
    layout: AdminLayout,
    guard: AuthGuard,
    routes: [...otherRoutes, ...commercialRoutes, ...laboratoryRoutes]
  }
];

export default routes;

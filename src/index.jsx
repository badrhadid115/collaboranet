import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from './contexts/ConfigContext';
import { ConfigProvider as AntdConfig } from 'antd';
import frFR from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from 'contexts/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);

dayjs.locale('fr');

root.render(
  <AntdConfig locale={frFR}>
    <AuthProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </AuthProvider>
  </AntdConfig>
);
reportWebVitals((metric) => {
  console.log(metric);
});

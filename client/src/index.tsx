import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';

// CSS
import './index.css';

// Components
import { App } from './App';

const container = document.getElementById('root');
const root = createRoot(container!); // new for React 18 API

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

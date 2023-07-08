import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ConnectionExample, App, Api} from './App';
import BasicList from './components/SuppliersList';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <ConnectionExample />
    <Api />
    <BasicList />
  </React.StrictMode>
);

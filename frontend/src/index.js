import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { App, HookUseState, Api } from './App';
import { Header } from './components/header';
import { InvoicesTable } from './App';
import Footer from './components/footer';
import Register from './components/register';
import Login from './components/login';
import Logout from './components/logout';
import { InvoiceDetails } from './components/invoiceDetails';
import { AddAccount } from './components/addAccount';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <React.StrictMode>
      <Header />
      <Routes>
        {/* <Route exact path="/" element={ <App/> } /> */}
        <Route ecact path="/" element={ [<AddAccount/>, <InvoicesTable/>] } />
        <Route exact path="/register" element={ <Register/> } />
        <Route exact path="/login" element={ <Login/> } />
        <Route exact path="/logout" element={ <Logout/> } />
        <Route exact path="/invoices/:pk" element={ <InvoiceDetails/> } />
      </Routes>
      <Footer />
    </React.StrictMode>
  </Router>
);

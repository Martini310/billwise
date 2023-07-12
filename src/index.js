import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { App, HookUseState, Api } from './App';
import { Header } from './components/Header';
import { InvoicesTable } from './App';
import Register from './components/register'
import Login from './components/login'
import Logout from './components/logout'


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <React.StrictMode>
      <Header />
      <Routes>
        {/* <Route exact path="/" element={ <App/> } /> */}
        <Route exact path="/" element={ <InvoicesTable/> } />
        <Route exact path="/register" element={ <Register/> } />
        <Route exact path="/login" element={ <Login/> } />
        <Route exact path="/logout" element={ <Logout/> } />
      </Routes>
    </React.StrictMode>
  </Router>
);

/* <App />
<HookUseState />
<Api />
<InvoicesTable /> */
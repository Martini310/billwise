import React from 'react';
import './App.css';
import { useState, useEffect } from 'react';
import { TasksList } from './components/TasksList'
import { withListLoading } from './components/invoicesLoading';
import { InvoicesList } from './components/invoicesList';
import { axiosInstance } from './axios';
import AddButton from './components/button';


export function App() {

  return (
    <div>
    <TasksList />
    </div>
)}

export function HookUseState() {
  const [name, setName] = useState('Martin');
  const [count, setCount] = useState(0)

  const HandleChangeName = () => {
    name === 'Martin' ? setName('Marek') : setName('Martin');
  };

  return (
    <div>
      <p>{name}</p>
      <button onClick={HandleChangeName}>Change Name</button>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(prevState => prevState - 1)}>-</button>
    </div>
  )
}

export const Api = () => {
  const [suppliers, setSupplier] = useState([])

  const fetchSupplierData = () => {
    fetch("http://127.0.0.1:8000/api/suppliers/")
      .then(response => {
        return response.json()
      })
      .then(data => {
        setSupplier(data)
      })
  }

  useEffect(() => {
    fetchSupplierData()
  }, [])

  return (
    <div>
      {suppliers.length > 0 && (
        <ul>
          {suppliers.map(supplier => (
            <li key={supplier.id}>{supplier.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}




export function InvoicesTable() {
  const ListLoading = withListLoading(InvoicesList);
  const [appState, setAppState] = useState({
    loading: true,
    invoices: null,
  });
  // setAppState({ loading: true });
  const apiUrl = `http://127.0.0.1:8000/api/invoices/`;

  useEffect(() => {
    console.log(localStorage.getItem('access_token'))
    axiosInstance.get(apiUrl, { 'headers': { 'Authorization': 'JWT ' + localStorage.getItem('access_token') }}).then((res) => {
			const allInvoices = res.data;
			setAppState({ loading: false, invoices: allInvoices });
		});
	}, [setAppState, apiUrl]);

  return (
    <div className='App'>
      <div className='container'>
        <h1>My invoices</h1>
      </div>
      <div>
        <AddButton />
      </div>
      <div className='repo-container'>
        <ListLoading isLoading={appState.loading} invoices={appState.invoices} />
      </div>
    </div>
  );
}

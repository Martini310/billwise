import React from 'react';
import './App.css';
import { useState, useEffect } from 'react';
import { TasksList } from './components/TasksList'

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

export class ConnectionExample extends React.Component {
  componentDidMount() {
    const apiUrl = 'http://127.0.0.1:8000/api/suppliers/';

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => console.log(data));
  }
  render() {
    return (
      <div>
        Example connection
      </div>
    )
  }
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
import React from 'react';
import './App.css';
import { TasksList } from './components/TasksList';

export default function App() {
  return (
    <div>
      <TasksList />
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
    return <div>Example connection</div>;
  }
}

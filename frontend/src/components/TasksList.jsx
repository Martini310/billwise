import { useState } from "react";
import { tasks as tasksData } from "../data/tasks";

export function TasksList() {
    const [tasks, setTasks] = useState(tasksData);

    const handleDeleteTask = (index) => {
      const newTasks = [...tasks];
      newTasks.splice(index, 1);
      setTasks(newTasks);
    };

    const handleCompleteTask = index => {
        const newTasks = [ ...tasks];
        newTasks[index].completed = true;
        setTasks(newTasks);
    }

    const handleAddTask = () => {
        const newTasks = [ ...tasks];
        newTasks.push(
            {
            title: 'Cook dinner',
            deskription: 'spaghetti',
            completed: false,
            },
        )
        setTasks(newTasks)
    }
    return (
        <div>
          <ul>
            {tasks.map((task, index) => {
              return (
                <>
                  <li key={index} style={{textDecoration: task.completed ? 'line-through' : 'none'}}>{task.title}</li>
                  <button onClick={() => handleDeleteTask(index)}>X</button>
                  <button onClick={() => handleCompleteTask(index)}>Y</button>
                </>
              );
            })}
          </ul>
          <button onClick={handleAddTask}>Add Task</button>
        </div>
      )
}
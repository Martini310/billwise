import { useState, useRef } from "react";
import { tasks as tasksData } from "../data/tasks";

export function TasksList() {
    const [tasks, setTasks] = useState(tasksData);

    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const completeRef = useRef(null);

    const handleDeleteTask = (index) => {
      const newTasks = [...tasks];
      newTasks.splice(index, 1);
      setTasks(newTasks);
    };

    const handleToggleStateTask = index => {
        const newTasks = [ ...tasks];
        newTasks[index].completed = !newTasks[index].completed;
        setTasks(newTasks);
    };

    const handleAddTask = () => {
        const newTasks = [ ...tasks];
        newTasks.push(
            {
            title: titleRef.current.value,
            description: descriptionRef.current.value,
            completed: completeRef.current.checked,
            },
        )
        setTasks(newTasks);
    };
    return (
        <div>
          Title:<input type="text" id="title" ref={titleRef} /><br />
          Description:<input type="text" id="description" ref={descriptionRef} /><br />
          Complete:<input type="checkbox" id="complete" ref={completeRef} />
          <button onClick={handleAddTask}>Add Task</button>

          { tasks.length == 0 ? (
            <div>Tasks list is empty!</div>
          ) : (
            <ul>
              {tasks.map(({ title, completed }, index) => {
                return (
                  <>
                    <li key={index} style={{textDecoration: completed ? 'line-through' : 'none'}}>
                      {title}
                      <button onClick={() => handleDeleteTask(index)}>Delete</button>
                      <button onClick={() => handleToggleStateTask(index)}>{completed ? 'Undo' : 'Complete'}</button>
                    </li>
                  </>
                );
              })}
            </ul>
          )}
        </div>
      )
}
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './App.css'

// Mock plugins (replace with actual implementations)
const Plugins = {
  LocalNotifications: {
    requestPermission: async () => ({ value: true }),
    schedule: async (notification) => console.log('Notification scheduled:', notification)
  },
  Modals: {
    alert: async (options) => window.alert(options.message)
  }
};

const { LocalNotifications, Modals } = Plugins;

export const App = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmDate, setAlarmDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Initialize notifications
  useEffect(() => {
    async function initNotifications() {
      const { value } = await LocalNotifications.requestPermission();
      if (!value) {
        await Modals.alert({
          title: 'Permission Required',
          message: 'Please enable notifications for alarm functionality',
        });
      }
    }
    initNotifications();
  }, []);

  const handleAddTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      alarm: alarmDate && alarmTime ? `${alarmDate}T${alarmTime}` : null
    };

    setTasks([...tasks, task]);
    resetForm();
    
    if (task.alarm) {
      scheduleNotification(task);
    }
  };

  const scheduleNotification = async (task) => {
    try {
      await LocalNotifications.schedule({
        title: 'Task Reminder',
        body: task.text,
        schedule: { at: new Date(task.alarm) },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setNewTask(task.text);
    if (task.alarm) {
      const alarmMoment = moment(task.alarm);
      setAlarmDate(alarmMoment.format('YYYY-MM-DD'));
      setAlarmTime(alarmMoment.format('HH:mm'));
    }
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleUpdateTask = () => {
    setTasks(tasks.map(task =>
      task.id === selectedTask.id
        ? {
            ...task,
            text: newTask,
            alarm: alarmDate && alarmTime ? `${alarmDate}T${alarmTime}` : null
          }
        : task
    ));
    closeModal();
  };

  const resetForm = () => {
    setNewTask('');
    setAlarmTime('');
    setAlarmDate('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setSelectedTask(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <p className="mt-2 text-sm text-gray-600">Organize your tasks with reminders</p>
        </div>

        {/* Task Input Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
                Task Description
              </label>
              <input
                type="text"
                id="task"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={alarmDate}
                  onChange={(e) => setAlarmDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  id="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={editMode ? handleUpdateTask : handleAddTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
            >
              {editMode ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No tasks yet. Add one above!
              </li>
            ) : (
              tasks.map(task => (
                <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.text}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.alarm && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {moment(task.alarm).format('MMM D, h:mm A')}
                        </span>
                      )}
                      <button
                        onClick={() => openEditModal(task)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Task</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-task" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Description
                </label>
                <input
                  type="text"
                  id="edit-task"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    value={alarmDate}
                    onChange={(e) => setAlarmDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    id="edit-time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
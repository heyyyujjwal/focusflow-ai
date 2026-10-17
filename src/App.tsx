import { useTasks } from './hooks/useTasks';
import Dashboard from './components/Dashboard';
import StudyPlanner from './components/StudyPlanner';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';

const YEAR = new Date().getFullYear();

export default function App() {
  const {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    search,
    setSearch,
    editingId,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    startEdit,
    cancelEdit,
    stats,
  } = useTasks();

  const editingTask = editingId ? tasks.find(t => t.id === editingId) : undefined;

  const counts = {
    all: tasks.length,
    active: stats.active,
    completed: stats.completed,
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-brand">
            <span className="app-brand__icon" aria-hidden="true">⚡</span>
            <h1 className="app-brand__name">FocusFlow</h1>
          </div>
          <p className="app-header__tagline">Your AI-powered study planner</p>
        </div>
      </header>

      <main className="app-main">
        <Dashboard
          total={stats.total}
          active={stats.active}
          completed={stats.completed}
          progress={stats.progress}
        />

        <StudyPlanner tasks={tasks} />

        <TaskForm
          editingTask={editingTask}
          onSubmit={editingTask ? (data) => updateTask(editingTask.id, data) : addTask}
          onCancel={cancelEdit}
        />

        <section className="tasks-section">
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            counts={counts}
          />
          <TaskList
            tasks={filteredTasks}
            onToggle={toggleComplete}
            onEdit={startEdit}
            onDelete={deleteTask}
            searchActive={search.trim().length > 0}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>FocusFlow &copy; {YEAR} &mdash; Built with React &amp; Vite</p>
      </footer>
    </div>
  );
}

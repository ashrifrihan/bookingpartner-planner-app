'use client';

import { useMemo, useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import { ArrowRightIcon } from '@/lib/visuals';

export default function TasksPage() {
  const {
    allDirectoryTasks,
    directoryCounts,
    directoryPhases,
    toggleItem,
    setInspectTask,
  } = usePlanner();

  const [directorySearch, setDirectorySearch] = useState('');
  const [tasksFilter, setTasksFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [directoryPhaseFilter, setDirectoryPhaseFilter] = useState<string>('all');
  const [directoryLimit, setDirectoryLimit] = useState(30);

  const filteredDirectoryTasks = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return allDirectoryTasks.filter((task) => {
      if (tasksFilter === 'active' && task.isDone) return false;
      if (tasksFilter === 'completed' && !task.isDone) return false;
      if (tasksFilter === 'overdue' && !task.isOverdue) return false;

      if (directoryPhaseFilter !== 'all' && task.day.phase !== directoryPhaseFilter) {
        return false;
      }

      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesPhase = task.day.phase.toLowerCase().includes(q);
        const matchesChip = task.chip.label.toLowerCase().includes(q);
        const matchesDayTitle = task.day.title.toLowerCase().includes(q);
        return matchesTitle || matchesPhase || matchesChip || matchesDayTitle;
      }

      return true;
    });
  }, [allDirectoryTasks, tasksFilter, directoryPhaseFilter, directorySearch]);

  return (
    <div className="tasks-directory-view">
      {/* Header */}
      <div className="ios-page-header">
        <div className="ios-header-left">
          <div className="ios-title-row">
            <h1 className="ios-page-title">Tasks</h1>
            <span className="ios-count-badge">
              {directoryCounts.completed} of {directoryCounts.total} Done
            </span>
          </div>
          <p className="ios-page-subtitle">
            All 84 sprint deliverables. Search, filter, and inspect.
          </p>
        </div>
        <div className="ios-header-right">
          <span className="ios-date-badge">84 Days</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ios-search-bar">
        <svg className="ios-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 19l-4.35-4.35M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by task title, API, schema, or phase..."
          value={directorySearch}
          onChange={(e) => {
            setDirectorySearch(e.target.value);
            setDirectoryLimit(30);
          }}
          className="ios-search-input"
        />
        {directorySearch && (
          <button
            type="button"
            className="ios-search-clear"
            onClick={() => setDirectorySearch('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Filter Pills Row */}
      <div className="ios-filter-pills-row">
        <button
          type="button"
          className={`ios-filter-pill ${tasksFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setTasksFilter('all');
            setDirectoryLimit(30);
          }}
        >
          All ({directoryCounts.total})
        </button>
        <button
          type="button"
          className={`ios-filter-pill ${tasksFilter === 'active' ? 'active' : ''}`}
          onClick={() => {
            setTasksFilter('active');
            setDirectoryLimit(30);
          }}
        >
          Active ({directoryCounts.active})
        </button>
        <button
          type="button"
          className={`ios-filter-pill ${tasksFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => {
            setTasksFilter('overdue');
            setDirectoryLimit(30);
          }}
        >
          Overdue ({directoryCounts.overdue})
        </button>
        <button
          type="button"
          className={`ios-filter-pill ${tasksFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setTasksFilter('completed');
            setDirectoryLimit(30);
          }}
        >
          Completed ({directoryCounts.completed})
        </button>
      </div>

      {/* Phase Filter Row */}
      <div className="directory-phase-pills-row">
        <button
          type="button"
          className={`phase-filter-pill ${directoryPhaseFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setDirectoryPhaseFilter('all');
            setDirectoryLimit(30);
          }}
        >
          All Phases
        </button>
        {directoryPhases.map((phase) => (
          <button
            type="button"
            key={phase}
            className={`phase-filter-pill ${directoryPhaseFilter === phase ? 'active' : ''}`}
            onClick={() => {
              setDirectoryPhaseFilter(phase);
              setDirectoryLimit(30);
            }}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Filter Status Summary */}
      <div className="directory-results-meta">
        <span>
          Showing {Math.min(directoryLimit, filteredDirectoryTasks.length)} of {filteredDirectoryTasks.length} task{filteredDirectoryTasks.length === 1 ? '' : 's'}
        </span>
        {(directorySearch || tasksFilter !== 'all' || directoryPhaseFilter !== 'all') && (
          <button
            type="button"
            className="directory-reset-link"
            onClick={() => {
              setDirectorySearch('');
              setTasksFilter('all');
              setDirectoryPhaseFilter('all');
              setDirectoryLimit(30);
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Individual Task Cards (matching media_1789766927628.png) */}
      <div className="ios-task-list">
        {filteredDirectoryTasks.slice(0, directoryLimit).map((task) => (
          <div className={`ios-task-card ${task.isDone ? 'done' : ''}`} key={task.key}>
            <div className="ios-card-top-row">
              <button
                type="button"
                className={`ios-checkbox-btn ${task.isDone ? 'checked' : ''}`}
                onClick={() => toggleItem(task.day, task.itemIndex)}
                aria-label={task.isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
              >
                {task.isDone && (
                  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                    <path d="M13.485 3.515a1 1 0 0 1 0 1.414l-6.364 6.364a1 1 0 0 1-1.414 0L2.515 8.1a1 1 0 0 1 1.414-1.414l2.478 2.478 5.657-5.657a1 1 0 0 1 1.414 0z" />
                  </svg>
                )}
              </button>

              <div className="ios-card-title-col">
                <h3 className="ios-task-title">{task.title}</h3>
                <div className="ios-task-meta-row">
                  <span>{task.day.phase}</span>
                  <span className="ios-meta-dot">•</span>
                  <span>Day {task.dayNum} of 84</span>
                </div>
              </div>

              <div className="ios-card-index-badge">#{task.itemIndex + 1}</div>
            </div>

            <div className="ios-card-divider" />

            <div className="ios-card-bottom-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`ios-chip ${task.chip.type}`}>{task.chip.label}</span>
                <div className="ios-status-indicator">
                  {task.isDone ? (
                    <span className="ios-status-pill completed">
                      <span className="status-dot" />
                      Completed
                    </span>
                  ) : task.isOverdue ? (
                    <span className="ios-status-pill overdue">
                      <span className="status-dot" />
                      Overdue
                    </span>
                  ) : (
                    <span className="ios-status-pill pending">
                      <span className="status-dot" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>{task.formattedDate}</span>
                <button
                  type="button"
                  className="ios-card-details-btn"
                  onClick={() => setInspectTask({ day: task.day, itemIndex: task.itemIndex })}
                >
                  <span>Details</span>
                  <ArrowRightIcon size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDirectoryTasks.length === 0 && (
          <div className="ios-empty-state">
            <p>No tasks match your search or filter.</p>
            <button
              type="button"
              className="ios-empty-reset"
              onClick={() => {
                setDirectorySearch('');
                setTasksFilter('all');
                setDirectoryPhaseFilter('all');
                setDirectoryLimit(30);
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Load More Pagination */}
      {filteredDirectoryTasks.length > directoryLimit && (
        <div className="directory-load-more-row">
          <button
            type="button"
            className="directory-load-more-btn"
            onClick={() => setDirectoryLimit((prev) => prev + 30)}
          >
            <span>Load More Tasks ({filteredDirectoryTasks.length - directoryLimit} remaining)</span>
            <ArrowRightIcon size={12} />
          </button>
          <button
            type="button"
            className="directory-show-all-btn"
            onClick={() => setDirectoryLimit(filteredDirectoryTasks.length)}
          >
            Show All ({filteredDirectoryTasks.length})
          </button>
        </div>
      )}
    </div>
  );
}

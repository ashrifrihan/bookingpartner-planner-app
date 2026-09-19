'use client';

import { useMemo, useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { MemoryCategory } from '@/lib/storage';

export default function MemoryPage() {
  const { memoryNotes, addMemoryNote, deleteMemoryNote } = usePlanner();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<MemoryCategory>('rule');

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memoryNotes.filter((note) => {
      if (categoryFilter !== 'all' && note.category !== categoryFilter) return false;
      if (q && !note.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [memoryNotes, categoryFilter, search]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addMemoryNote(newNoteText.trim(), newNoteCategory);
    setNewNoteText('');
    setShowAddForm(false);
  };

  const categories: MemoryCategory[] = ['rule', 'decision', 'architecture', 'credential', 'general'];

  return (
    <div className="memory-view">
      {/* Header */}
      <div className="ios-page-header">
        <div className="ios-header-left">
          <div className="ios-title-row">
            <h1 className="ios-page-title">Developer Memory</h1>
            <span className="ios-count-badge">
              {filteredNotes.length} Saved Notes
            </span>
          </div>
          <p className="ios-page-subtitle">
            Architecture decisions, credentials, rules, and caveats that survive across sessions.
          </p>
        </div>
        <div className="ios-header-right">
          <button
            type="button"
            className="ios-filter-pill active"
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{showAddForm ? '✕ Cancel' : '+ Add Note'}</span>
          </button>
        </div>
      </div>

      {/* Add New Note Card (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleCreateNote} className="ios-deliverable-card" style={{ marginBottom: '16px' }}>
          <span className="ios-deliverable-kicker">ADD TO DEVELOPER MEMORY</span>
          <h2 className="ios-deliverable-title" style={{ fontSize: '15px', marginBottom: '10px' }}>
            Record a rule, decision, or credential
          </h2>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px' }}>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`ios-filter-pill ${newNoteCategory === cat ? 'active' : ''}`}
                onClick={() => setNewNoteCategory(cat)}
                style={{ fontSize: '11.5px', padding: '5px 10px', textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <textarea
            className="ios-search-input"
            rows={3}
            placeholder="e.g. Rule: PayHere original-method refunds only, no internal wallet..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--line-strong)',
              borderRadius: '12px',
              padding: '10px',
              color: 'var(--ink-primary)',
              fontSize: '13.5px',
              resize: 'vertical',
              marginBottom: '10px',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="ios-mini-action-btn"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ios-mini-action-btn primary"
              disabled={!newNoteText.trim()}
            >
              Save to Memory
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="ios-search-bar">
        <svg className="ios-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 19l-4.35-4.35M17 9A8 8 0 1 1 1 9a8 8 0 0 1 16 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search memory rules and decisions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ios-search-input"
        />
        {search && (
          <button
            type="button"
            className="ios-search-clear"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="ios-filter-pills-row">
        <button
          type="button"
          className={`ios-filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All ({memoryNotes.length})
        </button>
        {categories.map((cat) => {
          const count = memoryNotes.filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              className={`ios-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              style={{ textTransform: 'capitalize' }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Memory Notes Cards */}
      <div className="ios-task-list">
        {filteredNotes.map((note) => (
          <div className="ios-task-card" key={note.id}>
            <div className="ios-card-top-row" style={{ alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--line-subtle)',
                  color: 'var(--ink-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                {note.category[0]}
              </div>

              <div className="ios-card-title-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className={`ios-chip ${note.category}`} style={{ textTransform: 'uppercase' }}>
                    {note.category}
                  </span>
                  <span className="ios-meta-dot">•</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.45, color: 'var(--ink-primary)' }}>
                  {note.text}
                </p>
              </div>

              <button
                type="button"
                className="ios-search-clear"
                onClick={() => deleteMemoryNote(note.id)}
                title="Delete note"
                style={{ color: 'var(--ink-muted)', padding: '2px 6px' }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="ios-empty-state">
            <p>No memory notes match your filter or search.</p>
            <button
              type="button"
              className="ios-empty-reset"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

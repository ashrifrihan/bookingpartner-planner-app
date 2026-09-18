'use client';

import { useState } from 'react';
import type { DeveloperMemoryItem, MemoryCategory } from '@/lib/storage';

const CATEGORY_TABS: { id: 'all' | MemoryCategory; label: string }[] = [
  { id: 'all', label: 'All Notes' },
  { id: 'rule', label: 'Rules & Constraints' },
  { id: 'credential', label: 'Credentials' },
  { id: 'decision', label: 'Decisions' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'general', label: 'General' },
];

export function DeveloperMemorySection({
  memoryNotes,
  onAddNote,
  onDeleteNote,
}: {
  memoryNotes: DeveloperMemoryItem[];
  onAddNote: (text: string, category: MemoryCategory) => void;
  onDeleteNote: (id: string) => void;
}) {
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory>('rule');
  const [filterTab, setFilterTab] = useState<'all' | MemoryCategory>('all');
  const [addedNotice, setAddedNotice] = useState(false);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onAddNote(inputText, selectedCategory);
    setInputText('');
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const filteredNotes = memoryNotes.filter((note) => {
    if (filterTab === 'all') return true;
    return note.category === filterTab;
  });

  return (
    <div className="dev-memory-container">
      {/* Header */}
      <div className="dev-memory-header">
        <div className="dev-memory-title-group">
          <div>
            <h2>Developer Memory</h2>
            <p>
              Persistent project decisions, architecture constraints, and credentials. Referenced by the AI Assistant.
            </p>
          </div>
        </div>

        <div className="memory-stats-chip">
          <span>{memoryNotes.length} saved memories</span>
          <span className="ai-active-indicator">Active in AI reasoning</span>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleAdd} className="dev-memory-input-card">
        <div className="memory-form-top">
          <input
            type="text"
            className="memory-text-input"
            placeholder="Add a rule, decision, or credential constraint..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <select
            className="memory-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as MemoryCategory)}
            aria-label="Memory category"
          >
            <option value="rule">Rule / Constraint</option>
            <option value="credential">Credential / Key</option>
            <option value="decision">Tech Decision</option>
            <option value="architecture">Architecture</option>
            <option value="general">General Note</option>
          </select>

          <button
            type="submit"
            className="primary-button compact"
            disabled={!inputText.trim()}
          >
            Save Memory
          </button>
        </div>

        {addedNotice && (
          <span className="memory-saved-feedback">Saved to developer memory.</span>
        )}
      </form>

      {/* Filter Tabs */}
      <div className="memory-filter-strip">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`memory-tab-btn ${filterTab === tab.id ? 'active' : ''}`}
            onClick={() => setFilterTab(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Memory Items List */}
      <div className="dev-memory-list">
        {filteredNotes.length === 0 ? (
          <div className="memory-empty-state">
            <p>No memory items under this filter yet.</p>
            <span className="empty-subtext">Save important architectural decisions or credentials above.</span>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className={`memory-item-card category-${note.category}`}>
              <div className="memory-item-content">
                <div className="memory-item-meta">
                  <span className={`memory-cat-pill cat-${note.category}`}>
                    {note.category.toUpperCase()}
                  </span>
                  <span className="memory-date-stamp">
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="memory-item-text">{note.text}</p>
              </div>

              <button
                type="button"
                className="memory-delete-btn"
                onClick={() => onDeleteNote(note.id)}
                title="Remove memory item"
                aria-label="Delete memory item"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

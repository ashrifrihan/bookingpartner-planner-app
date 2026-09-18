const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Add background-image dotted canvas to body
css = css.replace(
  /body\s*\{([^}]+)\}/,
  (match, p1) => {
    if (!p1.includes('background-image')) {
      return `body {${p1}  background-image: radial-gradient(rgba(148, 163, 184, 0.25) 1.2px, transparent 1.2px);\n  background-size: 24px 24px;\n}`;
    }
    return match;
  }
);

const newStyles = `
/* ==========================================================================
   CANVAS DOTTED GRID BACKGROUND & GLOBAL OVERLAYS (User Reference Design)
   ========================================================================== */
[data-theme="dark"] body {
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px) !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  animation: fadeInOverlay 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ==========================================================================
   FLOW CANVAS & NODE CARD ARCHITECTURE
   ========================================================================== */
.flow-canvas-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: -10px;
}

.flow-client-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: var(--surface-card);
  border: 1px solid var(--line-subtle);
  border-radius: 9999px;
  box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.05);
  font-size: 13px;
  color: var(--ink-secondary);
}

.flow-client-pill strong {
  color: var(--ink-primary);
}

.client-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.flow-pill-separator {
  color: var(--ink-muted);
  opacity: 0.6;
}

.flow-stem-connector {
  width: 2px;
  height: 22px;
  background: linear-gradient(to bottom, #93c5fd, #3b82f6);
  border-radius: 2px;
  margin: 4px 0;
}

.flow-node-card.central-task-node {
  background: var(--surface-card);
  border: 1px solid var(--line-subtle);
  border-radius: 22px;
  padding: 24px 28px;
  box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.05), 0 2px 8px -2px rgba(15, 23, 42, 0.02);
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: all 0.25s ease;
}

.flow-node-card.central-task-node:hover {
  box-shadow: 0 16px 40px -6px rgba(15, 23, 42, 0.08);
}

.flow-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.flow-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flow-node-badge {
  display: inline-flex;
}

.flow-node-badge span {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  padding: 3px 9px;
  border-radius: 6px;
}

.flow-deliverable-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--ink-primary);
  letter-spacing: -0.01em;
}

.flow-assignee-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-secondary);
}

.meta-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  font-size: 10px;
  font-weight: 600;
}

.meta-separator {
  color: var(--ink-muted);
}

.flow-techstack-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--line-subtle);
  flex-wrap: wrap;
}

.techstack-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.techstack-pills-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.flow-tech-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  background: var(--surface-card-elevated);
  border: 1px solid var(--line-subtle);
  color: var(--ink-secondary);
}

.flow-action-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.flow-pill-action {
  padding: 7px 14px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 500;
  background: var(--surface-card-elevated);
  border: 1px solid var(--line-subtle);
  color: var(--ink-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
}

.flow-pill-action:hover {
  background: var(--pill-hover);
  transform: translateY(-1px);
}

.flow-pill-action.primary {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  font-weight: 600;
}

.flow-pill-action.primary:hover {
  background: #1d4ed8;
}

.flow-pill-action.warning {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.25);
  font-weight: 600;
}

.flow-subtasks-head {
  margin-bottom: 12px;
}

.flow-subtasks-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 4px;
}

/* Floating Subtask Cards */
.checklist .check-row {
  background: var(--surface-card);
  border: 1px solid var(--line-subtle);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.03);
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.checklist .check-row:hover {
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 4px 14px -2px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.checklist .check-row.checked {
  background: rgba(16, 185, 129, 0.04);
  border-color: rgba(16, 185, 129, 0.25);
}

/* ==========================================================================
   DAILY STANDUP REPORT MODAL (Matching User Reference Design)
   ========================================================================== */
.whatsapp-modal-container.flow-modal {
  width: 620px;
  max-width: 95vw;
  max-height: 90vh;
  background: var(--surface-card);
  border-radius: 22px;
  border: 1px solid var(--line-strong);
  box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: auto;
  animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.whatsapp-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px 14px;
  border-bottom: 1px solid var(--line-subtle);
}

.whatsapp-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-node-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: var(--surface-card-elevated);
  border: 1px solid var(--line-subtle);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-secondary);
  width: fit-content;
  margin-bottom: 2px;
}

.node-dot.live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
}

.node-time {
  color: var(--ink-muted);
}

.whatsapp-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink-primary);
}

.whatsapp-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--ink-secondary);
}

.standup-view-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--line-subtle);
  gap: 12px;
  flex-wrap: wrap;
}

.segmented-pills {
  display: inline-flex;
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--line-subtle);
  border-radius: 9999px;
  padding: 3px;
  gap: 2px;
}

.segmented-pills .pill-btn {
  padding: 5px 12px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.segmented-pills .pill-btn.active {
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.progress-pill-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--ink-secondary);
}

.progress-pill-compact strong {
  color: #2563eb;
}

.standup-modal-content {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
  display: flex;
  flex-direction: column;
}

.standup-cards-flow {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.standup-flow-card {
  background: var(--surface-card);
  border: 1px solid var(--line-subtle);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04);
}

.summary-card {
  background: var(--surface-card-elevated);
}

.summary-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-micro-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
}

.summary-card-title {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-primary);
}

.summary-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.standup-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  background: var(--line-subtle);
  overflow: hidden;
}

.standup-progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #2563eb, #10b981);
  transition: width 0.3s ease;
}

.flow-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.flow-card-tag {
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.tag-green {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.tag-blue {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.tag-red {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.tag-slate {
  background: var(--surface-card-elevated);
  color: var(--ink-secondary);
}

.flow-card-time {
  font-size: 11.5px;
  color: var(--ink-muted);
}

.standup-task-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.standup-task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--surface-sunken);
  border: 1px solid var(--line-subtle);
  font-size: 13px;
  color: var(--ink-primary);
}

.task-check-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.18);
  color: #059669;
  font-size: 11px;
  font-weight: 600;
}

.task-pending-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  margin: 0 5px;
}

.task-blocked-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.18);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
}

.task-tomorrow-arrow {
  color: var(--ink-muted);
  font-weight: 600;
}

.standup-empty-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-sunken);
  font-size: 12.5px;
  color: var(--ink-muted);
}

.whatsapp-preview-box {
  background: var(--surface-sunken);
  border: 1px solid var(--line-subtle);
  border-radius: 14px;
  overflow: hidden;
}

.whatsapp-bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--surface-card-elevated);
  border-bottom: 1px solid var(--line-subtle);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-muted);
}

.whatsapp-text-preview {
  margin: 0;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.whatsapp-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--line-subtle);
  background: var(--surface-card);
  gap: 12px;
  flex-wrap: wrap;
}

.footer-copy-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.copy-report-pill-btn {
  padding: 8px 14px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 500;
  background: var(--surface-card-elevated);
  border: 1px solid var(--line-subtle);
  color: var(--ink-primary);
  cursor: pointer;
  transition: all 0.18s ease;
  min-height: 38px;
}

.copy-report-pill-btn:hover {
  background: var(--pill-hover);
}

.copy-report-pill-btn.copied {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

.whatsapp-copy-btn {
  padding: 8px 18px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  background: #2563eb;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  min-height: 38px;
}

.whatsapp-copy-btn:hover {
  background: #1d4ed8;
}

.whatsapp-copy-btn.copied {
  background: #10b981;
}
`;

css = css.replace('/* Eliminate over-bold weights', newStyles + '\n/* Eliminate over-bold weights');

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('Applied redesign CSS successfully!');

'use client';

import { useState } from 'react';
import {
  formatWhatsAppReport,
  formatSlackReport,
  type WhatsAppReportData,
} from '@/lib/plan';
import { ArrowRightIcon } from '@/lib/visuals';

export function WhatsAppReportModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: WhatsAppReportData;
}) {
  const [viewMode, setViewMode] = useState<'cards' | 'text'>('cards');
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = data.completedTasks.length + data.pendingTasks.length;
  const completedCount = data.completedTasks.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const formattedWhatsApp = formatWhatsAppReport(data);
  const formattedSlack = formatSlackReport(data);

  const handleCopy = async (text: string, targetName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(targetName);
      setTimeout(() => setCopiedTarget(null), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedTarget(targetName);
      setTimeout(() => setCopiedTarget(null), 2500);
    }
  };

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="standup-modal-title"
    >
      <div
        className="whatsapp-modal-container flow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Node Header */}
        <div className="whatsapp-modal-header">
          <div className="whatsapp-header-left">
            <div className="modal-node-pill">
              <span className="node-dot live" />
              <span>Developer Standup</span>
              <span className="node-time">{currentTime}</span>
            </div>
            <h2 id="standup-modal-title" className="whatsapp-title">
              Daily Standup Report
            </h2>
            <p className="whatsapp-subtitle">
              Structured summary ready for WhatsApp, Slack, and team updates
            </p>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="standup-view-toggle-bar">
          <div className="segmented-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Structured Cards
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'text' ? 'active' : ''}`}
              onClick={() => setViewMode('text')}
            >
              Message Preview
            </button>
          </div>

          <div className="progress-pill-compact">
            <span>Progress:</span>
            <strong>
              {completedCount} / {total} ({progressPercent}%)
            </strong>
          </div>
        </div>

        {/* Content Area */}
        <div className="standup-modal-content">
          {viewMode === 'cards' ? (
            <div className="standup-cards-flow">
              {/* Progress Summary Card */}
              <div className="standup-flow-card summary-card">
                <div className="summary-card-top">
                  <div>
                    <span className="card-micro-label">SPRINT PACE</span>
                    <h4 className="summary-card-title">
                      {progressPercent === 100
                        ? 'All tasks completed for today'
                        : `${total - completedCount} task${total - completedCount === 1 ? '' : 's'} remaining`}
                    </h4>
                  </div>
                  <span className="summary-badge">{progressPercent}% DONE</span>
                </div>
                <div className="standup-progress-track">
                  <div
                    className="standup-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Completed Section Card */}
              <div className="standup-flow-card completed-section-card">
                <div className="flow-card-head">
                  <div className="tag-group">
                    <span className="flow-card-tag tag-green">
                      Completed ({completedCount})
                    </span>
                  </div>
                  <span className="flow-card-time">{data.date}</span>
                </div>

                {data.completedTasks.length > 0 ? (
                  <ul className="standup-task-items">
                    {data.completedTasks.map((task, idx) => (
                      <li key={idx} className="standup-task-row done">
                        <span className="task-check-circle">✓</span>
                        <span className="task-text">{task}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="standup-empty-card">
                    <span>No tasks marked completed today yet.</span>
                  </div>
                )}
              </div>

              {/* Pending Section Card */}
              <div className="standup-flow-card pending-section-card">
                <div className="flow-card-head">
                  <div className="tag-group">
                    <span className="flow-card-tag tag-blue">
                      Pending ({data.pendingTasks.length})
                    </span>
                  </div>
                  <span className="flow-card-time">Target: Today</span>
                </div>

                {data.pendingTasks.length > 0 ? (
                  <ul className="standup-task-items">
                    {data.pendingTasks.map((task, idx) => (
                      <li key={idx} className="standup-task-row pending">
                        <span className="task-pending-dot" />
                        <span className="task-text">{task}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="standup-empty-card">
                    <span>All scheduled tasks for today are done.</span>
                  </div>
                )}
              </div>

              {/* Blocked Tasks (if any) */}
              {data.blockedTasks.length > 0 && (
                <div className="standup-flow-card blocked-section-card">
                  <div className="flow-card-head">
                    <div className="tag-group">
                      <span className="flow-card-tag tag-red">
                        Blocked ({data.blockedTasks.length})
                      </span>
                    </div>
                  </div>
                  <ul className="standup-task-items">
                    {data.blockedTasks.map((task, idx) => (
                      <li key={idx} className="standup-task-row blocked">
                        <span className="task-blocked-dot">!</span>
                        <span className="task-text">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tomorrow Plan Card */}
              {data.tomorrowTasks.length > 0 && (
                <div className="standup-flow-card tomorrow-section-card">
                  <div className="flow-card-head">
                    <div className="tag-group">
                      <span className="flow-card-tag tag-slate">
                        Tomorrow ({data.tomorrowTasks.length})
                      </span>
                    </div>
                    <span className="flow-card-time">Next Milestone</span>
                  </div>
                  <ul className="standup-task-items">
                    {data.tomorrowTasks.map((task, idx) => (
                      <li key={idx} className="standup-task-row tomorrow">
                        <span className="task-tomorrow-arrow">
                          <ArrowRightIcon size={12} />
                        </span>
                        <span className="task-text">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Plain Text / Message Preview Mode */
            <div className="whatsapp-preview-box">
              <div className="whatsapp-bubble-header">
                <span className="bubble-label">WHATSAPP / SLACK TEXT PREVIEW</span>
                <span className="bubble-time">{currentTime}</span>
              </div>
              <pre className="whatsapp-text-preview">{formattedWhatsApp}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="whatsapp-modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>

          <div className="footer-copy-group">
            <button
              type="button"
              className={`copy-report-pill-btn slack ${copiedTarget === 'slack' ? 'copied' : ''}`}
              onClick={() => handleCopy(formattedSlack, 'slack')}
              title="Copy formatted with Slack markdown (*bold* and quotes)"
            >
              {copiedTarget === 'slack' ? '✓ Copied for Slack' : 'Copy for Slack'}
            </button>

            <button
              type="button"
              className={`primary-button whatsapp-copy-btn ${copiedTarget === 'whatsapp' ? 'copied' : ''}`}
              onClick={() => handleCopy(formattedWhatsApp, 'whatsapp')}
              title="Copy formatted for WhatsApp"
            >
              {copiedTarget === 'whatsapp' ? '✓ Copied to Clipboard' : 'Copy for WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

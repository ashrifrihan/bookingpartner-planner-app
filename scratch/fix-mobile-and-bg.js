const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Remove dotted background-image from body
css = css.replace(/background-image:\s*radial-gradient\([^;]+;\s*/g, '');
css = css.replace(/background-size:\s*24px\s*24px;\s*/g, '');
css = css.replace(/\[data-theme="dark"\]\s*body\s*\{\s*background-image:[^;]+;\s*\}/g, '');

// Clean any leftover radial-gradient in globals.css
css = css.replace(/radial-gradient\([^)]+\)/g, 'none');

// 2. Add Mobile-First Design & Font Scaling Rules to prevent layout collapse
const mobileStyles = `
/* ==========================================================================
   MOBILE RESPONSIVENESS & FONT DESIGN COLLAPSE PREVENTION
   ========================================================================== */
@media (max-width: 640px) {
  /* Prevent horizontal overflow on phone viewports */
  html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  body {
    padding-bottom: 96px !important;
  }

  .app-shell {
    padding: 10px 12px 100px 12px !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }

  /* Font Scaling: prevent oversized fonts from breaking layout */
  h1 {
    font-size: 20px !important;
    line-height: 1.25 !important;
    letter-spacing: -0.01em !important;
  }

  h2 {
    font-size: 18px !important;
    line-height: 1.28 !important;
    letter-spacing: -0.01em !important;
  }

  h3 {
    font-size: 15px !important;
    line-height: 1.3 !important;
  }

  p {
    font-size: 13px !important;
    line-height: 1.45 !important;
  }

  /* Flow Canvas Top Node */
  .flow-canvas-top {
    margin-bottom: 0 !important;
    width: 100% !important;
  }

  .flow-client-pill {
    padding: 6px 12px !important;
    font-size: 11px !important;
    width: 100% !important;
    justify-content: center !important;
    text-align: center !important;
    gap: 6px !important;
    border-radius: 12px !important;
    box-sizing: border-box !important;
  }

  .flow-stem-connector {
    height: 12px !important;
    margin: 2px 0 !important;
  }

  /* Central Deliverable Card */
  .flow-node-card.central-task-node {
    padding: 16px 14px !important;
    border-radius: 18px !important;
    gap: 12px !important;
    box-sizing: border-box !important;
  }

  .flow-card-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  .flow-header-left {
    width: 100% !important;
    gap: 4px !important;
  }

  .flow-deliverable-title {
    font-size: 18px !important;
    line-height: 1.25 !important;
    word-break: break-word !important;
  }

  .flow-assignee-meta {
    font-size: 12px !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }

  .flow-header-right {
    width: 100% !important;
  }

  .flow-progress-cluster {
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
  }

  .progress-fraction-badge {
    font-size: 12.5px !important;
  }

  .remaining-alert-pill, .all-completed-pill {
    font-size: 11px !important;
    padding: 3px 8px !important;
  }

  /* Tech Stack Mini Bar */
  .flow-techstack-bar {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 6px !important;
    padding-top: 10px !important;
  }

  .techstack-title {
    font-size: 10.5px !important;
  }

  .techstack-pills-list {
    gap: 4px !important;
    flex-wrap: wrap !important;
  }

  .flow-tech-chip {
    font-size: 10.5px !important;
    padding: 2px 7px !important;
    border-radius: 6px !important;
  }

  /* Quick Action Buttons: 2-column mobile grid */
  .flow-action-pills-row {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6px !important;
    width: 100% !important;
  }

  .flow-pill-action {
    width: 100% !important;
    text-align: center !important;
    justify-content: center !important;
    font-size: 11.5px !important;
    padding: 8px 4px !important;
    min-height: 36px !important;
    border-radius: 10px !important;
  }

  /* Bento Grid Columns: Stack neatly */
  .dashboard-main-grid {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
  }

  /* Subtasks section head */
  .flow-subtasks-head {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
  }

  .flow-subtasks-badge {
    font-size: 10px !important;
  }

  .section-meta-chip {
    font-size: 11px !important;
  }

  /* Subtasks / Checklist Cards */
  .checklist .check-row {
    padding: 10px 12px !important;
    gap: 8px !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
    flex-wrap: wrap !important;
  }

  .check-row-toggle {
    margin-right: 2px !important;
  }

  .task-chip {
    font-size: 10px !important;
    padding: 2px 6px !important;
  }

  .check-text {
    font-size: 13px !important;
    line-height: 1.35 !important;
    flex: 1 1 140px !important;
    min-width: 0 !important;
    word-break: break-word !important;
  }

  .task-inspect-btn {
    font-size: 11px !important;
    padding: 4px 8px !important;
    min-height: 28px !important;
    border-radius: 6px !important;
    margin-left: auto !important;
  }

  /* Modals on Mobile: Convert to Bottom Sheet pattern */
  .modal-overlay {
    padding: 0 !important;
    align-items: flex-end !important;
  }

  .whatsapp-modal-container.flow-modal,
  .eod-modal-container,
  .catchup-modal-container,
  .task-detail-drawer {
    width: 100% !important;
    max-width: 100vw !important;
    border-radius: 20px 20px 0 0 !important;
    max-height: 90vh !important;
    margin: 0 !important;
  }

  .whatsapp-modal-header,
  .eod-header,
  .catchup-modal-header,
  .drawer-header {
    padding: 16px 16px 12px !important;
  }

  .whatsapp-title, .eod-title, .catchup-modal-title, .drawer-task-title {
    font-size: 17px !important;
    line-height: 1.25 !important;
  }

  .whatsapp-subtitle, .eod-subtitle, .catchup-modal-subtitle {
    font-size: 12px !important;
  }

  .standup-view-toggle-bar {
    padding: 8px 16px !important;
    gap: 8px !important;
  }

  .segmented-pills .pill-btn {
    padding: 4px 8px !important;
    font-size: 11px !important;
  }

  .progress-pill-compact {
    font-size: 11px !important;
  }

  .standup-modal-content {
    padding: 14px 16px !important;
    max-height: calc(90vh - 150px) !important;
  }

  .whatsapp-modal-footer, .eod-footer, .catchup-modal-footer {
    padding: 12px 16px 20px !important;
    flex-direction: column !important;
    width: 100% !important;
    gap: 8px !important;
  }

  .footer-copy-group {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }

  .copy-report-pill-btn, .whatsapp-copy-btn, .secondary-button, .primary-button {
    width: 100% !important;
    text-align: center !important;
    justify-content: center !important;
    font-size: 12.5px !important;
    min-height: 38px !important;
  }

  /* Floating Bottom Dock on Mobile */
  .dock-wrapper {
    bottom: 12px !important;
    padding: 0 8px !important;
  }

  .floating-dock {
    padding: 4px 6px !important;
    gap: 2px !important;
    max-width: 100vw !important;
  }

  .dock-item {
    padding: 8px 8px !important;
    font-size: 10.5px !important;
    gap: 3px !important;
  }

  .dock-item svg {
    width: 15px !important;
    height: 15px !important;
  }
}

@media (max-width: 390px) {
  /* Ultra-compact for small phones like iPhone SE */
  .dock-item span {
    display: none !important;
  }

  .dock-item {
    padding: 8px 10px !important;
  }

  .flow-action-pills-row {
    grid-template-columns: 1fr !important;
  }
}
`;

css = css.replace('/* Eliminate over-bold weights', mobileStyles + '\n/* Eliminate over-bold weights');

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('Successfully updated globals.css with clean solid background and mobile responsiveness!');

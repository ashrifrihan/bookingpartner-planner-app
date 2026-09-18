const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

// Replace 550 and 650 with 500 and 600
css = css.replace(/font-weight:\s*550;/g, 'font-weight: 500;');
css = css.replace(/font-weight:\s*650;/g, 'font-weight: 600;');

const dockStyles = `
/* ==========================================================================
   FLOATING CAPSULE BOTTOM DOCK
   ========================================================================== */
.dock-wrapper {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  pointer-events: none;
  padding: 0 16px;
}

.floating-dock {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: var(--surface-dock);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--line-strong);
  border-radius: 9999px;
  box-shadow: var(--dock-shadow);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] .floating-dock {
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.25), 0 4px 12px rgba(15, 23, 42, 0.15);
}

[data-theme="light"] .floating-dock .dock-item {
  color: #94a3b8;
}

[data-theme="light"] .floating-dock .dock-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .floating-dock .dock-item.active {
  background: #ffffff;
  color: #0f172a;
}

[data-theme="light"] .floating-dock .dock-separator {
  background: rgba(255, 255, 255, 0.15);
}

[data-theme="light"] .floating-dock .dock-theme-btn {
  color: #94a3b8;
}

[data-theme="light"] .floating-dock .dock-theme-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.dock-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.dock-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dock-item:hover {
  color: var(--ink-primary);
  background: var(--pill-hover);
}

.dock-item.active {
  background: var(--pill-active);
  color: var(--pill-active-ink);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.dock-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  line-height: 1.2;
}

.dock-badge.alert {
  background: #f43f5e;
  color: #ffffff;
}

.dock-separator {
  width: 1px;
  height: 18px;
  background: var(--line-strong);
  margin: 0 2px;
}

.dock-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  color: var(--ink-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dock-theme-btn:hover {
  color: var(--ink-primary);
  background: var(--pill-hover);
}

@media (max-width: 600px) {
  .dock-item span {
    display: none;
  }
  .dock-item {
    padding: 10px 12px;
  }
}
`;

// Append dockStyles before the final h1,h2 cap rule
css = css.replace('/* Eliminate over-bold weights', dockStyles + '\n/* Eliminate over-bold weights');

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('Successfully updated globals.css');

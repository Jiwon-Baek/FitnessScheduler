(() => {
  const css = `
    :root {
      --bg: #fbf8ff;
      --surface: #ffffff;
      --surface-soft: #f5efff;
      --surface-strong: #eee3fb;
      --ink: #252031;
      --muted: #756d82;
      --line: #d9cbe9;
      --line-strong: #bda6d8;
      --brand: #8b63c7;
      --brand-dark: #563383;
      --danger: #f15b59;
      --danger-soft: #f2a8a8;
      --cream: #faedbc;
      --aqua: #6ed6ee;
      --green: #83b947;
      --green-dark: #486627;
      --shadow: 0 18px 44px rgba(68, 43, 105, 0.14);
      --radius: 8px;
      color-scheme: light;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      min-height: 100%;
      background: var(--bg);
      color: var(--ink);
    }

    button, input {
      font: inherit;
    }

    button {
      min-height: 44px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
      touch-action: manipulation;
    }

    button:active { transform: translateY(1px); }
    button:focus-visible, input:focus-visible {
      outline: 3px solid rgba(110, 214, 238, 0.65);
      outline-offset: 2px;
    }

    .app-shell {
      width: min(1180px, 100%);
      min-height: 100dvh;
      margin: 0 auto;
      padding: 22px;
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 16px;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(210px, 260px) minmax(620px, 1fr);
      gap: 18px;
      min-height: 0;
    }

    .member-panel,
    .schedule-panel {
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      min-height: 0;
    }

    .member-panel {
      display: grid;
      grid-template-rows: auto 1fr;
      overflow: hidden;
    }

    .panel-title {
      margin: 0;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--brand-dark);
    }

    .member-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      overflow: auto;
    }

    .member-row {
      width: 100%;
      min-height: 52px;
      padding: 9px 10px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 7px;
      text-align: left;
      border-color: transparent;
      background: var(--surface-soft);
    }

    .member-row.is-active {
      border-color: var(--brand);
      background: #efe6fb;
    }

    .member-name {
      font-weight: 800;
      color: var(--ink);
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      min-height: 18px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--cream);
      color: #5b4d19;
      font-size: 0.78rem;
      font-weight: 800;
    }

    .schedule-panel {
      position: relative;
      overflow: auto;
      padding: 14px;
    }

    .schedule-grid {
      min-width: 690px;
      display: grid;
      grid-template-columns: 58px repeat(7, minmax(82px, 1fr));
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--surface);
    }

    .cell {
      min-height: 50px;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      display: grid;
      place-items: center;
      position: relative;
      padding: 6px;
      user-select: none;
    }

    .cell:nth-child(8n) { border-right: none; }
    .cell.header,
    .cell.time {
      background: var(--surface-strong);
      color: var(--brand-dark);
      font-weight: 900;
    }

    .cell.slot {
      background: #fff;
      cursor: pointer;
      min-height: 58px;
    }

    .cell.slot:hover { background: #faf5ff; }

    .cell.closed {
      background: #e4e0e8;
      color: #7b7483;
      cursor: not-allowed;
    }

    .cell.available {
      background: rgba(110, 214, 238, 0.24);
    }

    .cell.assigned {
      background: #ecf6df;
      color: var(--green-dark);
      font-weight: 900;
    }

    .cell.selected {
      box-shadow: inset 0 0 0 3px var(--brand);
    }

    .assignment-name {
      max-width: 100%;
      overflow-wrap: anywhere;
      text-align: center;
      line-height: 1.2;
    }

    .toolbar {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .primary {
      background: var(--brand);
      border-color: var(--brand);
      color: white;
      font-weight: 900;
    }

    .soft {
      background: var(--surface-soft);
      color: var(--brand-dark);
      font-weight: 800;
    }

    .danger {
      background: #fff4f4;
      border-color: var(--danger-soft);
      color: #a02b2a;
      font-weight: 800;
    }

    .overlay {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 22px;
      background: rgba(37, 32, 49, 0.28);
      z-index: 10;
    }

    .dialog {
      width: min(860px, 100%);
      max-height: min(780px, calc(100dvh - 36px));
      overflow: auto;
      border-radius: var(--radius);
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: 0 24px 80px rgba(37, 32, 49, 0.25);
      padding: 18px;
    }

    .dialog-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 14px;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.2rem;
      color: var(--brand-dark);
    }

    .dialog-copy {
      margin: 6px 0 0;
      color: var(--muted);
      line-height: 1.45;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .member-form {
      display: grid;
      gap: 10px;
      margin-bottom: 14px;
    }

    .text-field {
      width: 100%;
      min-height: 44px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      padding: 0 12px;
      background: #fff;
      color: var(--ink);
    }

    .memo-field {
      min-height: 92px;
      padding-top: 10px;
      resize: vertical;
      line-height: 1.45;
    }

    .edit-grid {
      display: grid;
      grid-template-columns: 48px repeat(7, minmax(64px, 1fr));
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .edit-grid .cell {
      min-height: 44px;
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 14px;
    }

    .action-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .popover {
      position: fixed;
      z-index: 8;
      min-width: 190px;
      max-width: min(320px, calc(100vw - 32px));
      background: var(--surface);
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 10px;
    }

    .popover-title {
      margin: 0 0 8px;
      font-weight: 900;
      color: var(--brand-dark);
    }

    .candidate {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
      padding: 7px 0;
      border-top: 1px solid var(--line);
    }

    .candidate:first-of-type { border-top: none; }

    .empty {
      color: var(--muted);
      line-height: 1.45;
      padding: 8px 0;
    }

    .hidden { display: none !important; }

    @media (max-width: 900px) {
      .app-shell {
        padding: 14px;
      }

      .workspace {
        grid-template-columns: 1fr;
      }

      .member-panel {
        min-height: 150px;
      }

      .member-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(150px, 1fr));
        overflow: visible;
      }

      .toolbar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 620px) {
      .member-list,
      .form-row {
        grid-template-columns: 1fr;
      }

      .toolbar {
        grid-template-columns: 1fr;
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

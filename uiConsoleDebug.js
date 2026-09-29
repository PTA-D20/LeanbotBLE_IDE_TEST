// import './uiConsoleDebug.css';

/**

* References & Technical Specifications:
* * Monkey patching window.console methods:
* https://stackoverflow.com/questions/18391212/is-it-possible-to-capture-console-log-output-and-append-it-to-a-log-file
* * Safe JSON stringify to avoid circular reference exceptions:
* https://stackoverflow.com/questions/11616630/json-stringify-avoid-circular-reference
* * Web Clipboard API:
* https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
  */

export class UIDebug {
#container = null;
#logsContainer = null;
#rawLogs = [];
#isMounted = false;
#height = 220;
#originalConsole = {
log: console.log,
warn: console.warn,
error: console.error,
info: console.info
};

constructor(options = {}) {
this.#height = options.height || 220;


// Auto-mount upon instance creation
this.mount();

if (options.interceptConsole !== false) {
  this.interceptConsole();
}


}

/**

* Mounts the debug panel to the document body and shrinks body height.
  */
  mount() {
  if (this.#isMounted) return;


// Create main container



this.#container = document.createElement('div');
this.#container.className = 'ui-debug-container';
this.#container.style.height = `${this.#height}px`;

// Header toolbar
const header = document.createElement('div');
header.className = 'ui-debug-header';

const title = document.createElement('span');
title.className = 'ui-debug-title';
title.textContent = 'Console Debug';

const actions = document.createElement('div');
actions.className = 'ui-debug-actions';

const copyBtn = document.createElement('button');
copyBtn.className = 'ui-debug-btn';
copyBtn.textContent = 'Copy';
copyBtn.type = 'button';
copyBtn.addEventListener('click', () => this.copyLogs());

const clearBtn = document.createElement('button');
clearBtn.className = 'ui-debug-btn';
clearBtn.textContent = 'Clear';
clearBtn.type = 'button';
clearBtn.addEventListener('click', () => this.clear());

actions.appendChild(copyBtn);
actions.appendChild(clearBtn);

header.appendChild(title);
header.appendChild(actions);

// Logs view container
this.#logsContainer = document.createElement('div');
this.#logsContainer.className = 'ui-debug-logs';

this.#container.appendChild(header);
this.#container.appendChild(this.#logsContainer);

// Append debug UI after all existing body content
document.body.appendChild(this.#container);

this.#isMounted = true;


}

/**

* Formats arguments safely into lightweight human-readable strings.
  */
  #formatArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === 'object') {
  try {
  const cache = new Set();
  return JSON.stringify(arg, (key, value) => {
  if (typeof value === 'object' && value !== null) {
  if (cache.has(value)) return '[Circular]';
  cache.add(value);
  }
  return value;
  }, 2);
  } catch (e) {
  return String(arg);
  }
  }
  return String(arg);
  }

/**

* Appends a log line to the console UI.
  */
  logMessage(type, ...args) {
  if (!this.#isMounted) this.mount();


const formattedMessage = args.map(arg => this.#formatArg(arg)).join(' ');



const now = new Date();
const timeStr =
  `${String(now.getHours()).padStart(2, '0')}:` +
  `${String(now.getMinutes()).padStart(2, '0')}:` +
  `${String(now.getSeconds()).padStart(2, '0')}.` +
  `${String(now.getMilliseconds()).padStart(3, '0')}`;

// Store raw text log line for clipboard copy
this.#rawLogs.push(`[${timeStr}] [${type.toUpperCase()}] ${formattedMessage}`);

// Create log element
const row = document.createElement('div');
row.className = `ui-debug-item ${type}`;

const timeSpan = document.createElement('span');
timeSpan.className = 'ui-debug-item-time';
timeSpan.textContent = `[${timeStr}]`;

const contentSpan = document.createElement('span');
contentSpan.className = 'ui-debug-item-content';
contentSpan.textContent = formattedMessage;

row.appendChild(timeSpan);
row.appendChild(contentSpan);

this.#logsContainer.appendChild(row);

// Auto-scroll to latest log line
this.#logsContainer.scrollTop = this.#logsContainer.scrollHeight;


}

log(...args) { this.logMessage('log', ...args); }
warn(...args) { this.logMessage('warn', ...args); }
error(...args) { this.logMessage('error', ...args); }
info(...args) { this.logMessage('info', ...args); }

/**

* Overrides global console methods to automatically route logs to custom UI.
  */
  interceptConsole() {
  const self = this;
  ['log', 'warn', 'error', 'info'].forEach(method => {
  console[method] = function (...args) {
  self.#originalConsole[method].apply(console, args);
  self.logMessage(method, ...args);
  };
  });
  }

/**

* Copies log contents to system clipboard.
  */
  async copyLogs() {
  const text = this.#rawLogs.join('\n');
  if (!text) return;


try {



  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
} catch (err) {
  this.#originalConsole.error('Failed to copy logs:', err);
}


}

/**

* Clears all log entries from display and memory.
  */
  clear() {
  this.#rawLogs = [];
  if (this.#logsContainer) {
  this.#logsContainer.innerHTML = '';
  }
  }

/**

* Unmounts debug UI panel and restores original body style.
  */
  unmount() {
  if (!this.#isMounted) return;
  if (this.#container && this.#container.parentNode) {
  this.#container.parentNode.removeChild(this.#container);
  }
  this.#isMounted = false;
  }
  }

/**

* Factory helper function for shorthand initialization
  */
  export function uiDebug(options) {
  return new UIDebug(options);
  }

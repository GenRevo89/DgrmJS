import { copyAndPast } from '../diagram/group-select-applay.js';
import { copySvg, delSvg } from '../infrastructure/assets.js';
import { clickForAll, listen, classSingleAdd, evtTargetAttr } from '../infrastructure/util.js';
import { modalCreate } from './modal-create.js';
import { ShapeSmbl } from './shape-smbl.js';

console.log('[RANK-SETTINGS] Module loaded at:', new Date().toISOString());

/**
 * Show a custom confirmation modal matching Radix UI style
 * @param {string} message - The message to display
 * @param {Function|null} onConfirm - Callback when user confirms (null for alert-only)
 * @param {boolean} isAlert - If true, only show OK button (alert mode)
 */
function showModal(message, onConfirm, isAlert = false) {
  // Remove any existing modal
  const existing = document.getElementById('rank-delete-modal');
  if (existing) existing.remove();
  
  // Create modal overlay matching app style
  const overlay = document.createElement('div');
  overlay.id = 'rank-delete-modal';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(2, 8, 11, 0.7);
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    display: grid;
    place-items: center;
    animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  `;
  
  // Create modal content with Radix-style panel
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: relative;
    width: min(92vw, 420px);
    max-width: 420px;
    border-radius: 18px;
    border: 1px solid rgba(var(--accent-teal-rgb, 59, 130, 246), 0.28);
    background: rgba(6, 22, 28, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
    padding: 24px;
    animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  `;
  
  // Message text
  const text = document.createElement('div');
  text.textContent = message;
  text.style.cssText = `
    color: #f9fafb;
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 24px;
    font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
    font-weight: 400;
  `;
  modal.appendChild(text);
  
  // Buttons container
  const buttons = document.createElement('div');
  buttons.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;
  
  if (isAlert) {
    // Alert mode: only OK button
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'rt-reset rt-Button';
    okBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: var(--gray-3, #1f2937);
      color: var(--gray-12, #e5e7eb);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: background 0.15s ease;
    `;
    okBtn.onmouseover = () => okBtn.style.background = 'var(--gray-4, #374151)';
    okBtn.onmouseout = () => okBtn.style.background = 'var(--gray-3, #1f2937)';
    okBtn.onclick = () => overlay.remove();
    buttons.appendChild(okBtn);
  } else {
    // Confirmation mode: Cancel and Delete buttons
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'rt-reset rt-Button';
    cancelBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: var(--gray-3, #1f2937);
      color: var(--gray-12, #e5e7eb);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: background 0.15s ease;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.background = 'var(--gray-4, #374151)';
    cancelBtn.onmouseout = () => cancelBtn.style.background = 'var(--gray-3, #1f2937)';
    cancelBtn.onclick = () => overlay.remove();
    buttons.appendChild(cancelBtn);
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Delete';
    confirmBtn.className = 'rt-reset rt-Button';
    confirmBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: #dc2626;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: background 0.15s ease;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.background = '#b91c1c';
    confirmBtn.onmouseout = () => confirmBtn.style.background = '#dc2626';
    confirmBtn.onclick = () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    };
    buttons.appendChild(confirmBtn);
  }
  
  modal.appendChild(buttons);
  overlay.appendChild(modal);
  
  // Add keyframe animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes overlayShow {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes contentShow {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  document.body.appendChild(overlay);
}

/**
 * Specialized settings panel for fixed-size "rank" rectangles:
 * - Shows Role name input at top (visible by default)
 * - Shows color swatches and border controls inline (no tabs)
 * - Provides Copy and Delete actions (Delete is guarded for top-level if dataset flags are present)
 * - Live preview synced with style and role name changes
 *
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 * @param {number} bottomX positon of the bottom left corner of the panel
 * @param {number} bottomY positon of the bottom left corner of the panel
 */
export function rankSettingsPnlCreate(canvas, shapeElement, bottomX, bottomY) {
  const rankSettings = new RankSettings(canvas, shapeElement);
  listen(rankSettings, 'cmd', /** @param {CustomEvent<{cmd:string, arg:string}>} evt */ (evt) => {
    switch (evt.detail.cmd) {
      case 'style': {
        const arg = evt.detail.arg;
        const prefix = typeof arg === 'string' && arg.startsWith('bd-') ? 'bd-' : 'cl-';
        classSingleAdd(shapeElement, shapeElement[ShapeSmbl].data, prefix, arg);
        // Ensure CSS class-driven colors apply: remove inline fill set by chart renderer
        try {
          if (typeof arg === 'string' && arg.startsWith('cl-')) {
            const mainEl = shapeElement.querySelector('[data-key="main"]');
            mainEl?.removeAttribute('fill');
          }
        } catch {}
        break;
      }
      case 'del': {
        // Prevent deletion for Level 1/top nodes when flagged
        try {
          const ds = /** @type {any} */(shapeElement).dataset || {};
          const isTop = ds.isTop === 'true' || ds.levelIdx === '0';
          if (isTop) {
            showModal('Top leadership rank is immutable.', null, true);
            break;
          }
          
          // Check if deletion is already in progress (prevent double-triggering)
          if (shapeElement._deletionInProgress) {
            console.log('[rank-settings] Deletion already in progress, ignoring duplicate trigger');
            break;
          }
          
          // Get the rank ID and call the deletion API
          const rankId = ds.realRankId || ds.rankId;
          console.log('[rank-settings] Delete clicked, rankId:', rankId, 'dataset:', ds);
          
          if (rankId) {
            // Show custom confirmation modal
            showModal(
              'Delete this rank and unassign all its members?',
              () => {
                // Mark deletion as in progress
                shapeElement._deletionInProgress = true;
                
                console.log('[rank-settings] Calling API to delete rank:', rankId);
                // Call the API to delete the rank from the database
                fetch('/api/guild-hierarchy/ranks/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rankId }),
                  credentials: 'include',
                })
                .then(res => {
                  console.log('[rank-settings] API response status:', res.status);
                  return res.json();
                })
                .then(data => {
                  console.log('[rank-settings] API response data:', data);
                  if (data.ok) {
                    console.log('[rank-settings] Rank deleted successfully, refreshing hierarchy...');
                    // Dispatch custom event for parent to refresh data
                    const event = new CustomEvent('hierarchy:rank-deleted', { 
                      detail: { rankId },
                      bubbles: true,
                      composed: true
                    });
                    document.dispatchEvent(event);
                    shapeElement._deletionInProgress = false;
                  } else {
                    // Handle "rank not found" as success (means it was already deleted)
                    const errMsg = (data.error || '').toString().toLowerCase();
                    if (errMsg.includes('not found') || errMsg.includes('does not exist')) {
                      console.log('[rank-settings] Rank already deleted, refreshing hierarchy...');
                      // Dispatch custom event for parent to refresh data
                      const event = new CustomEvent('hierarchy:rank-deleted', { 
                        detail: { rankId },
                        bubbles: true,
                        composed: true
                      });
                      document.dispatchEvent(event);
                      shapeElement._deletionInProgress = false;
                    } else {
                      console.error('[rank-settings] API returned error:', data.error);
                      shapeElement._deletionInProgress = false;
                      showModal(data.error || 'Failed to delete rank', null, true);
                    }
                  }
                })
                .catch(err => {
                  console.error('[rank-settings] API call failed with error:', err);
                  shapeElement._deletionInProgress = false;
                  showModal('Failed to delete rank: ' + err.message, null, true);
                });
              },
              false
            );
          } else {
            console.log('[rank-settings] No rankId found, deleting placeholder node from DOM only');
            // No rank ID (placeholder node), just delete from DOM
            shapeElement[ShapeSmbl].del();
          }
        } catch {}
        break;
      }
      case 'copy': copyAndPast(canvas, [shapeElement]); break;
    }
  });
  return modalCreate(bottomX, bottomY, rankSettings);
}

class RankSettings extends HTMLElement {
  /** @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas @param {import('./shape-smbl').ShapeElement} shapeElement */
  constructor(canvas, shapeElement) {
    super();
    /** @private */ this._canvas = canvas;
    /** @private */ this._shapeElement = shapeElement;
    /** @private */ this._previewGrp = null;
  }

  connectedCallback() {
    const getLines = () => {
      try {
        const textEl = this._shapeElement.querySelector('[data-key="text"]');
        // Check for tspan elements first (proper multi-line text)
        const tspans = textEl?.querySelectorAll('tspan');
        if (tspans && tspans.length >= 2) {
          const role = (tspans[0].textContent || '').trim();
          const user = (tspans[1].textContent || '').trim();
          return { role: role || 'New Role', user: user || 'Unfilled' };
        }
        // Fallback to splitting by newline
        const txt = textEl?.textContent || '';
        const parts = (txt || '').split('\n').map(s => s.trim());
        const role = parts[0] || 'New Role';
        const user = parts[1] || 'Unfilled';
        return { role, user };
      } catch { return { role: 'New Role', user: 'Unfilled' }; }
    };
    const { role, user } = getLines();

    // Check if this is a leadership rank (top-level, immutable)
    const ds = /** @type {any} */(this._shapeElement).dataset || {};
    const isLeadership = ds.isTop === 'true' || ds.levelIdx === '0';

    const shadow = this.attachShadow({ mode: 'closed' });
    shadow.innerHTML =
    `<style>
      .ln { display: flex; gap: 4px; }
      .ln > * { height: 24px; padding: 10px; cursor: pointer; }
      #preview svg { display: block; }
      #pnl { 
        color: var(--gray-12, #e5e7eb); 
        max-width: 280px;
        box-sizing: border-box;
      }
      label { display: block; font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
      #role {
        max-width: 100%;
        overflow: hidden;
      }
      input[type="text"] {
        width: 100%;
        max-width: 100%;
        border: 1px solid var(--gray-6, #374151);
        border-radius: 8px;
        padding: 8px 10px;
        background: var(--gray-2, #111827);
        color: var(--gray-12, #e5e7eb);
        outline: none;
        box-sizing: border-box;
      }
      .crcl { width: 25px; height: 25px; border-radius: 50%; }
      .actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; padding-top: 8px; }
    </style>
    <div id="pnl">
      <div id="preview" style="padding: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.08); border-radius: 10px;"></div>
      <div id="role">
        <label>Role name</label>
        <input id="roleName" type="text" value="${role}">
      </div>
      <div id="clr" style="margin-top: 8px;">
        <div class="ln">
          <div data-cmd="style" data-cmd-arg="cl-red"><div class="crcl" style="background: #E74C3C"></div></div>
          <div data-cmd="style" data-cmd-arg="cl-orange"><div class="crcl" style="background: #ff6600"></div></div>
          <div data-cmd="style" data-cmd-arg="cl-green"><div class="crcl" style="background: #19bc9b"></div></div>
        </div>
        <div class="ln">
          <div data-cmd="style" data-cmd-arg="cl-blue"><div class="crcl" style="background: #1aaee5"></div></div>
          <div data-cmd="style" data-cmd-arg="cl-dblue"><div class="crcl" style="background: #1D809F"></div></div>
          <div data-cmd="style" data-cmd-arg="cl-dgray"><div class="crcl" style="background: #495057"></div></div>
        </div>
      </div>
      <div id="border" style="margin-top: 8px;">
        <div class="ln">
          <div data-cmd="style" data-cmd-arg="bd-0" title="No border">
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="0"/></svg>
          </div>
          <div data-cmd="style" data-cmd-arg="bd-1" title="Thin border">
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="1.5"/></svg>
          </div>
          <div data-cmd="style" data-cmd-arg="bd-2" title="Medium border">
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="2.5"/></svg>
          </div>
          <div data-cmd="style" data-cmd-arg="bd-3" title="Thick border">
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="3.5"/></svg>
          </div>
          <div data-cmd="style" data-cmd-arg="bd-dash" title="Dashed border">
            <svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="2" style="stroke-dasharray: 5,4"/></svg>
          </div>
        </div>
      </div>
      <div class="actions">
        <div data-cmd="copy">${copySvg}</div>
        ${isLeadership ? '' : `<div data-cmd="del">${delSvg}</div>`}
      </div>
    </div>`;

    // Build preview (fixed 220x88 rectangle with current role/user lines)
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '-120 -60 240 120');
      svg.setAttribute('width', '240');
      svg.setAttribute('height', '90');

      // Add styles for preview elements
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `
        text {
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          fill: #e5e7eb;
        }
        .micro-lvl {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          fill: rgba(59, 130, 246, 0.92);
          opacity: 0.95;
        }
        .micro-meta {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.01em;
          fill: rgba(229, 231, 235, 0.85);
          opacity: 0.95;
        }
      `;
      svg.appendChild(style);

      const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      grp.setAttribute('class', this._shapeElement.getAttribute('class') || '');

      // Main rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-110'); rect.setAttribute('y', '-44');
      rect.setAttribute('width', '220'); rect.setAttribute('height', '88');
      rect.setAttribute('rx', '15'); rect.setAttribute('ry', '15');
      rect.setAttribute('data-key', 'main');
      
      // Get computed styles from source shape
      try {
        const mainSrc = this._shapeElement.querySelector('[data-key="main"]');
        if (mainSrc) {
          const computed = window.getComputedStyle(mainSrc);
          rect.setAttribute('fill', computed.fill || '#1aaee5');
          rect.setAttribute('stroke', computed.stroke || '#ffffff');
          rect.setAttribute('stroke-width', computed.strokeWidth || '2');
        } else {
          rect.setAttribute('fill', '#1aaee5');
          rect.setAttribute('stroke', '#ffffff');
          rect.setAttribute('stroke-width', '2');
        }
      } catch {
        rect.setAttribute('fill', '#1aaee5');
        rect.setAttribute('stroke', '#ffffff');
        rect.setAttribute('stroke', '2');
      }
      grp.appendChild(rect);

      // Two-line text with tspan elements for proper line breaks
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', '-96');
      textEl.setAttribute('text-anchor', 'start');
      textEl.setAttribute('data-key', 'text');
      
      const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan1.setAttribute('x', '-96');
      tspan1.setAttribute('y', '-8');
      tspan1.textContent = role;
      textEl.appendChild(tspan1);
      
      const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan2.setAttribute('x', '-96');
      tspan2.setAttribute('y', '12');
      tspan2.textContent = user;
      textEl.appendChild(tspan2);
      
      grp.appendChild(textEl);

      // Avatar in top-right (clone from source or placeholder)
      const imgX = 110 - 46;
      const imgY = -44 + 8;
      const clipId = `preview-clip-${Math.random().toString(36).substr(2, 9)}`;
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipId);
      const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      clipCircle.setAttribute('cx', String(imgX + 20));
      clipCircle.setAttribute('cy', String(imgY + 20));
      clipCircle.setAttribute('r', '20');
      clipPath.appendChild(clipCircle);
      defs.appendChild(clipPath);
      grp.appendChild(defs);

      const srcAvatar = this._shapeElement.querySelector('.avatar, image[href]');
      if (srcAvatar && srcAvatar.tagName.toLowerCase() === 'image') {
        /** @type {SVGImageElement} */
        const avatarClone = /** @type {SVGImageElement} */(srcAvatar.cloneNode(true));
        avatarClone.setAttribute('clip-path', `url(#${clipId})`);
        avatarClone.setAttribute('x', String(imgX));
        avatarClone.setAttribute('y', String(imgY));
        avatarClone.setAttribute('width', '40');
        avatarClone.setAttribute('height', '40');
        grp.appendChild(avatarClone);
      } else {
        // Fallback circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(imgX + 20));
        circle.setAttribute('cy', String(imgY + 20));
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', 'rgba(92, 46, 54, 0.85)');
        circle.setAttribute('stroke', 'rgba(92, 46, 54, 0.95)');
        circle.setAttribute('stroke-width', '1.5');
        grp.appendChild(circle);
        
        const fallbackLetter = user.trim().charAt(0).toUpperCase();
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', String(imgX + 20));
        t.setAttribute('y', String(imgY + 20));
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('font-size', '20');
        t.setAttribute('font-weight', '700');
        t.setAttribute('fill', 'rgba(245, 247, 250, 0.98)');
        t.textContent = fallbackLetter;
        grp.appendChild(t);
      }

      // Avatar ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', String(imgX + 20));
      ring.setAttribute('cy', String(imgY + 20));
      ring.setAttribute('r', '21');
      ring.setAttribute('fill', 'transparent');
      ring.setAttribute('stroke', 'rgba(59, 130, 246, 0.9)');
      ring.setAttribute('stroke-width', '2');
      grp.appendChild(ring);

      // Level indicator (top-left corner)
      const srcLvl = this._shapeElement.querySelector('.micro-lvl');
      if (srcLvl) {
        const lvlClone = srcLvl.cloneNode(true);
        grp.appendChild(lvlClone);
      } else {
        const micro = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        micro.setAttribute('x', String(-110 + 8));
        micro.setAttribute('y', String(-44 + 12));
        micro.setAttribute('class', 'micro-lvl');
        micro.textContent = 'Lvl 1';
        grp.appendChild(micro);
      }

      // Metadata line (bottom-left)
      const srcMeta = this._shapeElement.querySelector('.micro-meta');
      if (srcMeta) {
        const metaClone = srcMeta.cloneNode(true);
        grp.appendChild(metaClone);
      } else {
        const meta = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        meta.setAttribute('x', String(-110 + 8));
        meta.setAttribute('y', String(44 - 8));
        meta.setAttribute('class', 'micro-meta');
        meta.textContent = 'Preview';
        grp.appendChild(meta);
      }

      svg.appendChild(grp);
      shadow.getElementById('preview')?.appendChild(svg);
      this._previewGrp = grp;
    } catch (err) {
      console.error('[rank-settings] Preview creation error:', err);
    }

    // Sync preview with style changes
    this.addEventListener('cmd', /** @param {CustomEvent<{cmd:string, arg:string}>} ev */ (ev) => {
      try {
        const d = ev.detail;
        if (!d || d.cmd !== 'style') return;
        const arg = d.arg;
        if (!this._previewGrp) return;
        const mainPrev = this._previewGrp.querySelector('[data-key="main"]');
        if (!mainPrev) return;

        // map color classes -> fill/stroke on preview
        if (typeof arg === 'string' && arg.startsWith('cl-')) {
          const colorMap = {
            'cl-red': '#E74C3C',
            'cl-orange': '#ff6600',
            'cl-green': '#19bc9b',
            'cl-blue': '#1aaee5',
            'cl-dblue': '#1D809F',
            'cl-dgray': '#495057'
          };
          const fill = colorMap[arg];
          if (fill) {
            mainPrev.setAttribute('fill', fill);
            if (!mainPrev.getAttribute('stroke')) {
              mainPrev.setAttribute('stroke', 'rgba(0,0,0,0.2)');
            }
          }
        }
        // border classes adjust stroke-width/dash
        if (typeof arg === 'string' && arg.startsWith('bd-')) {
          switch (arg) {
            case 'bd-0': mainPrev.setAttribute('stroke-width', '0'); mainPrev.removeAttribute('stroke-dasharray'); break;
            case 'bd-1': mainPrev.setAttribute('stroke-width', '1'); mainPrev.removeAttribute('stroke-dasharray'); break;
            case 'bd-2': mainPrev.setAttribute('stroke-width', '2'); mainPrev.removeAttribute('stroke-dasharray'); break;
            case 'bd-3': mainPrev.setAttribute('stroke-width', '3.5'); mainPrev.removeAttribute('stroke-dasharray'); break;
            case 'bd-dash': mainPrev.setAttribute('stroke-dasharray', '5'); break;
          }
        }
      } catch {}
    });

    // Commands: colors, borders, copy, delete
    clickForAll(shadow, '[data-cmd]', (evt) => {
      this.dispatchEvent(new CustomEvent('cmd', {
        detail: {
          cmd: evtTargetAttr(evt, 'data-cmd'),
          arg: evtTargetAttr(evt, 'data-cmd-arg')
        }
      }));
    });

    // Role name inline input -> update shape text and preview
    const roleInput = shadow.getElementById('roleName');
    roleInput?.addEventListener('input', () => {
      try {
        const nextRole = /** @type {HTMLInputElement} */(roleInput).value || '';
        const textSrc = this._shapeElement.querySelector('[data-key="text"]');
        const current = textSrc?.textContent || '';
        const second = (current || '').split('\n')[1] || user;
        const merged = `${nextRole}\n${second}`;

        if (textSrc) { textSrc.textContent = merged; }
        // Update shape data title (keeps inline textarea in sync). Rank nodes are fixed-size, so no auto-resize needed.
        try {
          const dataAny = /** @type {any} */ (this._shapeElement[ShapeSmbl].data);
          dataAny.title = merged;
        } catch {}

        // Update preview tspan elements individually for proper line breaks
        const prevText = this._previewGrp?.querySelector('[data-key="text"]');
        if (prevText) {
          const prevTspans = prevText.querySelectorAll('tspan');
          if (prevTspans.length >= 2) {
            prevTspans[0].textContent = nextRole;
            prevTspans[1].textContent = second;
          } else {
            prevText.textContent = merged;
          }
        }
      } catch {}
    });
  }
}
customElements.define('ap-rank-settings', RankSettings);

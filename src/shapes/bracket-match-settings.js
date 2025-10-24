import { clickForAll, evtTargetAttr } from '../infrastructure/util.js';
import { modalCreate } from './modal-create.js';

/**
 * Settings panel for bracket-match shapes
 * - Shows tournament state info
 * - Triggers entry modal during registration
 * - Shows pre-launch/in-progress messages
 *
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 * @param {number} bottomX position of the bottom left corner of the panel
 * @param {number} bottomY position of the bottom left corner of the panel
 */
export function bracketMatchSettingsPnlCreate(canvas, shapeElement, bottomX, bottomY) {
  const bracketMatchSettings = new BracketMatchSettings(canvas, shapeElement);
  return modalCreate(bottomX, bottomY, bracketMatchSettings);
}

class BracketMatchSettings extends HTMLElement {
  /** @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas @param {import('./shape-smbl').ShapeElement} shapeElement */
  constructor(canvas, shapeElement) {
    super();
    /** @private */ this._canvas = canvas;
    /** @private */ this._shapeElement = shapeElement;
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'closed' });
    
    // Extract tournament state from shape data
    // @ts-ignore - ShapeSmbl is a Symbol property added dynamically
    const shapeData = this._shapeElement.ShapeSmbl?.data || {};
    const isPreLaunch = shapeData.isPreLaunch || false;
    const isRegistration = shapeData.isRegistration || false;
    const isActiveRound = shapeData.isActiveRound || false;
    const playerName = shapeData.playerName || 'Empty Slot';
    const round = shapeData.round || 1;
    const onEnterClick = shapeData.onEnterClick;

    // Determine message based on tournament state
    let content = '';
    
    if (isPreLaunch) {
      content = `
        <div class="info-box pre-launch">
          <div class="icon">📅</div>
          <div class="label">Pre-Launch</div>
          <div class="message">Tournament has not started yet. Check back on October 24, 2025 at 12:00 PM PST to enter!</div>
        </div>
      `;
    } else if (isRegistration && playerName === 'Empty Slot') {
      content = `
        <div class="info-box registration">
          <div class="icon">🎵</div>
          <div class="label">Registration Open</div>
          <div class="message">This slot is available! Click the button below to submit your Suno track and enter the tournament.</div>
          <button id="enter-btn" class="enter-button">Enter Tournament</button>
        </div>
      `;
    } else if (isRegistration && playerName !== 'Empty Slot') {
      content = `
        <div class="info-box filled">
          <div class="icon">✓</div>
          <div class="label">Slot Filled</div>
          <div class="message"><strong>${playerName}</strong> has claimed this slot. Find another empty slot to enter!</div>
        </div>
      `;
    } else if (isActiveRound) {
      content = `
        <div class="info-box active">
          <div class="icon">🔥</div>
          <div class="label">Round ${round} - In Progress</div>
          <div class="message">This match is currently active. Voting is live!</div>
        </div>
      `;
    } else {
      content = `
        <div class="info-box waiting">
          <div class="icon">⏳</div>
          <div class="label">Awaiting Match</div>
          <div class="message">This match will begin in a future round.</div>
        </div>
      `;
    }

    shadow.innerHTML = `
      <style>
        #pnl { 
          color: var(--gray-12, #e5e7eb); 
          max-width: 320px;
          box-sizing: border-box;
          padding: 16px;
        }
        
        .info-box {
          background: rgba(15, 35, 50, 0.8);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .info-box.pre-launch { border-color: rgba(168, 85, 247, 0.4); }
        .info-box.registration { border-color: rgba(34, 197, 94, 0.4); }
        .info-box.filled { border-color: rgba(59, 130, 246, 0.4); }
        .info-box.active { border-color: rgba(249, 115, 22, 0.4); }
        .info-box.waiting { border-color: rgba(156, 163, 175, 0.3); }
        
        .icon {
          font-size: 32px;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .label { 
          font-size: 14px; 
          font-weight: 600;
          text-align: center;
          margin-bottom: 8px;
          color: #fff;
        }
        
        .message {
          font-size: 13px;
          line-height: 1.5;
          opacity: 0.9;
          text-align: center;
        }
        
        .enter-button {
          width: 100%;
          margin-top: 12px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .enter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .enter-button:active {
          transform: translateY(0);
        }
      </style>
      <div id="pnl">
        ${content}
      </div>`;
    
    // Attach event listener for enter button if present
    if (isRegistration && playerName === 'Empty Slot' && onEnterClick) {
      const enterBtn = shadow.getElementById('enter-btn');
      if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onEnterClick();
        });
      }
    }
  }
}
customElements.define('ap-bracket-match-settings', BracketMatchSettings);

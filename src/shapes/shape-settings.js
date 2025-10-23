import { copyAndPast } from '../diagram/group-select-applay.js';
import { copySvg, delSvg } from '../infrastructure/assets.js';
import { clickForAll, listen, classSingleAdd, evtTargetAttr } from '../infrastructure/util.js';
import { modalChangeTop, modalCreate } from './modal-create.js';
import { ShapeSmbl } from './shape-smbl.js';

/**
 * @param {import('../infrastructure/canvas-smbl').CanvasElement} canvas
 * @param {import('./shape-smbl').ShapeElement} shapeElement
 * @param {number} bottomX positon of the bottom left corner of the panel
 * @param {number} bottomY positon of the bottom left corner of the panel
 */
export function settingsPnlCreate(canvas, shapeElement, bottomX, bottomY) {
	const shapeSettings = new ShapeEdit(canvas, shapeElement);
	listen(shapeSettings, 'cmd', /** @param {CustomEvent<{cmd:string, arg:string}>} evt */ evt => {
		switch (evt.detail.cmd) {
			case 'style': {
				const arg = evt.detail.arg;
				const prefix = typeof arg === 'string' && arg.startsWith('bd-') ? 'bd-' : 'cl-';
				classSingleAdd(shapeElement, shapeElement[ShapeSmbl].data, prefix, arg);
				break;
			}
			case 'del': {
				// Check if this is a leadership/Level 1 rank - prevent deletion
				// Read from dataset attributes set by DgrmNetGuildChart
				const isLeadership = shapeElement.dataset?.levelIdx === "0" || shapeElement.dataset?.isTop === "true";
				if (isLeadership) {
					alert('Leadership rank elements cannot be deleted.');
					return;
				}
				shapeElement[ShapeSmbl].del();
				break;
			}
			case 'copy': copyAndPast(canvas, [shapeElement]); break;
		}
	});
	return modalCreate(bottomX, bottomY, shapeSettings);
}

class ShapeEdit extends HTMLElement {
	/** @param {import('../infrastructure/canvas-smbl.js').CanvasElement} canvas @param {import('./shape-smbl').ShapeElement} shapeElement */
	constructor(canvas, shapeElement) {
		super();
		/** @private */ this._canvas = canvas;
		/** @private */ this._shapeElement = shapeElement;
		/** @private */ this._previewGrp = null;
	}
	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'closed' });
		
		// Check if this is a leadership rank to hide delete button
		// Read from dataset attributes set by DgrmNetGuildChart
		const isLeadership = this._shapeElement.dataset?.levelIdx === "0" || this._shapeElement.dataset?.isTop === "true";
		
		shadow.innerHTML =
		`<style>
			.ln { display: flex; }
			.ln > * {
				height: 24px;
				padding: 10px;
				cursor: pointer;
			}
			#prop { padding-bottom: 10px; }

			.crcl { width: 25px; height: 25px; border-radius: 50%; }
			/* show editing options directly in modal, hide tab toggles */
			[data-toggle] { display: none; }
			#preview svg { display: block; }
			
			#text-input {
				width: 100%;
				padding: 8px;
				margin-bottom: 8px;
				border: 1px solid rgba(100, 150, 200, 0.4);
				border-radius: 6px;
				background: rgba(17, 24, 39, 0.85);
				color: #e5e7eb;
				font-family: inherit;
				font-size: 14px;
				font-weight: 600;
				box-sizing: border-box;
			}
			#text-input:focus {
				outline: none;
				border-color: rgba(100, 150, 200, 0.8);
			}
			#preview {
				background: rgba(50, 50, 50, 0.95) !important;
				border: 1px solid rgba(255, 255, 255, 0.1);
				min-height: 100px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		</style>
		<div id="pnl">
			<input type="text" id="text-input" placeholder="Enter text..." />
			<div id="preview" style="padding: 8px; margin-bottom: 8px; border-radius: 10px;"></div>
			<div id="clr" style="display: unset;">
				<div class="ln">
					<div data-cmd="style" data-cmd-arg="cl-red">
						<div class="crcl" style="background: #E74C3C"></div>
					</div>
					<div data-cmd="style" data-cmd-arg="cl-orange">
						<div class="crcl" style="background: #ff6600"></div>
					</div>
					<div data-cmd="style" data-cmd-arg="cl-green">
						<div class="crcl" style="background: #19bc9b"></div>
					</div>
				</div>
				<div class="ln">
					<div data-cmd="style" data-cmd-arg="cl-blue">
						<div class="crcl" style="background: #1aaee5"></div>
					</div>
					<div data-cmd="style" data-cmd-arg="cl-dblue">
						<div class="crcl" style="background: #1D809F"></div>
					</div>
					<div data-cmd="style" data-cmd-arg="cl-dgray">
						<div class="crcl" style="background: #495057"></div>
					</div>
				</div>
			</div>
			<div id="border" style="display: unset;">
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
			<div id="prop" style="display: none;"><slot id="slot"></slot></div>
		</div>
		<div class="ln">
			<svg data-toggle="clr" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M19.228 18.732l1.768-1.768 1.767 1.768a2.5 2.5 0 1 1-3.535 0zM8.878 1.08l11.314 11.313a1 1 0 0 1 0 1.415l-8.485 8.485a1 1 0 0 1 0-1.415l7.778-7.778-2.122-2.121L8.88 1.08zM11 6.03L3.929 13.1 11 20.173l7.071-7.071L11 6.029z" fill="rgb(52,71,103)"/></svg>
			<svg data-toggle="border" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><rect x="4" y="6" width="16" height="12" fill="none" stroke="rgb(52,71,103)" stroke-width="2"></rect></svg>
			<svg data-toggle="prop"  ${this.getAttribute('edit-btn') ? '' : 'style="display: none;"'} viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12.9 6.858l4.242 4.243L7.242 21H3v-4.243l9.9-9.9zm1.414-1.414l2.121-2.122a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414l-2.122 2.121-4.242-4.242z" fill="rgb(52,71,103)"/></svg>
			${copySvg}
			${isLeadership ? '' : delSvg}
		</div>`;

		// minimal path settings mode: hide preview/color/border when attribute present
		const isMinimal = this.hasAttribute('minimal');
		if (isMinimal) {
			const p = shadow.getElementById('preview'); if (p) p.style.display = 'none';
			const clr = shadow.getElementById('clr'); if (clr) clr.style.display = 'none';
			const border = shadow.getElementById('border'); if (border) border.style.display = 'none';
			const prop = shadow.getElementById('prop'); if (prop) prop.style.display = 'unset';
		}
		// preview
		const previewHost = shadow.getElementById('preview');
		if (!isMinimal && previewHost) {
			try {
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.setAttribute('viewBox', '-120 -60 240 120');
			svg.setAttribute('width', '240');
			svg.setAttribute('height', '90');

			// Add styles for rank preview elements
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
			const elemClasses = this._shapeElement.getAttribute('class') || '';
			grp.setAttribute('class', elemClasses);
			console.log('[ShapeEdit] Element classes:', elemClasses, '| Contains rank?', elemClasses.includes('rank'));

			const mainSrc = this._shapeElement.querySelector('[data-key="main"]');
			if (mainSrc && mainSrc.tagName.toLowerCase() === 'rect') {
			const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rect.setAttribute('x', '-110'); rect.setAttribute('y', '-44');
			rect.setAttribute('width', '220'); rect.setAttribute('height', '88');
			rect.setAttribute('rx', '15'); rect.setAttribute('ry', '15');
			rect.setAttribute('data-key', 'main'); grp.appendChild(rect);
			// copy main fill/stroke attributes from source
			try {
				const copyAttrs = (src, dest) => {
					['fill','stroke','stroke-width','stroke-dasharray'].forEach(k => {
						const v = src?.getAttribute?.(k);
						if (v != null) dest.setAttribute(k, v);
					});
				};
				copyAttrs(mainSrc, rect);
				// If no explicit fill, use computed style
				if (!rect.getAttribute('fill')) {
					const computedFill = window.getComputedStyle(mainSrc).fill;
					if (computedFill && computedFill !== 'none') {
						rect.setAttribute('fill', computedFill);
					}
				}
				// If no explicit stroke, use computed style
				if (!rect.getAttribute('stroke')) {
					const computedStroke = window.getComputedStyle(mainSrc).stroke;
					if (computedStroke && computedStroke !== 'none') {
						rect.setAttribute('stroke', computedStroke);
					}
				}
			} catch {}
			} else {
				const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				circle.setAttribute('cx', '0'); circle.setAttribute('cy', '0'); circle.setAttribute('r', '48');
				circle.setAttribute('data-key', 'main'); grp.appendChild(circle);
				// copy main fill/stroke attributes from source
				try {
					const copyAttrs = (src, dest) => {
						['fill','stroke','stroke-width'].forEach(k => {
							const v = src?.getAttribute?.(k);
							if (v != null) dest.setAttribute(k, v);
						});
					};
					copyAttrs(mainSrc, circle);
				} catch {}
			}

			const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			textEl.setAttribute('x', '-96'); textEl.setAttribute('y', '-8');
			textEl.setAttribute('data-key', 'text');
			const srcText = this._shapeElement.querySelector('[data-key="text"]');
			
			// For rank shapes, use tspan for proper line breaks
			const isRankPreview = grp.classList.contains('rank') || elemClasses.includes('rank');
			console.log('[ShapeEdit] Is rank preview?', isRankPreview, '| grp.classList:', grp.classList.toString());
			if (isRankPreview) {
				// Try to get lines from tspan elements first
				const srcTspans = srcText?.querySelectorAll('tspan');
				let lines = [];
				if (srcTspans && srcTspans.length >= 2) {
					// Extract text from each tspan
					lines = Array.from(srcTspans).map(ts => ts.textContent || '');
				} else {
					// Fallback to splitting by newline
					const fullText = srcText?.textContent || 'New Role\nUnfilled';
					lines = fullText.split(/\r?\n/);
				}
				
				lines.forEach((line, idx) => {
					const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
					tspan.setAttribute('x', '-96');
					// Set explicit y positions for each line
					if (idx === 0) {
						tspan.setAttribute('y', '-8');
					} else {
						tspan.setAttribute('y', '12'); // 20px below first line (14px font + 6px gap)
					}
					tspan.textContent = line;
					textEl.appendChild(tspan);
				});
			} else {
				const fullText = srcText?.textContent || '';
				textEl.textContent = fullText;
			}
			grp.appendChild(textEl);

			// For rank shapes, add avatar, level indicator, and metadata to preview
			if (isRankPreview) {
				// Create circular clip-path for avatar (top-right corner)
				const clipId = `preview-clip-${Math.random().toString(36).substr(2, 9)}`;
				const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
				const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
				clipPath.setAttribute('id', clipId);
				const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				clipCircle.setAttribute('cx', '80');
				clipCircle.setAttribute('cy', '-14');
				clipCircle.setAttribute('r', '20');
				clipPath.appendChild(clipCircle);
				defs.appendChild(clipPath);
				grp.appendChild(defs);

				// Copy avatar from source if present
				const srcAvatar = this._shapeElement.querySelector('.avatar, image[href]');
				if (srcAvatar && srcAvatar.tagName.toLowerCase() === 'image') {
					/** @type {SVGImageElement} */
					const avatarClone = /** @type {SVGImageElement} */(srcAvatar.cloneNode(true));
					avatarClone.setAttribute('clip-path', `url(#${clipId})`);
					avatarClone.setAttribute('x', '60');
					avatarClone.setAttribute('y', '-34');
					avatarClone.setAttribute('width', '40');
					avatarClone.setAttribute('height', '40');
					grp.appendChild(avatarClone);
				} else {
					// Fallback avatar circle
					const avatarCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
					avatarCircle.setAttribute('cx', '80'); avatarCircle.setAttribute('cy', '-14');
					avatarCircle.setAttribute('r', '20');
					avatarCircle.setAttribute('fill', 'rgba(92, 46, 54, 0.85)');
					avatarCircle.setAttribute('stroke', 'rgba(92, 46, 54, 0.95)');
					avatarCircle.setAttribute('stroke-width', '1.5');
					grp.appendChild(avatarCircle);
				}
				// Avatar ring
				const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				ring.setAttribute('cx', '80'); ring.setAttribute('cy', '-14');
				ring.setAttribute('r', '21');
				ring.setAttribute('fill', 'transparent');
				ring.setAttribute('stroke', 'rgba(59, 130, 246, 0.9)');
				ring.setAttribute('stroke-width', '2');
				grp.appendChild(ring);

				// Level indicator
				const srcLvl = this._shapeElement.querySelector('.micro-lvl');
				if (srcLvl) {
					const lvlClone = srcLvl.cloneNode(true);
					grp.appendChild(lvlClone);
				}

				// Metadata line
				const srcMeta = this._shapeElement.querySelector('.micro-meta');
				if (srcMeta) {
					const metaClone = srcMeta.cloneNode(true);
					grp.appendChild(metaClone);
				}
			}

			svg.appendChild(grp);
			previewHost.appendChild(svg);
			this._previewGrp = grp;
		} catch (err) { 
			console.error('[ShapeEdit] Preview creation error:', err);
		} }

		// sync preview with style changes
		/** @param {CustomEvent<{cmd:string, arg:string}>} ev */
		const onCmd = (ev) => {
			try {
				const d = /** @type {{cmd:string,arg:string}} */(ev.detail);
				if (!d || d.cmd !== 'style') { return; }
				const arg = d.arg;
				if (!this._previewGrp) { return; }
				// map color classes to inline fill/stroke on preview
				const colorMap = {
					'cl-red': '#E74C3C',
					'cl-orange': '#ff6600',
					'cl-green': '#19bc9b',
					'cl-blue': '#1aaee5',
					'cl-dblue': '#1D809F',
					'cl-dgray': '#495057'
				};
				const mainPrev = this._previewGrp.querySelector('[data-key="main"]');
				if (typeof arg === 'string' && arg.startsWith('cl-') && mainPrev) {
					const fill = colorMap[arg];
					if (fill) {
						// text-only shapes use text color; regular shapes use main fill
						if (this._previewGrp.classList.contains('shtxt')) {
							const textPrev = this._previewGrp.querySelector('[data-key="text"]');
							if (textPrev) { textPrev.setAttribute('fill', fill); }
							mainPrev.setAttribute('fill', 'transparent');
							mainPrev.setAttribute('stroke', 'transparent');
						} else {
							mainPrev.setAttribute('fill', fill);
							if (!mainPrev.getAttribute('stroke')) {
								mainPrev.setAttribute('stroke', 'rgba(0,0,0,0.2)');
							}
						}
					}
				}
				// border classes adjust stroke-width/dash
				if (typeof arg === 'string' && arg.startsWith('bd-') && mainPrev) {
					switch (arg) {
						case 'bd-0': mainPrev.setAttribute('stroke-width', '0'); mainPrev.removeAttribute('stroke-dasharray'); break;
						case 'bd-1': mainPrev.setAttribute('stroke-width', '1'); mainPrev.removeAttribute('stroke-dasharray'); break;
						case 'bd-2': mainPrev.setAttribute('stroke-width', '2'); mainPrev.removeAttribute('stroke-dasharray'); break;
						case 'bd-3': mainPrev.setAttribute('stroke-width', '3.5'); mainPrev.removeAttribute('stroke-dasharray'); break;
						case 'bd-dash': mainPrev.setAttribute('stroke-dasharray', '5'); break;
					}
				}
			} catch {}
		};
		this.addEventListener('cmd', onCmd);

		// text input handler
		const textInput = shadow.getElementById('text-input');
		if (textInput && textInput instanceof HTMLInputElement && this._shapeElement && typeof this._shapeElement.querySelector === 'function') {
			// Check if this is a rank shape (has two lines: role name + username)
			const isRank = (this._shapeElement.getAttribute('class') || '').includes('rank');
			
			// Initialize with current text
			let storedUsername = 'Unfilled';
			try {
				const srcText = this._shapeElement.querySelector('[data-key="text"]');
				if (srcText) {
					const fullText = srcText.textContent || '';
					if (isRank) {
						// For rank shapes, split by newline OR look for tspan elements
						const tspans = srcText.querySelectorAll('tspan');
						if (tspans.length >= 2) {
							// Multi-line text using tspan elements
							textInput.value = tspans[0].textContent || '';
							storedUsername = tspans[1].textContent || 'Unfilled';
						} else {
							// Try splitting by newline
							const lines = fullText.split(/\r?\n/);
							if (lines.length >= 2) {
								textInput.value = lines[0] || '';
								storedUsername = lines[1] || 'Unfilled';
							} else {
								// Fallback: just use the whole text as rank name
								textInput.value = fullText;
							}
						}
						textInput.placeholder = 'Enter rank name...';
					} else {
						textInput.value = fullText;
					}
				}
			} catch {}
			
			// Update shape text on input
			textInput.addEventListener('input', (e) => {
				if (!(e.target instanceof HTMLInputElement)) return;
				if (!this._shapeElement || typeof this._shapeElement.querySelector !== 'function') return;
				const newText = e.target.value || '';
				try {
					const textEl = this._shapeElement.querySelector('[data-key="text"]');
					if (textEl) {
						let finalText = newText;
						if (isRank) {
							// For rank shapes, preserve the second line (username)
							// Try to get username from tspans first
							const tspans = textEl.querySelectorAll('tspan');
							let username = storedUsername;
							if (tspans.length >= 2) {
								username = tspans[1].textContent || storedUsername;
							} else {
								const currentLines = (textEl.textContent || '').split(/\r?\n/);
								if (currentLines.length >= 2) {
									username = currentLines[1];
								}
							}
							finalText = newText + '\n' + username;
						}
						textEl.textContent = finalText;
						// Update data
						const shapeData = this._shapeElement[ShapeSmbl]?.data;
						if (shapeData && typeof shapeData === 'object') {
							shapeData['title'] = finalText;
						}
					}
				} catch {}
				// Update preview text
				if (this._previewGrp) {
					const previewText = this._previewGrp.querySelector('[data-key="text"]');
					if (previewText) {
						if (isRank) {
							// For rank preview, get username from current preview
							const currentTspans = previewText.querySelectorAll('tspan');
							const username = currentTspans.length >= 2 ? (currentTspans[1].textContent || storedUsername) : storedUsername;
							
							// Clear and rebuild with tspan elements using explicit y positions
							previewText.innerHTML = '';
							const lines = [newText, username];
							lines.forEach((line, idx) => {
								const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
								tspan.setAttribute('x', '-96');
								// Use explicit y positions for proper line breaks
								if (idx === 0) {
									tspan.setAttribute('y', '-8');
								} else {
									tspan.setAttribute('y', '12');
								}
								tspan.textContent = line;
								previewText.appendChild(tspan);
							});
						} else {
							previewText.textContent = newText;
						}
					}
				}
			});
		}

		//
		// tabs

		{
			const pnl = shadow.getElementById('pnl');

			/** @param {1|-1} coef */
			function modalSetTop(coef) {
				modalChangeTop(window.scrollY + coef * pnl.getBoundingClientRect().height); // window.scrollY fix IPhone keyboard
			}

			/** @type {HTMLElement} */
			let currentTab;

			clickForAll(shadow, '[data-toggle]', evt => {
				if (currentTab) {
					modalSetTop(1);
					display(currentTab, false);
				}

				const tab = shadow.getElementById(evtTargetAttr(evt, 'data-toggle'));
				if (currentTab !== tab) {
					display(tab, true);
					modalSetTop(-1);
					currentTab = tab;
				} else {
					currentTab = null;
				}
			});
		}

		//
		// commands

		clickForAll(shadow, '[data-cmd]', evt => {
			this.dispatchEvent(new CustomEvent('cmd', {
				detail: {
					cmd: evtTargetAttr(evt, 'data-cmd'),
					arg: evtTargetAttr(evt, 'data-cmd-arg')
				}
			}));
		});
	}
}
customElements.define('ap-shape-edit', ShapeEdit);

/** @param {ElementCSSInlineStyle} el, @param {boolean} isDisp */
function display(el, isDisp) { el.style.display = isDisp ? 'unset' : 'none'; }

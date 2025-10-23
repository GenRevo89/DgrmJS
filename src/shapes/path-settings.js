import { copyAndPast } from '../diagram/group-select-applay.js';
import { classAdd, classDel, clickForAll, listen, classSingleAdd, evtTargetAttr } from '../infrastructure/util.js';
import { PathSmbl } from './path-smbl.js';

export class PathSettings extends HTMLElement {
	/**
 	 * @param {CanvasElement} canvas
	 * @param {PathElement} pathElement
	 */
	constructor(canvas, pathElement) {
		super();
		/** @private */
		this._pathElement = pathElement;

		/** @private */
		this._canvas = canvas;
	}

	connectedCallback() {
		const pathStyles = this._pathElement[PathSmbl].data.styles;
		const actStyle = style => this._pathElement[PathSmbl].data.styles?.includes(style) ? 'class="actv"' : '';

		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.innerHTML = `
		<style>
			:host { display: block; color: #e5e7eb; }
			.ln { display: flex; gap: 4px; }
			.ln > * {
				height: 24px;
				padding: 10px;
				fill-opacity: 0.3;
				stroke-opacity: 0.3;
			}
			[data-cmd] { cursor: pointer; }
			.actv { 
				fill-opacity: 1;
				stroke-opacity: 1;
			}
			.crcl { width: 25px; height: 25px; border-radius: 50%; }
			.actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; padding-top: 8px; }
			.actions svg { width: 24px; height: 24px; }
		</style>
		<div id="pnl">
			<div class="ln">
				<svg data-cmd data-cmd-arg="arw-s" ${actStyle('arw-s')} viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="arw-e" ${actStyle('arw-e')} viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd data-cmd-arg="dash" ${actStyle('dash')} viewBox="0 0 24 24" width="24" height="24"><path d="M 2,11 L 20,11" stroke="rgb(52,71,103)" style="stroke-dasharray: 4,3; stroke-width: 3;"></path></svg>
			</div>
			<div id="clr" style="margin-top: 8px;">
				<div class="ln">
					<div data-cmd-style data-cmd-arg="cl-red"><div class="crcl" style="background: #E74C3C"></div></div>
					<div data-cmd-style data-cmd-arg="cl-orange"><div class="crcl" style="background: #ff6600"></div></div>
					<div data-cmd-style data-cmd-arg="cl-green"><div class="crcl" style="background: #19bc9b"></div></div>
				</div>
				<div class="ln">
					<div data-cmd-style data-cmd-arg="cl-blue"><div class="crcl" style="background: #1aaee5"></div></div>
					<div data-cmd-style data-cmd-arg="cl-dblue"><div class="crcl" style="background: #1D809F"></div></div>
					<div data-cmd-style data-cmd-arg="cl-dgray"><div class="crcl" style="background: #495057"></div></div>
				</div>
			</div>
			<div class="actions">
				<svg data-cmd-copy viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM9 6h8v10h2V4H9v2z" fill="rgb(52,71,103)"/></svg>
				<svg data-cmd-del viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="rgb(52,71,103)"/></svg>
			</div>
		</div>`;

		// Color swatches
		clickForAll(shadow, '[data-cmd-style]', evt => {
			const arg = evtTargetAttr(evt, 'data-cmd-arg');
			classSingleAdd(this._pathElement, this._pathElement[PathSmbl].data, 'cl-', arg);
		});

		// Copy and delete
		const copyBtn = shadow.querySelector('[data-cmd-copy]');
		const delBtn = shadow.querySelector('[data-cmd-del]');
		if (copyBtn) listen(copyBtn, 'click', () => copyAndPast(this._canvas, [this._pathElement]));
		if (delBtn) listen(delBtn, 'click', () => this._pathElement[PathSmbl].del());

		// Arrows and dash toggles
		clickForAll(shadow, '[data-cmd]', evt => {
			const argStyle = evtTargetAttr(evt, 'data-cmd-arg');
			const currentArr = pathStyles.indexOf(argStyle);
			if (currentArr > -1) {
				classDel(this._pathElement, argStyle);
				pathStyles.splice(currentArr, 1);
				classDel(evt.currentTarget, 'actv');
			} else {
				classAdd(this._pathElement, argStyle);
				pathStyles.push(argStyle);
				classAdd(evt.currentTarget, 'actv');
			}
		});
	}
}
customElements.define('ap-path-settings', PathSettings);

/** @typedef { import('./path-smbl').PathElement } PathElement */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */

import { canvasClear } from '../diagram/canvas-clear.js';
import { dgrmPngChunkGet, dgrmPngCreate } from '../diagram/dgrm-png.js';
import { deserialize, serialize } from '../diagram/dgrm-serialization.js';
import { generateKey, srvSave } from '../diagram/dgrm-srv.js';
import { fileOpen, fileSave } from '../infrastructure/file.js';
import { tipShow, uiDisable } from './ui.js';
import { CanvasSmbl } from '../infrastructure/canvas-smbl.js';

export class Menu extends HTMLElement {
	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.innerHTML = `
			<style>
			.menu {
				position: fixed;
				top: 15px;
				left: 15px;
				cursor: pointer;
			}
			#options {
				position: fixed;
				padding: 15px;
				box-shadow: 0px 0px 58px 2px rgba(0, 0, 0, 0.5);
				border-radius: 16px;
				background-color: rgba(30, 30, 30, 0.95);

				top: 0px;
				left: 0px;

				z-index: 1;
			}

			#options div, #options a { 
				color: #e0e0e0; 
				cursor: pointer; margin: 10px 0;
				display: flex;
				align-items: center;
				line-height: 25px;
				text-decoration: none;
			}
			#options div svg, #options a svg { margin-right: 10px; }
			</style>
			<svg id="menu" class="menu" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" fill="#e0e0e0"/></svg>
			<div id="options" style="visibility: hidden;">
			 	<div id="menu2" style="margin: 0 0 15px;"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" fill="#e0e0e0"/></svg></div>
				<div id="save"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z" fill="#e0e0e0"/></svg>Save diagram image</div>
		 	</div>`;

		const options = shadow.getElementById('options');
		function toggle() { options.style.visibility = options.style.visibility === 'visible' ? 'hidden' : 'visible'; }

		/** @param {string} id, @param {()=>void} handler */
		function click(id, handler) {
			shadow.getElementById(id).onclick = _ => {
				uiDisable(true);
				handler();
				toggle();
				uiDisable(false);
			};
		}

		shadow.getElementById('menu').onclick = toggle;
		shadow.getElementById('menu2').onclick = toggle;

		click('save', () => {
			const serialized = serialize(this._canvas);
			if (serialized.s.length === 0) { alertEmpty(); return; }

			dgrmPngCreate(
				this._canvas,
				JSON.stringify(serialized),
				png => fileSave(png, 'dgrm.png'));
		});
	}

	/** @param {CanvasElement} canvas */
	init(canvas) {
		/** @private */ this._canvas = canvas;

		// file drag to window
		document.body.addEventListener('dragover', evt => { evt.preventDefault(); });
		document.body.addEventListener('drop', async evt => {
			evt.preventDefault();

			if (evt.dataTransfer?.items?.length !== 1 ||
				evt.dataTransfer.items[0].kind !== 'file' ||
				evt.dataTransfer.items[0].type !== 'image/png') {
				alertCantOpen(); return;
			}

			await loadData(this._canvas, evt.dataTransfer.items[0].getAsFile());
		});
	}
};
customElements.define('ap-menu', Menu);

/** @param {CanvasElement} canvas,  @param {Blob} png  */
async function loadData(canvas, png) {
	const dgrmChunk = await dgrmPngChunkGet(png);
	if (!dgrmChunk) { alertCantOpen(); return; }
	if (deserialize(canvas, JSON.parse(dgrmChunk))) {
		tipShow(false);
	}
}

const alertCantOpen = () => alert('File cannot be read. Use the exact image file you got from the application.');
const alertEmpty = () => alert('Diagram is empty');

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */

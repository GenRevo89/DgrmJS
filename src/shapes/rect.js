import { ceil, child, classAdd, classDel, positionSet } from '../infrastructure/util.js';
import { rectTxtSettingsPnlCreate } from './rect-txt-settings.js';
import { shapeCreate } from './shape-evt-proc.js';
import { settingsPnlCreate } from './shape-settings.js';
import { rankSettingsPnlCreate } from './rank-settings.js';
import { ShapeSmbl } from './shape-smbl.js';
import { CanvasSmbl } from '../infrastructure/canvas-smbl.js';

/**
 * @param {CanvasElement} canvas
 * @param {RectData} rectData
 */
export function rect(canvas, rectData) {
	const isRank = Array.isArray(rectData.styles) && rectData.styles.includes('rank');
	const isDomain = Array.isArray(rectData.styles) && rectData.styles.includes('domain');
	rectData.w = rectData.w ?? (isRank ? 220 : (isDomain ? 200 : 96));
	rectData.h = rectData.h ?? (isRank ? 88 : (isDomain ? 150 : 48));
	rectData.a = rectData.a ?? (isRank ? 1 : (rectData.t ? 1 : 2));

	const templ = `
		<rect data-key="outer" data-evt-no data-evt-index="2" width="144" height="96" x="-72" y="-48" fill="transparent" stroke="transparent" stroke-width="0" />
		<rect data-key="main" width="96" height="48" x="-48" y="-24" rx="15" ry="15" fill="#1aaee5" stroke="#fff" stroke-width="1" />
		<text data-key="text" y="0" x="${rectTxtXByAlign(rectData)}" style="pointer-events: none;" fill="#fff">&nbsp;</text>`;

	const shape = shapeCreate(canvas, rectData, templ,
		{
			right: { dir: 'right', position: { x: 48, y: 0 } },
			left: { dir: 'left', position: { x: -48, y: 0 } },
			bottom: { dir: 'bottom', position: { x: 0, y: 24 } },
			top: { dir: 'top', position: { x: 0, y: -24 } }
		},
		// onTextChange
		txtEl => {
			// For specialized rank rectangles, DO NOT auto-resize on text changes.
			if (isRank) { resize(false); return; }

			const textBox = txtEl.getBBox();
			const newWidth = ceil(96, 48, textBox.width + (rectData.t ? 6 : 0)); // 6 px right padding for text shape
			const newHeight = ceil(48, 48, textBox.height);

			if (rectData.w !== newWidth || rectData.h !== newHeight) {
				rectData.w = newWidth;
				rectData.h = newHeight;
				resize();
			}
		},
		// settingsPnlCreateFn - use rankSettingsPnlCreate for rank rectangles, otherwise standard settings
		isRank ? rankSettingsPnlCreate : (rectData.t ? rectTxtSettingsPnlCreate : settingsPnlCreate));

	classAdd(shape.el, rectData.t ? 'shtxt' : 'shrect');

	let currentW = rectData.w;
	let currentTxtAlign = rectData.a;
	/** @param {boolean?=} fixTxtAlign */
	function resize(fixTxtAlign) {
		const mainX = rectData.w / -2;
		const mainY = rectData.h / -2;
		const middleX = 0;

		shape.cons.right.position.x = -mainX;
		shape.cons.left.position.x = mainX;
		shape.cons.bottom.position.y = -mainY;
		shape.cons.bottom.position.x = middleX;
		shape.cons.top.position.y = mainY;
		shape.cons.top.position.x = middleX;
		for (const connectorKey in shape.cons) {
			positionSet(child(shape.el, connectorKey), shape.cons[connectorKey].position);
		}

		rectSet(shape.el, 'main', rectData.w, rectData.h, mainX, mainY);
		rectSet(shape.el, 'outer', rectData.w + 48, rectData.h + 48, mainX - 24, mainY - 24);

		// if text align or width changed
		// fix text align
		if (fixTxtAlign || currentTxtAlign !== rectData.a || currentW !== rectData.w) {
			let txtX;
			let posXDelta;
			switch (rectData.a) {
				// text align left
				case 1:
					txtX = mainX + 8;
					posXDelta = (rectData.w - currentW) / 2;
					break;
				case 2:
					txtX = 0;
					posXDelta = 0;
					break;
				// text align right
				case 3:
					txtX = -mainX - 8;
					posXDelta = (rectData.w - currentW) / -2;
					break;
			}

			const txtEl = child(shape.el, 'text');
			txtEl.x.baseVal[0].value = txtX;
			txtEl.querySelectorAll('tspan').forEach(ss => { ss.x.baseVal[0].value = txtX; });

			rectData.position.x += posXDelta;

			classDel(shape.el, `ta-${currentTxtAlign}`);
			classAdd(shape.el, `ta-${rectData.a}`);

			currentTxtAlign = rectData.a;
			currentW = rectData.w;
		}

		shape.draw();
	}

	classAdd(shape.el, `ta-${rectData.a}`);
	if (rectData.w !== 96 || rectData.h !== 48) { resize(true); } else { shape.draw(); }

	shape.el[ShapeSmbl].draw = resize;

	// Add resize handle for domain shapes
	if (isDomain) {
		const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		resizeHandle.setAttribute('r', '6');
		resizeHandle.setAttribute('fill', '#00ff00');
		resizeHandle.setAttribute('stroke', '#fff');
		resizeHandle.setAttribute('stroke-width', '1');
		resizeHandle.setAttribute('cursor', 'nwse-resize');
		resizeHandle.setAttribute('data-key', 'resize-handle');
		shape.el.appendChild(resizeHandle);

		// Position handle at bottom-right corner
		const updateHandlePosition = () => {
			const x = rectData.w / 2;
			const y = rectData.h / 2;
			resizeHandle.setAttribute('cx', x.toString());
			resizeHandle.setAttribute('cy', y.toString());
		};
		updateHandlePosition();

		let isResizing = false;
		let startX = 0;
		let startY = 0;
		let startW = rectData.w;
		let startH = rectData.h;
		let startPosX = rectData.position.x;
		let startPosY = rectData.position.y;

		const onPointerDown = (evt) => {
			evt.stopPropagation();
			isResizing = true;
			startX = evt.clientX;
			startY = evt.clientY;
			startW = rectData.w;
			startH = rectData.h;
			startPosX = rectData.position.x;
			startPosY = rectData.position.y;
			resizeHandle.setPointerCapture(evt.pointerId);
		};

		const onPointerMove = (evt) => {
			if (!isResizing) return;
			evt.stopPropagation();

			// Calculate delta in SVG space
			const canvasData = canvas[CanvasSmbl]?.data;
			if (!canvasData) return;
			const scale = canvasData.scale || 1;
			const deltaX = (evt.clientX - startX) / scale;
			const deltaY = (evt.clientY - startY) / scale;

			// Update dimensions (minimum size 50x50)
			rectData.w = Math.max(50, startW + deltaX);
			rectData.h = Math.max(50, startH + deltaY);

			// Keep top-left corner fixed by adjusting position
			rectData.position.x = startPosX + (rectData.w - startW) / 2;
			rectData.position.y = startPosY + (rectData.h - startH) / 2;

			currentW = rectData.w;
			resize(false);
			updateHandlePosition();
		};

		const onPointerUp = (evt) => {
			if (!isResizing) return;
			evt.stopPropagation();
			isResizing = false;
			resizeHandle.releasePointerCapture(evt.pointerId);
		};

		resizeHandle.addEventListener('pointerdown', onPointerDown);
		resizeHandle.addEventListener('pointermove', onPointerMove);
		resizeHandle.addEventListener('pointerup', onPointerUp);
		resizeHandle.addEventListener('pointercancel', onPointerUp);
	}

	return shape.el;
}

/**
 * @param {Element} svgGrp, @param {string} key,
 * @param {number} w, @param {number} h
 * @param {number} x, @param {number} y
 */
function rectSet(svgGrp, key, w, h, x, y) {
	/** @type {SVGRectElement} */ const rect = child(svgGrp, key);
	rect.width.baseVal.value = w;
	rect.height.baseVal.value = h;
	rect.x.baseVal.value = x;
	rect.y.baseVal.value = y;
}

/** @param {RectData} rectData */
const rectTxtXByAlign = rectData => rectData.a === 1
	? -40 // text align keft
	: rectData.a === 2
		? 0 // text align middle
		: 40; // text align right

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
/** @typedef { import('./shape-evt-proc').CanvasData } CanvasData */
/** @typedef { import('./shape-evt-proc').ConnectorsData } ConnectorsData */
/**
@typedef {{
	type:number, position: Point, title?: string, styles?: string[],
	w?:number, h?:number
	t?:boolean,
	a?: 1|2|3
}} RectData */

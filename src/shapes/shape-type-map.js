import { circle } from './circle.js';
import { path } from './path.js';
import { rect } from './rect.js';
import { rhomb } from './rhomb.js';

/**
 * @param {CanvasElement} canvas
 * @returns {Record<number, ShapeType>}
 */
export function shapeTypeMap(canvas) {
	return {
		0: { create: shapeData => path(canvas, shapeData) },
		// Circle nodes default to text-only (hide main fill/stroke via .shtxt CSS)
		1: { create: shapeData => { shapeData.styles = [...(shapeData.styles ?? []), 'shtxt']; return circle(canvas, shapeData); } },
		// Rect nodes default to behave like "user" nodes: left-aligned text and 'rank' style class
		2: { create: shapeData => {
				/** @type {RectData} */ const sd = /** @type {RectData} */(shapeData);
				sd.a = sd.a ?? 1; // left text align
				sd.w = sd.w ?? 220;
				sd.h = sd.h ?? 88;
				sd.styles = [...(sd.styles ?? []), 'rank'];
				return rect(canvas, sd);
			} },
		// Text rectangle
		3: { create: shapeData => { /** @type {RectData} */(shapeData).t = true; return rect(canvas, shapeData); } },
		// Rhomb nodes default to text-only
		4: { create: shapeData => { shapeData.styles = [...(shapeData.styles ?? []), 'shtxt']; return rhomb(canvas, shapeData); } },
		// Table template (simple rect styled by .shtable CSS)
		5: { create: shapeData => {
				/** @type {RectData} */ const sd = /** @type {RectData} */(shapeData);
				sd.styles = [...(sd.styles ?? []), 'shtable', 'default-table'];
				sd.a = sd.a ?? 2; // center align
				sd.w = sd.w ?? 240;
				sd.h = sd.h ?? 140;
				return rect(canvas, sd);
			} },
		// Domain template (rect styled by .shrect.domain / .shdomain CSS)
		6: { create: shapeData => {
				/** @type {RectData} */ const sd = /** @type {RectData} */(shapeData);
				sd.styles = [...(sd.styles ?? []), 'domain'];
				sd.a = sd.a ?? 2; // center align
				sd.w = sd.w ?? 320;
				sd.h = sd.h ?? 200;
				return rect(canvas, sd);
			} }
	};
}

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('./rect.js').RectData } RectData */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
/**
@typedef {{
	create: (shapeData)=>SVGGraphicsElement
}} ShapeType
*/

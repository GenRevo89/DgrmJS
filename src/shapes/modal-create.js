/** @type {HTMLDivElement} */
let editModalDiv;
/** @param {number} bottomX, @param {number} bottomY, @param {HTMLElement} elem */
export function modalCreate(bottomX, bottomY, elem) {
	editModalDiv = document.createElement('div');
	editModalDiv.style.cssText = 'position: fixed; z-index: 10000; box-shadow: 0px 0px 58px 2px rgba(0, 0, 0, 0.5); border-radius: 16px; background-color: rgba(30, 30, 30, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); max-height: 60vh; overflow: auto;';
	editModalDiv.append(elem);
	
	// Find workflow container or fallback to body
	const container = document.querySelector('[data-workflow-container], .workflow-container, #workflow-container') || document.body;
	container.append(editModalDiv);

	function position(btmX, btmY) {
		const height = editModalDiv.getBoundingClientRect().height;
		const width = editModalDiv.getBoundingClientRect().width;
		
		// Position above the element
		let left = btmX;
		let top = btmY - height - 10; // 10px gap above element
		
		// Constrain to viewport
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		// Keep within horizontal bounds
		if (left + width > viewportWidth - 20) {
			left = viewportWidth - width - 20;
		}
		if (left < 20) {
			left = 20;
		}
		
		// Keep within vertical bounds
		if (top < 20) {
			// If can't fit above, position below the element
			top = btmY + 10;
		}
		if (top + height > viewportHeight - 20) {
			top = viewportHeight - height - 20;
		}
		
		editModalDiv.style.left = `${left}px`;
		editModalDiv.style.top = `${top}px`;
	}
	position(bottomX, bottomY);

	return {
		/**
		 * @param {number} bottomX positon of the bottom left corner of the panel
		 * @param {number} bottomY positon of the bottom left corner of the panel
		 */
		position,
		del: () => { 
			editModalDiv.remove(); 
			editModalDiv = null; 
		}
	};
}

/**
 * Lightweight floating popup panel for quick edits (no global overlay).
 * Intended for arrow/path settings to keep interactions efficient.
 * @param {number} bottomX
 * @param {number} bottomY
 * @param {HTMLElement} elem
 */
export function popupCreate(bottomX, bottomY, elem) {
	const popupDiv = document.createElement('div');
	popupDiv.style.cssText = 'position: fixed; z-index: 9999; border-radius: 12px; background-color: rgba(30, 30, 30, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);';
	popupDiv.append(elem);
	document.body.append(popupDiv);

	function position(btmX, btmY) {
		// Since position is fixed, coordinates are relative to viewport, not document
		popupDiv.style.left = `${btmX}px`;
		popupDiv.style.top = `${btmY - popupDiv.getBoundingClientRect().height}px`;
	}
	position(bottomX, bottomY);

	return {
		/**
		 * @param {number} bottomX positon of the bottom left corner of the panel
		 * @param {number} bottomY positon of the bottom left corner of the panel
		 */
		position,
		del: () => { popupDiv.remove(); }
	};
}

/** @param {number} dif */
export function modalChangeTop(dif) {
	editModalDiv.style.top = `${editModalDiv.getBoundingClientRect().top + dif}px`;
}

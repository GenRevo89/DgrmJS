import { ceil, child, classAdd, classDel, positionSet } from '../infrastructure/util.js';
import { bracketMatchSettingsPnlCreate } from './bracket-match-settings.js';
import { shapeCreate } from './shape-evt-proc.js';
import { ShapeSmbl } from './shape-smbl.js';

/**
 * @param {CanvasElement} canvas
 * @param {BracketMatchData} matchData
 */
export function bracketMatch(canvas, matchData) {
	matchData.w = matchData.w ?? 280;
	matchData.h = matchData.h ?? 240;
	matchData.a = matchData.a ?? 1; // left align

	// Extract tournament state data for rendering
	const embedHtml = matchData.embedHtml || '';
	const playerName = matchData.playerName || 'Empty Slot';
	const guildName = matchData.guildName || '';
	const isPreLaunch = matchData.isPreLaunch || false;
	const isRegistration = matchData.isRegistration || false;
	const isActiveRound = matchData.isActiveRound || false;
	const isAnonymized = matchData.isAnonymized || false;

	// Vote buttons at top (always visible, disabled when not active)
	const canVote = isActiveRound && embedHtml;
	const voteButtons = `<foreignObject pointer-events="auto" data-key="vote-buttons" x="${-matchData.w/2 + 4}" y="${-matchData.h/2 + 4}" width="${matchData.w - 8}" height="28">
			<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; gap: 8px; height: 100%;">
				<button data-key="upvote-btn" ${!canVote ? 'disabled' : ''} style="flex: 1; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 6px; color: #fff; cursor: ${canVote ? 'pointer' : 'not-allowed'}; font-size: 16px; display: flex; align-items: center; justify-content: center; opacity: ${canVote ? '1' : '0.4'}; transition: all 0.2s;">👍</button>
				<button data-key="downvote-btn" ${!canVote ? 'disabled' : ''} style="flex: 1; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; color: #fff; cursor: ${canVote ? 'pointer' : 'not-allowed'}; font-size: 16px; display: flex; align-items: center; justify-content: center; opacity: ${canVote ? '1' : '0.4'}; transition: all 0.2s;">👎</button>
			</div>
		</foreignObject>`;

	// Lazy-loading embed with Listen button
	const embedArea = `<foreignObject pointer-events="auto" data-key="embed-container" x="${-matchData.w/2 + 4}" y="${-matchData.h/2 + 36}" width="${matchData.w - 8}" height="150">
			<div xmlns="http://www.w3.org/1999/xhtml" data-key="embed-wrapper" style="width: 100%; height: 100%; position: relative; pointer-events: auto;">
				<button data-key="listen-btn" style="width: 100%; height: 100%; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); border: 2px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; color: #fff; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
					<span style="font-size: 32px;">🎵</span>
					<span>Listen</span>
				</button>
				<div data-key="embed-content" style="display: none; width: 100%; height: 100%; overflow: hidden; border-radius: 8px;"></div>
			</div>
		</foreignObject>`;

	// Entry buttons for Round 1 (only show if registration or debug)
	// Left side slots get left button, right side slots get right button
	const isRound1 = matchData.round === 1;
	const slotIsEmpty = !embedHtml;
	const showEntryButton = isRound1 && (isRegistration || matchData.isDebugMode);
	const entryButtonEnabled = isRegistration && slotIsEmpty;
	const isLeftSide = matchData.bracketSide === 'left';
	const isRightSide = matchData.bracketSide === 'right';
	
	const leftEntryButton = showEntryButton && isLeftSide
		? `<circle data-key="entry-btn-left" cx="${-matchData.w/2 - 20}" cy="0" r="16" fill="${entryButtonEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.2)'}" stroke="${entryButtonEnabled ? 'rgba(34, 197, 94, 0.6)' : 'rgba(100, 100, 100, 0.4)'}" stroke-width="2" style="cursor: ${entryButtonEnabled ? 'pointer' : 'not-allowed'};" />
			<text data-key="entry-text-left" x="${-matchData.w/2 - 20}" y="6" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold" style="pointer-events: none;">+</text>`
		: '';
	
	const rightEntryButton = showEntryButton && isRightSide
		? `<circle data-key="entry-btn-right" cx="${matchData.w/2 + 20}" cy="0" r="16" fill="${entryButtonEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.2)'}" stroke="${entryButtonEnabled ? 'rgba(34, 197, 94, 0.6)' : 'rgba(100, 100, 100, 0.4)'}" stroke-width="2" style="cursor: ${entryButtonEnabled ? 'pointer' : 'not-allowed'};" />
			<text data-key="entry-text-right" x="${matchData.w/2 + 20}" y="6" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold" style="pointer-events: none;">+</text>`
		: '';

	const templ = `
		<rect data-key="outer" data-evt-no data-evt-index="2" width="${matchData.w + 48}" height="${matchData.h + 48}" x="${-(matchData.w + 48)/2}" y="${-(matchData.h + 48)/2}" fill="transparent" stroke="transparent" stroke-width="0" />
		<rect data-key="main" width="${matchData.w}" height="${matchData.h}" x="${-matchData.w/2}" y="${-matchData.h/2}" rx="8" ry="8" fill="rgba(6, 22, 28, 0.95)" stroke="rgba(59, 130, 246, 0.28)" stroke-width="1" />
		${leftEntryButton}
		${rightEntryButton}
		${voteButtons}
		${embedArea}
		<text data-key="player-name" y="${-matchData.h/2 + 200}" x="${-matchData.w/2 + 8}" fill="#e5e7eb" font-size="13" font-weight="600" style="pointer-events: none;">${playerName}</text>
		<text data-key="guild-name" y="${-matchData.h/2 + 220}" x="${-matchData.w/2 + 8}" fill="rgba(229, 231, 235, 0.6)" font-size="11" style="pointer-events: none;">${guildName || '\u00A0'}</text>
		<text data-key="text" y="0" x="${-matchData.w/2 + 8}" style="pointer-events: none; opacity: 0;">&nbsp;</text>`;

	const shape = shapeCreate(canvas, matchData, templ,
		{
			right: { dir: 'right', position: { x: matchData.w/2, y: 0 } },
			left: { dir: 'left', position: { x: -matchData.w/2, y: 0 } },
			bottom: { dir: 'bottom', position: { x: 0, y: matchData.h/2 } },
			top: { dir: 'top', position: { x: 0, y: -matchData.h/2 } }
		},
		// onTextChange - bracket matches don't auto-resize
		txtEl => {
			resize(false);
		},
		// settingsPnlCreateFn
		bracketMatchSettingsPnlCreate);

	classAdd(shape.el, 'shrect');
	classAdd(shape.el, 'bracket-match');
	
	// Add state-specific classes
	if (isActiveRound) {
		classAdd(shape.el, 'active-round');
	}
	if (isRegistration) {
		classAdd(shape.el, 'registration');
	}
	if (isPreLaunch) {
		classAdd(shape.el, 'pre-launch');
	}

	let currentW = matchData.w;
	let currentTxtAlign = matchData.a;
	
	/** @param {boolean?=} fixTxtAlign */
	function resize(fixTxtAlign) {
		const mainX = matchData.w / -2;
		const mainY = matchData.h / -2;
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

		rectSet(shape.el, 'main', matchData.w, matchData.h, mainX, mainY);
		rectSet(shape.el, 'outer', matchData.w + 48, matchData.h + 48, mainX - 24, mainY - 24);

		if (fixTxtAlign || currentTxtAlign !== matchData.a || currentW !== matchData.w) {
			let txtX;
			let posXDelta;
			switch (matchData.a) {
				case 1: // left align
					txtX = mainX + 8;
					posXDelta = (matchData.w - currentW) / 2;
					break;
				case 2: // center align
					txtX = 0;
					posXDelta = 0;
					break;
				case 3: // right align
					txtX = -mainX - 8;
					posXDelta = (matchData.w - currentW) / -2;
					break;
			}

			const txtEl = child(shape.el, 'text');
			txtEl.x.baseVal[0].value = txtX;
			txtEl.querySelectorAll('tspan').forEach(ss => { ss.x.baseVal[0].value = txtX; });

			matchData.position.x += posXDelta;

			classDel(shape.el, `ta-${currentTxtAlign}`);
			classAdd(shape.el, `ta-${matchData.a}`);

			currentTxtAlign = matchData.a;
			currentW = matchData.w;
		}

		shape.draw();
	}

	classAdd(shape.el, `ta-${matchData.a}`);
	resize(true);

	shape.el[ShapeSmbl].draw = resize;

	// Add lazy-loading for embed - access through foreignObject
	const embedForeignObject = shape.el.querySelector('[data-key="embed-container"]');
	if (embedForeignObject && embedHtml) {
		setTimeout(() => {
			/** @type {HTMLButtonElement | null} */ const listenBtn = embedForeignObject.querySelector('[data-key="listen-btn"]');
			/** @type {HTMLDivElement | null} */ const embedContent = embedForeignObject.querySelector('[data-key="embed-content"]');
			
			if (listenBtn && embedContent) {
				let isLoaded = false;
				listenBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					if (!isLoaded) {
						// Add proper iframe attributes for Suno embeds
						const processedHtml = embedHtml
							.replace(/width="[^"]*"/, 'width="100%"')
							.replace(/height="[^"]*"/, 'height="100%"')
							.replace(/<iframe/, '<iframe style="pointer-events: auto;" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager"');
						
						embedContent.innerHTML = processedHtml;
						listenBtn.style.display = 'none';
						embedContent.style.display = 'block';
						isLoaded = true;
					}
				});

				// Hover effect on listen button
				listenBtn.addEventListener('mouseenter', () => {
					listenBtn.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(139, 92, 246, 0.35) 100%)';
					listenBtn.style.borderColor = 'rgba(59, 130, 246, 0.6)';
					listenBtn.style.transform = 'scale(1.02)';
				});
				listenBtn.addEventListener('mouseleave', () => {
					listenBtn.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)';
					listenBtn.style.borderColor = 'rgba(59, 130, 246, 0.4)';
					listenBtn.style.transform = 'scale(1)';
				});
			}
		}, 100);
	}

	// Add voting functionality - look inside foreignObject
	const voteForeignObject = shape.el.querySelector('[data-key="vote-buttons"]');
	if (voteForeignObject) {
		// Need to access button elements through the foreignObject's content
		setTimeout(() => {
			/** @type {HTMLButtonElement | null} */ const upvoteBtn = voteForeignObject.querySelector('[data-key="upvote-btn"]');
			/** @type {HTMLButtonElement | null} */ const downvoteBtn = voteForeignObject.querySelector('[data-key="downvote-btn"]');
			
			if (upvoteBtn && downvoteBtn) {
				// Only add real voting if we have match and entry IDs (active tournament)
				if (canVote && matchData.matchId && matchData.entryId) {
					const handleVote = async (voteType) => {
						try {
							const response = await fetch('/api/musicfest/vote', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									matchId: matchData.matchId,
									entryId: matchData.entryId,
									voteType: voteType,
								}),
							});
							
							if (response.ok) {
								// Disable both buttons after voting
								upvoteBtn.disabled = true;
								downvoteBtn.disabled = true;
								upvoteBtn.style.opacity = '0.3';
								downvoteBtn.style.opacity = '0.3';
								upvoteBtn.style.cursor = 'not-allowed';
								downvoteBtn.style.cursor = 'not-allowed';
								
								// Visual feedback
								const votedBtn = voteType === 'UP' ? upvoteBtn : downvoteBtn;
								votedBtn.style.transform = 'scale(1.1)';
								setTimeout(() => { votedBtn.style.transform = 'scale(1)'; }, 200);
							}
						} catch (error) {
							console.error('Vote failed:', error);
						}
					};

					upvoteBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						if (!upvoteBtn.disabled) {
							handleVote('UP');
						}
					});

					downvoteBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						if (!downvoteBtn.disabled) {
							handleVote('DOWN');
						}
					});

					// Hover effects
					[upvoteBtn, downvoteBtn].forEach(btn => {
						btn.addEventListener('mouseenter', () => {
							if (!btn.disabled) {
								btn.style.transform = 'scale(1.05)';
								btn.style.filter = 'brightness(1.2)';
							}
						});
						btn.addEventListener('mouseleave', () => {
							if (!btn.disabled) {
								btn.style.transform = 'scale(1)';
								btn.style.filter = 'brightness(1)';
							}
						});
					});
				}
			}
		}, 100);
	}

	// Add entry button functionality for Round 1
	if (isRound1 && showEntryButton) {
		const leftEntryBtn = shape.el.querySelector('[data-key="entry-btn-left"]');
		const rightEntryBtn = shape.el.querySelector('[data-key="entry-btn-right"]');
		
		const handleEntry = (e) => {
			e.stopPropagation();
			if (entryButtonEnabled && matchData.onEnterClick) {
				matchData.onEnterClick();
			}
		};

		if (leftEntryBtn && entryButtonEnabled) {
			leftEntryBtn.addEventListener('click', handleEntry);
			leftEntryBtn.addEventListener('mouseenter', () => {
				leftEntryBtn.setAttribute('fill', 'rgba(34, 197, 94, 0.5)');
				leftEntryBtn.setAttribute('r', '18');
			});
			leftEntryBtn.addEventListener('mouseleave', () => {
				leftEntryBtn.setAttribute('fill', 'rgba(34, 197, 94, 0.3)');
				leftEntryBtn.setAttribute('r', '16');
			});
		}

		if (rightEntryBtn && entryButtonEnabled) {
			rightEntryBtn.addEventListener('click', handleEntry);
			rightEntryBtn.addEventListener('mouseenter', () => {
				rightEntryBtn.setAttribute('fill', 'rgba(34, 197, 94, 0.5)');
				rightEntryBtn.setAttribute('r', '18');
			});
			rightEntryBtn.addEventListener('mouseleave', () => {
				rightEntryBtn.setAttribute('fill', 'rgba(34, 197, 94, 0.3)');
				rightEntryBtn.setAttribute('r', '16');
			});
		}
	}

	return shape.el;
}

/**
 * @param {Element} svgGrp
 * @param {string} key
 * @param {number} w
 * @param {number} h
 * @param {number} x
 * @param {number} y
 */
function rectSet(svgGrp, key, w, h, x, y) {
	/** @type {SVGRectElement} */ const rect = child(svgGrp, key);
	rect.width.baseVal.value = w;
	rect.height.baseVal.value = h;
	rect.x.baseVal.value = x;
	rect.y.baseVal.value = y;
}

/** @typedef { {x:number, y:number} } Point */
/** @typedef { import('../infrastructure/canvas-smbl.js').CanvasElement } CanvasElement */
/**
@typedef {{
	type:number,
	position: Point,
	title?: string,
	styles?: string[],
	w?:number,
	h?:number,
	a?: 1|2|3,
	round?: number,
	isOnFire?: boolean,
	embedHtml?: string,
	playerName?: string,
	guildName?: string,
	isPreLaunch?: boolean,
	isRegistration?: boolean,
	isActiveRound?: boolean,
	isAnonymized?: boolean,
	tournamentId?: string,
	matchId?: string,
	entryId?: string,
	isDebugMode?: boolean,
	bracketSide?: 'left' | 'right',
	onEnterClick?: () => void
}} BracketMatchData */

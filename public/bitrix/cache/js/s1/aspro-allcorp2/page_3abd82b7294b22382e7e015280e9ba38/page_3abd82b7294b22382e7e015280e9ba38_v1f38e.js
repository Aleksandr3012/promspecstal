
; /* Start:"a:4:{s:4:"full";s:58:"/bitrix/templates/aspro-allcorp2/js/sly.js?161097003761252";s:6:"source";s:42:"/bitrix/templates/aspro-allcorp2/js/sly.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/*!
 * sly 1.6.1 - 8th Aug 2015
 * https://github.com/darsain/sly
 *
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */

;(function ($, w, undefined) {
	'use strict';

	var pluginName = 'sly';
	var className  = 'Sly';
	var namespace  = pluginName;

	// Local WindowAnimationTiming interface
	var cAF = w.cancelAnimationFrame || w.cancelRequestAnimationFrame;
	var rAF = w.requestAnimationFrame;

	// Support indicators
	var transform, gpuAcceleration;

	// Other global values
	var $doc = $(document);
	var dragInitEvents = 'touchstart.' + namespace + ' mousedown.' + namespace;
	var dragMouseEvents = 'mousemove.' + namespace + ' mouseup.' + namespace;
	var dragTouchEvents = 'touchmove.' + namespace + ' touchend.' + namespace;
	var wheelEvent = (document.implementation.hasFeature('Event.wheel', '3.0') ? 'wheel.' : 'mousewheel.') + namespace;
	var clickEvent = 'click.' + namespace;
	var mouseDownEvent = 'mousedown.' + namespace;
	var interactiveElements = ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'];
	var tmpArray = [];
	var time;

	// Math shorthands
	var abs = Math.abs;
	var sqrt = Math.sqrt;
	var pow = Math.pow;
	var round = Math.round;
	var max = Math.max;
	var min = Math.min;

	// Keep track of last fired global wheel event
	var lastGlobalWheel = 0;
	/*$doc.on(wheelEvent, function (event) {
		var sly = event.originalEvent[namespace];
		var time = +new Date();
		// Update last global wheel time, but only when event didn't originate
		// in Sly frame, or the origin was less than scrollHijack time ago
		if (!sly || sly.options.scrollHijack < time - lastGlobalWheel) lastGlobalWheel = time;
	});*/

	/**
	 * Sly.
	 *
	 * @class
	 *
	 * @param {Element} frame       DOM element of sly container.
	 * @param {Object}  options     Object with options.
	 * @param {Object}  callbackMap Callbacks map.
	 */
	function Sly(frame, options, callbackMap) {
		if (!(this instanceof Sly)) return new Sly(frame, options, callbackMap);

		// Extend options
		var o = $.extend({}, Sly.defaults, options);

		// Private variables
		var self = this;
		var parallax = isNumber(frame);

		// Frame
		var $frame = $(frame);
		var $slidee = o.slidee ? $(o.slidee).eq(0) : $frame.children().eq(0);
		var frameSize = 0;
		var slideeSize = 0;
		var pos = {
			start: 0,
			center: 0,
			end: 0,
			cur: 0,
			dest: 0
		};

		// Scrollbar
		var $sb = $(o.scrollBar).eq(0);
		var $handle = $sb.children().eq(0);
		var sbSize = 0;
		var handleSize = 0;
		var hPos = {
			start: 0,
			end: 0,
			cur: 0
		};

		// Pagesbar
		var $pb = $(o.pagesBar);
		var $pages = 0;
		var pages = [];

		// Items
		var $items = 0;
		var items = [];
		var rel = {
			firstItem: 0,
			lastItem: 0,
			centerItem: 0,
			activeItem: null,
			activePage: 0
		};

		// Styles
		var frameStyles = new StyleRestorer($frame[0]);
		var slideeStyles = new StyleRestorer($slidee[0]);
		var sbStyles = new StyleRestorer($sb[0]);
		var handleStyles = new StyleRestorer($handle[0]);

		// Navigation type booleans
		var basicNav = o.itemNav === 'basic';
		var forceCenteredNav = o.itemNav === 'forceCentered';
		var centeredNav = o.itemNav === 'centered' || forceCenteredNav;
		var itemNav = !parallax && (basicNav || centeredNav || forceCenteredNav);

		// Miscellaneous
		var $scrollSource = o.scrollSource ? $(o.scrollSource) : $frame;
		var $dragSource = o.dragSource ? $(o.dragSource) : $frame;
		var $forwardButton = $(o.forward);
		var $backwardButton = $(o.backward);
		var $prevButton = $(o.prev);
		var $nextButton = $(o.next);
		var $prevPageButton = $(o.prevPage);
		var $nextPageButton = $(o.nextPage);
		var callbacks = {};
		var last = {};
		var animation = {};
		var move = {};
		var dragging = {
			released: 1
		};
		var scrolling = {
			last: 0,
			delta: 0,
			resetTime: 200
		};
		var renderID = 0;
		var historyID = 0;
		var cycleID = 0;
		var continuousID = 0;
		var i, l;

		// Normalizing frame
		if (!parallax) {
			frame = $frame[0];
		}

		// Expose properties
		self.initialized = 0;
		self.frame = frame;
		self.slidee = $slidee[0];
		self.pos = pos;
		self.rel = rel;
		self.items = items;
		self.pages = pages;
		self.isPaused = 0;
		self.options = o;
		self.dragging = dragging;

		/**
		 * Loading function.
		 *
		 * Populate arrays, set sizes, bind events, ...
		 *
		 * @param {Boolean} [isInit] Whether load is called from within self.init().
		 * @return {Void}
		 */
		function load(isInit) {
			// Local variables
			var lastItemsCount = 0;
			var lastPagesCount = pages.length;

			// Save old position
			pos.old = $.extend({}, pos);

			// Reset global variables
			frameSize = parallax ? 0 : $frame[o.horizontal ? 'width' : 'height']();
			sbSize = $sb[o.horizontal ? 'width' : 'height']();
			slideeSize = parallax ? frame : $slidee[o.horizontal ? 'outerWidth' : 'outerHeight']();
			pages.length = 0;

			// Set position limits & relatives
			pos.start = 0;
			pos.end = max(slideeSize - frameSize, 0);

			// Sizes & offsets for item based navigations
			if (itemNav) {
				// Save the number of current items
				lastItemsCount = items.length;

				// Reset itemNav related variables
				$items = $slidee.children(o.itemSelector);
				items.length = 0;

				// Needed variables
				var paddingStart = getPx($slidee, o.horizontal ? 'paddingLeft' : 'paddingTop');
				var paddingEnd = getPx($slidee, o.horizontal ? 'paddingRight' : 'paddingBottom');
				var borderBox = $($items).css('boxSizing') === 'border-box';
				var areFloated = $items.css('float') !== 'none';
				var ignoredMargin = 0;
				var lastItemIndex = $items.length - 1;
				var lastItem;

				// Reset slideeSize
				slideeSize = 0;

				// Iterate through items
				$items.each(function (i, element) {
					// Item
					var $item = $(element);
					var rect = element.getBoundingClientRect();
					var itemSize = round(o.horizontal ? rect.width || rect.right - rect.left : rect.height || rect.bottom - rect.top);
					var itemMarginStart = getPx($item, o.horizontal ? 'marginLeft' : 'marginTop');
					var itemMarginEnd = getPx($item, o.horizontal ? 'marginRight' : 'marginBottom');
					
					if($item.parents('.frame.props').length){
						if($item.find('td').eq(0).length){
							itemSize -= $item.find('td').eq(0).outerWidth();
						}
					}
					
					var itemSizeFull = itemSize + itemMarginStart + itemMarginEnd;
					var singleSpaced = !itemMarginStart || !itemMarginEnd;
					var item = {};
					item.el = element;
					item.size = singleSpaced ? itemSize : itemSizeFull;
					item.half = item.size / 2;
					item.start = slideeSize + (singleSpaced ? itemMarginStart : 0);
					item.center = item.start - round(frameSize / 2 - item.size / 2);
					item.end = item.start - frameSize + item.size;

					// Account for slidee padding
					if (!i) {
						slideeSize += paddingStart;
					}

					// Increment slidee size for size of the active element
					slideeSize += itemSizeFull;

					// Try to account for vertical margin collapsing in vertical mode
					// It's not bulletproof, but should work in 99% of cases
					if (!o.horizontal && !areFloated) {
						// Subtract smaller margin, but only when top margin is not 0, and this is not the first element
						if (itemMarginEnd && itemMarginStart && i > 0) {
							slideeSize -= min(itemMarginStart, itemMarginEnd);
						}
					}

					// Things to be done on last item
					if (i === lastItemIndex) {
						item.end += paddingEnd;
						slideeSize += paddingEnd;
						ignoredMargin = singleSpaced ? itemMarginEnd : 0;
					}

					// Add item object to items array
					items.push(item);
					lastItem = item;
				});

				// Resize SLIDEE to fit all items
				$slidee[0].style[o.horizontal ? 'width' : 'height'] = (borderBox ? slideeSize: slideeSize - paddingStart - paddingEnd) + 'px';

				// Adjust internal SLIDEE size for last margin
				slideeSize -= ignoredMargin;

				// Set limits
				if (items.length) {
					pos.start =  items[0][forceCenteredNav ? 'center' : 'start'];
					pos.end = forceCenteredNav ? lastItem.center : frameSize < slideeSize ? lastItem.end : pos.start;
				} else {
					pos.start = pos.end = 0;
				}
			}

			// Calculate SLIDEE center position
			pos.center = round(pos.end / 2 + pos.start / 2);

			// Update relative positions
			updateRelatives();

			// Scrollbar
			if ($handle.length && sbSize > 0) {
				// Stretch scrollbar handle to represent the visible area
				if (o.dynamicHandle) {
					handleSize = pos.start === pos.end ? sbSize : round(sbSize * frameSize / slideeSize);
					handleSize = within(handleSize, o.minHandleSize, sbSize);
					$handle[0].style[o.horizontal ? 'width' : 'height'] = handleSize + 'px';
					var scrollbar = $($sb).closest('.wrapp_scrollbar');
					if(handleSize!=sbSize){
						scrollbar.addClass('relative_block');
						$($sb).parent().animate({'opacity': 1}, 50);
						$($sb).fadeIn();
						scrollbar.find('.slider_navigation').fadeIn();
						//if($($frame).hasClass('props')){
							$($frame).addClass('border');
						//}
					}else{
						scrollbar.removeClass('relative_block');
						$($sb).parent().animate({'opacity': 0}, 50);
						$($sb).fadeOut();
						scrollbar.find('.slider_navigation').fadeOut();
						//if($($frame).hasClass('props')){
							$($frame).removeClass('border');
						//}
					}
				} else {
					handleSize = $handle[o.horizontal ? 'outerWidth' : 'outerHeight']();
				}

				hPos.end = sbSize - handleSize;

				if (!renderID) {
					syncScrollbar();
				}
			}

			// Pages
			if (!parallax && frameSize > 0) {
				var tempPagePos = pos.start;
				var pagesHtml = '';

				// Populate pages array
				if (itemNav) {
					$.each(items, function (i, item) {
						if (forceCenteredNav) {
							pages.push(item.center);
						} else if (item.start + item.size > tempPagePos && tempPagePos <= pos.end) {
							tempPagePos = item.start;
							pages.push(tempPagePos);
							tempPagePos += frameSize;
							if (tempPagePos > pos.end && tempPagePos < pos.end + frameSize) {
								pages.push(pos.end);
							}
						}
					});
				} else {
					while (tempPagePos - frameSize < pos.end) {
						pages.push(tempPagePos);
						tempPagePos += frameSize;
					}
				}

				// Pages bar
				if ($pb[0] && lastPagesCount !== pages.length) {
					for (var i = 0; i < pages.length; i++) {
						pagesHtml += o.pageBuilder.call(self, i);
					}
					$pages = $pb.html(pagesHtml).children();
					$pages.eq(rel.activePage).addClass(o.activeClass);
				}
			}

			// Extend relative variables object with some useful info
			rel.slideeSize = slideeSize;
			rel.frameSize = frameSize;
			rel.sbSize = sbSize;
			rel.handleSize = handleSize;

			// Activate requested position
			if (itemNav) {
				if (isInit && o.startAt != null) {
					activate(o.startAt);
					self[centeredNav ? 'toCenter' : 'toStart'](o.startAt);
				}
				// Fix possible overflowing
				var activeItem = items[rel.activeItem];
				slideTo(centeredNav && activeItem ? activeItem.center : within(pos.dest, pos.start, pos.end));
			} else {
				if (isInit) {
					if (o.startAt != null) slideTo(o.startAt, 1);
				} else {
					// Fix possible overflowing
					slideTo(within(pos.dest, pos.start, pos.end));
				}
			}

			// Trigger load event
			trigger('load');
		}
		self.reload = function () { load(); };

		/**
		 * Animate to a position.
		 *
		 * @param {Int}  newPos    New position.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 * @param {Bool} dontAlign Do not align items, use the raw position passed in first argument.
		 *
		 * @return {Void}
		 */
		function slideTo(newPos, immediate, dontAlign) {
			// Align items
			
			/*if (itemNav && dragging.released && !dontAlign) {
				var tempRel = getRelatives(newPos);
				var isNotBordering = newPos > pos.start && newPos < pos.end;

				if (centeredNav) {
					if (isNotBordering) {
						newPos = items[tempRel.centerItem].center;
					}
					if (forceCenteredNav && o.activateMiddle) {
						activate(tempRel.centerItem);
					}
				} else if (isNotBordering) {
					newPos = items[tempRel.firstItem].start;
				}
			}*/

			// Handle overflowing position limits
			if (dragging.init && dragging.slidee && o.elasticBounds) {
				if (newPos > pos.end) {
					newPos = pos.end + (newPos - pos.end) / 6;
				} else if (newPos < pos.start) {
					newPos = pos.start + (newPos - pos.start) / 6;
				}
			} else {
				newPos = within(newPos, pos.start, pos.end);
			}

			// Update the animation object
			animation.start = +new Date();
			animation.time = 0;
			animation.from = pos.cur;
			animation.to = newPos;
			animation.delta = newPos - pos.cur;
			animation.tweesing = dragging.tweese || dragging.init && !dragging.slidee;
			animation.immediate = !animation.tweesing && (immediate || dragging.init && dragging.slidee || !o.speed);

			// Reset dragging tweesing request
			dragging.tweese = 0;

			// Start animation rendering
			if (newPos !== pos.dest) {
				pos.dest = newPos;
				trigger('change');
				if (!renderID) {
					render();
				}
			}

			// Reset next cycle timeout
			resetCycle();

			// Synchronize states
			updateRelatives();
			updateButtonsState();
			syncPagesbar();
		}

		/**
		 * Render animation frame.
		 *
		 * @return {Void}
		 */
		function render() {
			if (!self.initialized) {
				return;
			}

			// If first render call, wait for next animationFrame
			if (!renderID) {
				renderID = rAF(render);
				if (dragging.released) {
					trigger('moveStart');
				}
				return;
			}

			// If immediate repositioning is requested, don't animate.
			if (animation.immediate) {
				pos.cur = animation.to;
			}
			// Use tweesing for animations without known end point
			else if (animation.tweesing) {
				animation.tweeseDelta = animation.to - pos.cur;
				// Fuck Zeno's paradox
				/*if (abs(animation.tweeseDelta) < 0.1) {
					pos.cur = animation.to;
				} else {*/
					pos.cur += animation.tweeseDelta * (dragging.released ? o.swingSpeed : o.syncSpeed);
				//}
			}
			// Use tweening for basic animations with known end point
			else {
				animation.time = min(+new Date() - animation.start, o.speed);
				pos.cur = animation.from + animation.delta * $.easing[o.easing](animation.time/o.speed, animation.time, 0, 1, o.speed);
			}

			// If there is nothing more to render break the rendering loop, otherwise request new animation frame.
			if (animation.to === pos.cur) {
				pos.cur = animation.to;
				dragging.tweese = renderID = 0;
			} else {
				renderID = rAF(render);
			}

			trigger('move');

			// Update SLIDEE position
			if (!parallax) {
				if (transform) {
					$slidee[0].style[transform] = gpuAcceleration + (o.horizontal ? 'translateX' : 'translateY') + '(' + (-pos.cur) + 'px)';
				} else {
					$slidee[0].style[o.horizontal ? 'left' : 'top'] = -round(pos.cur) + 'px';
				}
			}

			// When animation reached the end, and dragging is not active, trigger moveEnd
			if (!renderID && dragging.released) {
				trigger('moveEnd');
			}

			syncScrollbar();
		}

		/**
		 * Synchronizes scrollbar with the SLIDEE.
		 *
		 * @return {Void}
		 */
		function syncScrollbar() {
			if ($handle.length) {
				hPos.cur = pos.start === pos.end ? 0 : (((dragging.init && !dragging.slidee) ? pos.dest : pos.cur) - pos.start) / (pos.end - pos.start) * hPos.end;
				hPos.cur = within(round(hPos.cur), hPos.start, hPos.end);
				if (last.hPos !== hPos.cur) {
					last.hPos = hPos.cur;
					if (transform) {
						$handle[0].style[transform] = gpuAcceleration + (o.horizontal ? 'translateX' : 'translateY') + '(' + hPos.cur + 'px)';
					} else {
						$handle[0].style[o.horizontal ? 'left' : 'top'] = hPos.cur + 'px';
					}
				}
			}
		}

		/**
		 * Synchronizes pagesbar with SLIDEE.
		 *
		 * @return {Void}
		 */
		function syncPagesbar() {
			if ($pages[0] && last.page !== rel.activePage) {
				last.page = rel.activePage;
				$pages.removeClass(o.activeClass).eq(rel.activePage).addClass(o.activeClass);
				trigger('activePage', last.page);
			}
		}

		/**
		 * Returns the position object.
		 *
		 * @param {Mixed} item
		 *
		 * @return {Object}
		 */
		self.getPos = function (item) {
			if (itemNav) {
				var index = getIndex(item);
				return index !== -1 ? items[index] : false;
			} else {
				var $item = $slidee.find(item).eq(0);

				if ($item[0]) {
					var offset = o.horizontal ? $item.offset().left - $slidee.offset().left : $item.offset().top - $slidee.offset().top;
					var size = $item[o.horizontal ? 'outerWidth' : 'outerHeight']();

					return {
						start: offset,
						center: offset - frameSize / 2 + size / 2,
						end: offset - frameSize + size,
						size: size
					};
				} else {
					return false;
				}
			}
		};

		/**
		 * Continuous move in a specified direction.
		 *
		 * @param  {Bool} forward True for forward movement, otherwise it'll go backwards.
		 * @param  {Int}  speed   Movement speed in pixels per frame. Overrides options.moveBy value.
		 *
		 * @return {Void}
		 */
		self.moveBy = function (speed) {
			move.speed = speed;
			// If already initiated, or there is nowhere to move, abort
			/*if (dragging.init || !move.speed || pos.cur === (move.speed > 0 ? pos.end : pos.start)) {
				return;
			}*/
			// Initiate move object
			move.lastTime = +new Date();
			move.startPos = pos.cur;
			// Set dragging as initiated
			continuousInit('button');
			dragging.init = 1;
			// Start movement
			trigger('moveStart');
			cAF(continuousID);
			moveLoop();
		};

		/**
		 * Continuous movement loop.
		 *
		 * @return {Void}
		 */
		function moveLoop() {
			// If there is nowhere to move anymore, stop
			if (!move.speed || pos.cur === (move.speed > 0 ? pos.end : pos.start)) {
				self.stop();
			}
			// Request new move loop if it hasn't been stopped
			continuousID = dragging.init ? rAF(moveLoop) : 0;
			// Update move object
			move.now = +new Date();
			move.pos = pos.cur + (move.now - move.lastTime) / 1000 * move.speed;
			// Slide
			slideTo(dragging.init ? move.pos : round(move.pos));
			// Normally, this is triggered in render(), but if there
			// is nothing to render, we have to do it manually here.
			if (!dragging.init && pos.cur === pos.dest) {
				trigger('moveEnd');
			}
			// Update times for future iteration
			move.lastTime = move.now;
		}

		/**
		 * Stops continuous movement.
		 *
		 * @return {Void}
		 */
		self.stop = function () {
			if (dragging.source === 'button') {
				dragging.init = 0;
				dragging.released = 1;
			}
		};

		/**
		 * Activate previous item.
		 *
		 * @return {Void}
		 */
		self.prev = function () {
			self.activate(rel.activeItem == null ? 0 : rel.activeItem - 1);
		};

		/**
		 * Activate next item.
		 *
		 * @return {Void}
		 */
		self.next = function () {
			self.activate(rel.activeItem == null ? 0 : rel.activeItem + 1);
		};

		/**
		 * Activate previous page.
		 *
		 * @return {Void}
		 */
		self.prevPage = function () {
			self.activatePage(rel.activePage - 1);
		};

		/**
		 * Activate next page.
		 *
		 * @return {Void}
		 */
		self.nextPage = function () {
			self.activatePage(rel.activePage + 1);
		};

		/**
		 * Slide SLIDEE by amount of pixels.
		 *
		 * @param {Int}  delta     Pixels/Items. Positive means forward, negative means backward.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
		self.slideBy = function (delta, immediate) {
			if (!delta) {
				return;
			}
			if (itemNav) {
				self[centeredNav ? 'toCenter' : 'toStart'](
					within((centeredNav ? rel.centerItem : rel.firstItem) + o.scrollBy * delta, 0, items.length)
				);
			} else {
				slideTo(pos.dest + delta, immediate);
			}
		};

		/**
		 * Animate SLIDEE to a specific position.
		 *
		 * @param {Int}  pos       New position.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
		self.slideTo = function (pos, immediate) {
			slideTo(pos, immediate);
		};

		/**
		 * Core method for handling `toLocation` methods.
		 *
		 * @param  {String} location
		 * @param  {Mixed}  item
		 * @param  {Bool}   immediate
		 *
		 * @return {Void}
		 */
		function to(location, item, immediate) {
			// Optional arguments logic
			if (type(item) === 'boolean') {
				immediate = item;
				item = undefined;
			}

			if (item === undefined) {
				slideTo(pos[location], immediate);
			} else {
				// You can't align items to sides of the frame
				// when centered navigation type is enabled
				if (centeredNav && location !== 'center') {
					return;
				}

				var itemPos = self.getPos(item);
				if (itemPos) {
					slideTo(itemPos[location], immediate, !centeredNav);
				}
			}
		}

		/**
		 * Animate element or the whole SLIDEE to the start of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
		self.toStart = function (item, immediate) {
			to('start', item, immediate);
		};

		/**
		 * Animate element or the whole SLIDEE to the end of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
		self.toEnd = function (item, immediate) {
			to('end', item, immediate);
		};

		/**
		 * Animate element or the whole SLIDEE to the center of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
		self.toCenter = function (item, immediate) {
			to('center', item, immediate);
		};

		/**
		 * Get the index of an item in SLIDEE.
		 *
		 * @param {Mixed} item     Item DOM element.
		 *
		 * @return {Int}  Item index, or -1 if not found.
		 */
		function getIndex(item) {
			return item != null ?
					isNumber(item) ?
						item >= 0 && item < items.length ? item : -1 :
						$items.index(item) :
					-1;
		}
		// Expose getIndex without lowering the compressibility of it,
		// as it is used quite often throughout Sly.
		self.getIndex = getIndex;

		/**
		 * Get index of an item in SLIDEE based on a variety of input types.
		 *
		 * @param  {Mixed} item DOM element, positive or negative integer.
		 *
		 * @return {Int}   Item index, or -1 if not found.
		 */
		function getRelativeIndex(item) {
			return getIndex(isNumber(item) && item < 0 ? item + items.length : item);
		}

		/**
		 * Activates an item.
		 *
		 * @param  {Mixed} item Item DOM element, or index starting at 0.
		 *
		 * @return {Mixed} Activated item index or false on fail.
		 */
		function activate(item, force) {
			var index = getIndex(item);

			if (!itemNav || index < 0) {
				return false;
			}

			// Update classes, last active index, and trigger active event only when there
			// has been a change. Otherwise just return the current active index.
			if (last.active !== index || force) {
				// Update classes
				$items.eq(rel.activeItem).removeClass(o.activeClass);
				$items.eq(index).addClass(o.activeClass);

				last.active = rel.activeItem = index;

				updateButtonsState();
				trigger('active', index);
			}

			return index;
		}

		/**
		 * Activates an item and helps with further navigation when o.smart is enabled.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0.
		 * @param {Bool}  immediate Whether to reposition immediately in smart navigation.
		 *
		 * @return {Void}
		 */
		self.activate = function (item, immediate) {
			var index = activate(item);

			// Smart navigation
			if (o.smart && index !== false) {
				// When centeredNav is enabled, center the element.
				// Otherwise, determine where to position the element based on its current position.
				// If the element is currently on the far end side of the frame, assume that user is
				// moving forward and animate it to the start of the visible frame, and vice versa.
				if (centeredNav) {
					self.toCenter(index, immediate);
				} else if (index >= rel.lastItem) {
					self.toStart(index, immediate);
				} else if (index <= rel.firstItem) {
					self.toEnd(index, immediate);
				} else {
					resetCycle();
				}
			}
		};

		/**
		 * Activates a page.
		 *
		 * @param {Int}  index     Page index, starting from 0.
		 * @param {Bool} immediate Whether to reposition immediately without animation.
		 *
		 * @return {Void}
		 */
		self.activatePage = function (index, immediate) {
			if (isNumber(index)) {
				slideTo(pages[within(index, 0, pages.length - 1)], immediate);
			}
		};

		/**
		 * Return relative positions of items based on their visibility within FRAME.
		 *
		 * @param {Int} slideePos Position of SLIDEE.
		 *
		 * @return {Void}
		 */
		function getRelatives(slideePos) {
			slideePos = within(isNumber(slideePos) ? slideePos : pos.dest, pos.start, pos.end);

			var relatives = {};
			var centerOffset = forceCenteredNav ? 0 : frameSize / 2;

			// Determine active page
			if (!parallax) {
				for (var p = 0, pl = pages.length; p < pl; p++) {
					if (slideePos >= pos.end || p === pages.length - 1) {
						relatives.activePage = pages.length - 1;
						break;
					}

					if (slideePos <= pages[p] + centerOffset) {
						relatives.activePage = p;
						break;
					}
				}
			}

			// Relative item indexes
			if (itemNav) {
				var first = false;
				var last = false;
				var center = false;

				// From start
				for (var i = 0, il = items.length; i < il; i++) {
					// First item
					if (first === false && slideePos <= items[i].start + items[i].half) {
						first = i;
					}

					// Center item
					if (center === false && slideePos <= items[i].center + items[i].half) {
						center = i;
					}

					// Last item
					if (i === il - 1 || slideePos <= items[i].end + items[i].half) {
						last = i;
						break;
					}
				}

				// Safe assignment, just to be sure the false won't be returned
				relatives.firstItem = isNumber(first) ? first : 0;
				relatives.centerItem = isNumber(center) ? center : relatives.firstItem;
				relatives.lastItem = isNumber(last) ? last : relatives.centerItem;
			}

			return relatives;
		}

		/**
		 * Update object with relative positions.
		 *
		 * @param {Int} newPos
		 *
		 * @return {Void}
		 */
		function updateRelatives(newPos) {
			$.extend(rel, getRelatives(newPos));
		}

		/**
		 * Disable navigation buttons when needed.
		 *
		 * Adds disabledClass, and when the button is <button> or <input>, activates :disabled state.
		 *
		 * @return {Void}
		 */
		function updateButtonsState() {
			var isStart = pos.dest <= pos.start;
			var isEnd = pos.dest >= pos.end;
			var slideePosState = (isStart ? 1 : 0) | (isEnd ? 2 : 0);

			// Update paging buttons only if there has been a change in SLIDEE position
			if (last.slideePosState !== slideePosState) {
				last.slideePosState = slideePosState;

				if ($prevPageButton.is('button,input')) {
					$prevPageButton.prop('disabled', isStart);
				}

				if ($nextPageButton.is('button,input')) {
					$nextPageButton.prop('disabled', isEnd);
				}

				$prevPageButton.add($backwardButton)[isStart ? 'addClass' : 'removeClass'](o.disabledClass);
				$nextPageButton.add($forwardButton)[isEnd ? 'addClass' : 'removeClass'](o.disabledClass);
			}

			// Forward & Backward buttons need a separate state caching because we cannot "property disable"
			// them while they are being used, as disabled buttons stop emitting mouse events.
			if (last.fwdbwdState !== slideePosState && dragging.released) {
				last.fwdbwdState = slideePosState;

				if ($backwardButton.is('button,input')) {
					$backwardButton.prop('disabled', isStart);
				}

				if ($forwardButton.is('button,input')) {
					$forwardButton.prop('disabled', isEnd);
				}
			}

			// Item navigation
			if (itemNav && rel.activeItem != null) {
				var isFirst = rel.activeItem === 0;
				var isLast = rel.activeItem >= items.length - 1;
				var itemsButtonState = (isFirst ? 1 : 0) | (isLast ? 2 : 0);

				if (last.itemsButtonState !== itemsButtonState) {
					last.itemsButtonState = itemsButtonState;

					if ($prevButton.is('button,input')) {
						$prevButton.prop('disabled', isFirst);
					}

					if ($nextButton.is('button,input')) {
						$nextButton.prop('disabled', isLast);
					}

					$prevButton[isFirst ? 'addClass' : 'removeClass'](o.disabledClass);
					$nextButton[isLast ? 'addClass' : 'removeClass'](o.disabledClass);
				}
			}
		}

		/**
		 * Resume cycling.
		 *
		 * @param {Int} priority Resume pause with priority lower or equal than this. Used internally for pauseOnHover.
		 *
		 * @return {Void}
		 */
		self.resume = function (priority) {
			if (!o.cycleBy || !o.cycleInterval || o.cycleBy === 'items' && (!items[0] || rel.activeItem == null) || priority < self.isPaused) {
				return;
			}

			self.isPaused = 0;

			if (cycleID) {
				cycleID = clearTimeout(cycleID);
			} else {
				trigger('resume');
			}

			cycleID = setTimeout(function () {
				trigger('cycle');
				switch (o.cycleBy) {
					case 'items':
						self.activate(rel.activeItem >= items.length - 1 ? 0 : rel.activeItem + 1);
						break;

					case 'pages':
						self.activatePage(rel.activePage >= pages.length - 1 ? 0 : rel.activePage + 1);
						break;
				}
			}, o.cycleInterval);
		};

		/**
		 * Pause cycling.
		 *
		 * @param {Int} priority Pause priority. 100 is default. Used internally for pauseOnHover.
		 *
		 * @return {Void}
		 */
		self.pause = function (priority) {
			if (priority < self.isPaused) {
				return;
			}

			self.isPaused = priority || 100;

			if (cycleID) {
				cycleID = clearTimeout(cycleID);
				trigger('pause');
			}
		};

		/**
		 * Toggle cycling.
		 *
		 * @return {Void}
		 */
		self.toggle = function () {
			self[cycleID ? 'pause' : 'resume']();
		};

		/**
		 * Updates a signle or multiple option values.
		 *
		 * @param {Mixed} name  Name of the option that should be updated, or object that will extend the options.
		 * @param {Mixed} value New option value.
		 *
		 * @return {Void}
		 */
		self.set = function (name, value) {
			if ($.isPlainObject(name)) {
				$.extend(o, name);
			} else if (o.hasOwnProperty(name)) {
				o[name] = value;
			}
		};

		/**
		 * Add one or multiple items to the SLIDEE end, or a specified position index.
		 *
		 * @param {Mixed} element Node element, or HTML string.
		 * @param {Int}   index   Index of a new item position. By default item is appended at the end.
		 *
		 * @return {Void}
		 */
		self.add = function (element, index) {
			var $element = $(element);

			if (itemNav) {
				// Insert the element(s)
				if (index == null || !items[0] || index >= items.length) {
					$element.appendTo($slidee);
				} else if (items.length) {
					$element.insertBefore(items[index].el);
				}

				// Adjust the activeItem index
				if (rel.activeItem != null && index <= rel.activeItem) {
					last.active = rel.activeItem += $element.length;
				}
			} else {
				$slidee.append($element);
			}

			// Reload
			load();
		};

		/**
		 * Remove an item from SLIDEE.
		 *
		 * @param {Mixed} element Item index, or DOM element.
		 * @param {Int}   index   Index of a new item position. By default item is appended at the end.
		 *
		 * @return {Void}
		 */
		self.remove = function (element) {
			if (itemNav) {
				var index = getRelativeIndex(element);

				if (index > -1) {
					// Remove the element
					$items.eq(index).remove();

					// If the current item is being removed, activate new one after reload
					var reactivate = index === rel.activeItem;

					// Adjust the activeItem index
					if (rel.activeItem != null && index < rel.activeItem) {
						last.active = --rel.activeItem;
					}

					// Reload
					load();

					// Activate new item at the removed position
					if (reactivate) {
						last.active = null;
						self.activate(rel.activeItem);
					}
				}
			} else {
				$(element).remove();
				load();
			}
		};

		/**
		 * Helps re-arranging items.
		 *
		 * @param  {Mixed} item     Item DOM element, or index starting at 0. Use negative numbers to select items from the end.
		 * @param  {Mixed} position Item insertion anchor. Accepts same input types as item argument.
		 * @param  {Bool}  after    Insert after instead of before the anchor.
		 *
		 * @return {Void}
		 */
		function moveItem(item, position, after) {
			item = getRelativeIndex(item);
			position = getRelativeIndex(position);

			// Move only if there is an actual change requested
			if (item > -1 && position > -1 && item !== position && (!after || position !== item - 1) && (after || position !== item + 1)) {
				$items.eq(item)[after ? 'insertAfter' : 'insertBefore'](items[position].el);

				var shiftStart = item < position ? item : (after ? position : position - 1);
				var shiftEnd = item > position ? item : (after ? position + 1 : position);
				var shiftsUp = item > position;

				// Update activeItem index
				if (rel.activeItem != null) {
					if (item === rel.activeItem) {
						last.active = rel.activeItem = after ? (shiftsUp ? position + 1 : position) : (shiftsUp ? position : position - 1);
					} else if (rel.activeItem > shiftStart && rel.activeItem < shiftEnd) {
						last.active = rel.activeItem += shiftsUp ? 1 : -1;
					}
				}

				// Reload
				load();
			}
		}

		/**
		 * Move item after the target anchor.
		 *
		 * @param  {Mixed} item     Item to be moved. Can be DOM element or item index.
		 * @param  {Mixed} position Target position anchor. Can be DOM element or item index.
		 *
		 * @return {Void}
		 */
		self.moveAfter = function (item, position) {
			moveItem(item, position, 1);
		};

		/**
		 * Move item before the target anchor.
		 *
		 * @param  {Mixed} item     Item to be moved. Can be DOM element or item index.
		 * @param  {Mixed} position Target position anchor. Can be DOM element or item index.
		 *
		 * @return {Void}
		 */
		self.moveBefore = function (item, position) {
			moveItem(item, position);
		};

		/**
		 * Registers callbacks.
		 *
		 * @param  {Mixed} name  Event name, or callbacks map.
		 * @param  {Mixed} fn    Callback, or an array of callback functions.
		 *
		 * @return {Void}
		 */
		self.on = function (name, fn) {
			// Callbacks map
			if (type(name) === 'object') {
				for (var key in name) {
					if (name.hasOwnProperty(key)) {
						self.on(key, name[key]);
					}
				}
			// Callback
			} else if (type(fn) === 'function') {
				var names = name.split(' ');
				for (var n = 0, nl = names.length; n < nl; n++) {
					callbacks[names[n]] = callbacks[names[n]] || [];
					if (callbackIndex(names[n], fn) === -1) {
						callbacks[names[n]].push(fn);
					}
				}
			// Callbacks array
			} else if (type(fn) === 'array') {
				for (var f = 0, fl = fn.length; f < fl; f++) {
					self.on(name, fn[f]);
				}
			}
		};

		/**
		 * Registers callbacks to be executed only once.
		 *
		 * @param  {Mixed} name  Event name, or callbacks map.
		 * @param  {Mixed} fn    Callback, or an array of callback functions.
		 *
		 * @return {Void}
		 */
		self.one = function (name, fn) {
			function proxy() {
				fn.apply(self, arguments);
				self.off(name, proxy);
			}
			self.on(name, proxy);
		};

		/**
		 * Remove one or all callbacks.
		 *
		 * @param  {String} name Event name.
		 * @param  {Mixed}  fn   Callback, or an array of callback functions. Omit to remove all callbacks.
		 *
		 * @return {Void}
		 */
		self.off = function (name, fn) {
			if (fn instanceof Array) {
				for (var f = 0, fl = fn.length; f < fl; f++) {
					self.off(name, fn[f]);
				}
			} else {
				var names = name.split(' ');
				for (var n = 0, nl = names.length; n < nl; n++) {
					callbacks[names[n]] = callbacks[names[n]] || [];
					if (fn == null) {
						callbacks[names[n]].length = 0;
					} else {
						var index = callbackIndex(names[n], fn);
						if (index !== -1) {
							callbacks[names[n]].splice(index, 1);
						}
					}
				}
			}
		};

		/**
		 * Returns callback array index.
		 *
		 * @param  {String}   name Event name.
		 * @param  {Function} fn   Function
		 *
		 * @return {Int} Callback array index, or -1 if isn't registered.
		 */
		function callbackIndex(name, fn) {
			for (var i = 0, l = callbacks[name].length; i < l; i++) {
				if (callbacks[name][i] === fn) {
					return i;
				}
			}
			return -1;
		}

		/**
		 * Reset next cycle timeout.
		 *
		 * @return {Void}
		 */
		function resetCycle() {
			if (dragging.released && !self.isPaused) {
				self.resume();
			}
		}

		/**
		 * Calculate SLIDEE representation of handle position.
		 *
		 * @param  {Int} handlePos
		 *
		 * @return {Int}
		 */
		function handleToSlidee(handlePos) {
			return round(within(handlePos, hPos.start, hPos.end) / hPos.end * (pos.end - pos.start)) + pos.start;
		}

		/**
		 * Keeps track of a dragging delta history.
		 *
		 * @return {Void}
		 */
		function draggingHistoryTick() {
			// Looking at this, I know what you're thinking :) But as we need only 4 history states, doing it this way
			// as opposed to a proper loop is ~25 bytes smaller (when minified with GCC), a lot faster, and doesn't
			// generate garbage. The loop version would create 2 new variables on every tick. Unexaptable!
			dragging.history[0] = dragging.history[1];
			dragging.history[1] = dragging.history[2];
			dragging.history[2] = dragging.history[3];
			dragging.history[3] = dragging.delta;
		}

		/**
		 * Initialize continuous movement.
		 *
		 * @return {Void}
		 */
		function continuousInit(source) {
			dragging.released = 0;
			dragging.source = source;
			dragging.slidee = source === 'slidee';
		}

		/**
		 * Dragging initiator.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function dragInit(event) {
			var isTouch = event.type === 'touchstart';
			var source = event.data.source;
			var isSlidee = source === 'slidee';

			// Ignore when already in progress, or interactive element in non-touch navivagion
			if (dragging.init || !isTouch && isInteractive(event.target)) {
				return;
			}

			// Handle dragging conditions
			if (source === 'handle' && (!o.dragHandle || hPos.start === hPos.end)) {
				return;
			}

			// SLIDEE dragging conditions
			if (isSlidee && !(isTouch ? o.touchDragging : o.mouseDragging && event.which < 2)) {
				return;
			}

			if (!isTouch) {
				// prevents native image dragging in Firefox
				stopDefault(event);
			}

			// Reset dragging object
			continuousInit(source);

			// Properties used in dragHandler
			dragging.init = 0;
			dragging.$source = $(event.target);
			dragging.touch = isTouch;
			dragging.pointer = isTouch ? event.originalEvent.touches[0] : event;
			dragging.initX = dragging.pointer.pageX;
			dragging.initY = dragging.pointer.pageY;
			dragging.initPos = isSlidee ? pos.cur : hPos.cur;
			dragging.start = +new Date();
			dragging.time = 0;
			dragging.path = 0;
			dragging.delta = 0;
			dragging.locked = 0;
			dragging.history = [0, 0, 0, 0];
			dragging.pathToLock = isSlidee ? isTouch ? 30 : 10 : 0;

			// Bind dragging events
			$doc.on(isTouch ? dragTouchEvents : dragMouseEvents, dragHandler);

			// Pause ongoing cycle
			self.pause(1);

			// Add dragging class
			(isSlidee ? $slidee : $handle).addClass(o.draggedClass);

			// Trigger moveStart event
			trigger('moveStart');

			// Keep track of a dragging path history. This is later used in the
			// dragging release swing calculation when dragging SLIDEE.
			if (isSlidee) {
				historyID = setInterval(draggingHistoryTick, 10);
			}
		}

		/**
		 * Handler for dragging scrollbar handle or SLIDEE.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function dragHandler(event) {
			dragging.released = event.type === 'mouseup' || event.type === 'touchend';
			dragging.pointer = dragging.touch ? event.originalEvent[dragging.released ? 'changedTouches' : 'touches'][0] : event;
			dragging.pathX = dragging.pointer.pageX - dragging.initX;
			dragging.pathY = dragging.pointer.pageY - dragging.initY;
			dragging.path = sqrt(pow(dragging.pathX, 2) + pow(dragging.pathY, 2));
			dragging.delta = o.horizontal ? dragging.pathX : dragging.pathY;

			if (!dragging.released && dragging.path < 1) return;

			// We haven't decided whether this is a drag or not...
			if (!dragging.init) {
				// If the drag path was very short, maybe it's not a drag?
				if (dragging.path < o.dragThreshold) {
					// If the pointer was released, the path will not become longer and it's
					// definitely not a drag. If not released yet, decide on next iteration
					return dragging.released ? dragEnd() : undefined;
				}
				else {
					// If dragging path is sufficiently long we can confidently start a drag
					// if drag is in different direction than scroll, ignore it
					if (o.horizontal ? abs(dragging.pathX) > abs(dragging.pathY) : abs(dragging.pathX) < abs(dragging.pathY)) {
						dragging.init = 1;
					} else {
						return dragEnd();
					}
				}
			}

			stopDefault(event);

			// Disable click on a source element, as it is unwelcome when dragging
			if (!dragging.locked && dragging.path > dragging.pathToLock && dragging.slidee) {
				dragging.locked = 1;
				dragging.$source.on(clickEvent, disableOneEvent);
			}

			// Cancel dragging on release
			if (dragging.released) {
				dragEnd();

				// Adjust path with a swing on mouse release
				if (o.releaseSwing && dragging.slidee) {
					dragging.swing = (dragging.delta - dragging.history[0]) / 40 * 300;
					dragging.delta += dragging.swing;
					dragging.tweese = abs(dragging.swing) > 10;
				}
			}

			slideTo(dragging.slidee ? round(dragging.initPos - dragging.delta) : handleToSlidee(dragging.initPos + dragging.delta));
		}

		/**
		 * Stops dragging and cleans up after it.
		 *
		 * @return {Void}
		 */
		function dragEnd() {
			clearInterval(historyID);
			dragging.released = true;
			$doc.off(dragging.touch ? dragTouchEvents : dragMouseEvents, dragHandler);
			(dragging.slidee ? $slidee : $handle).removeClass(o.draggedClass);

			// Make sure that disableOneEvent is not active in next tick.
			setTimeout(function () {
				dragging.$source.off(clickEvent, disableOneEvent);
			});

			// Normally, this is triggered in render(), but if there
			// is nothing to render, we have to do it manually here.
			if (pos.cur === pos.dest && dragging.init) {
				trigger('moveEnd');
			}

			// Resume ongoing cycle
			self.resume(1);

			dragging.init = 0;
		}

		/**
		 * Check whether element is interactive.
		 *
		 * @return {Boolean}
		 */
		function isInteractive(element) {
			return ~$.inArray(element.nodeName, interactiveElements) || $(element).is(o.interactive);
		}

		/**
		 * Continuous movement cleanup on mouseup.
		 *
		 * @return {Void}
		 */
		function movementReleaseHandler() {
			self.stop();
			$doc.off('mouseup', movementReleaseHandler);
		}

		/**
		 * Buttons navigation handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function buttonsHandler(event) {
			/*jshint validthis:true */
			stopDefault(event);
			switch (this) {
				case $forwardButton[0]:
				case $backwardButton[0]:
					self.moveBy($forwardButton.is(this) ? o.moveBy : -o.moveBy);
					$doc.on('mouseup', movementReleaseHandler);
					break;

				case $prevButton[0]:
					self.prev();
					break;

				case $nextButton[0]:
					self.next();
					break;

				case $prevPageButton[0]:
					self.prevPage();
					break;

				case $nextPageButton[0]:
					self.nextPage();
					break;
			}
		}

		/**
		 * Mouse wheel delta normalization.
		 *
		 * @param  {Event} event
		 *
		 * @return {Int}
		 */
		function normalizeWheelDelta(event) {
			// wheelDelta needed only for IE8-
			scrolling.curDelta = ((o.horizontal ? event.deltaY || event.deltaX : event.deltaY) || -event.wheelDelta);
			scrolling.curDelta /= event.deltaMode === 1 ? 3 : 100;
			if (!itemNav) {
				return scrolling.curDelta;
			}
			time = +new Date();
			if (scrolling.last < time - scrolling.resetTime) {
				scrolling.delta = 0;
			}
			scrolling.last = time;
			scrolling.delta += scrolling.curDelta;
			if (abs(scrolling.delta) < 1) {
				scrolling.finalDelta = 0;
			} else {
				scrolling.finalDelta = round(scrolling.delta / 1);
				scrolling.delta %= 1;
			}
			return scrolling.finalDelta;
		}

		/**
		 * Mouse scrolling handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function scrollHandler(event) {
			// Mark event as originating in a Sly instance
			event.originalEvent[namespace] = self;
			// Don't hijack global scrolling
			var time = +new Date();
			if (lastGlobalWheel + o.scrollHijack > time && $scrollSource[0] !== document && $scrollSource[0] !== window) {
				lastGlobalWheel = time;
				return;
			}
			// Ignore if there is no scrolling to be done
			if (!o.scrollBy || pos.start === pos.end) {
				return;
			}
			var delta = normalizeWheelDelta(event.originalEvent);
			// Trap scrolling only when necessary and/or requested
			if (o.scrollTrap || delta > 0 && pos.dest < pos.end || delta < 0 && pos.dest > pos.start) {
				stopDefault(event, 1);
			}
			self.slideBy(o.scrollBy * delta);
		}

		/**
		 * Scrollbar click handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function scrollbarHandler(event) {
			// Only clicks on scroll bar. Ignore the handle.
			if (o.clickBar && event.target === $sb[0]) {
				stopDefault(event);
				// Calculate new handle position and sync SLIDEE to it
				slideTo(handleToSlidee((o.horizontal ? event.pageX - $sb.offset().left : event.pageY - $sb.offset().top) - handleSize / 2));
			}
		}

		/**
		 * Keyboard input handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function keyboardHandler(event) {
			if (!o.keyboardNavBy) {
				return;
			}

			switch (event.which) {
				// Left or Up
				case o.horizontal ? 37 : 38:
					stopDefault(event);
					self[o.keyboardNavBy === 'pages' ? 'prevPage' : 'prev']();
					break;

				// Right or Down
				case o.horizontal ? 39 : 40:
					stopDefault(event);
					self[o.keyboardNavBy === 'pages' ? 'nextPage' : 'next']();
					break;
			}
		}

		/**
		 * Click on item activation handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function activateHandler(event) {
			/*jshint validthis:true */

			// Ignore clicks on interactive elements.
			if (isInteractive(this)) {
				event.originalEvent[namespace + 'ignore'] = true;
				return;
			}

			// Ignore events that:
			// - are not originating from direct SLIDEE children
			// - originated from interactive elements
			if (this.parentNode !== $slidee[0] || event.originalEvent[namespace + 'ignore']) return;

			self.activate(this);
		}

		/**
		 * Click on page button handler.
		 *
		 * @param {Event} event
		 *
		 * @return {Void}
		 */
		function activatePageHandler() {
			/*jshint validthis:true */
			// Accept only events from direct pages bar children.
			if (this.parentNode === $pb[0]) {
				self.activatePage($pages.index(this));
			}
		}

		/**
		 * Pause on hover handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
		function pauseOnHoverHandler(event) {
			if (o.pauseOnHover) {
				self[event.type === 'mouseenter' ? 'pause' : 'resume'](2);
			}
		}

		/**
		 * Trigger callbacks for event.
		 *
		 * @param  {String} name Event name.
		 * @param  {Mixed}  argX Arguments passed to callbacks.
		 *
		 * @return {Void}
		 */
		function trigger(name, arg1) {
			if (callbacks[name]) {
				l = callbacks[name].length;
				// Callbacks will be stored and executed from a temporary array to not
				// break the execution queue when one of the callbacks unbinds itself.
				tmpArray.length = 0;
				for (i = 0; i < l; i++) {
					tmpArray.push(callbacks[name][i]);
				}
				// Execute the callbacks
				for (i = 0; i < l; i++) {
					tmpArray[i].call(self, name, arg1);
				}
			}
		}

		/**
		 * Destroys instance and everything it created.
		 *
		 * @return {Void}
		 */
		self.destroy = function () {
			// Remove the reference to itself
			Sly.removeInstance(frame);

			// Unbind all events
			$scrollSource
				.add($handle)
				.add($sb)
				.add($pb)
				.add($forwardButton)
				.add($backwardButton)
				.add($prevButton)
				.add($nextButton)
				.add($prevPageButton)
				.add($nextPageButton)
				.off('.' + namespace);

			// Unbinding specifically as to not nuke out other instances
			$doc.off('keydown', keyboardHandler);

			// Remove classes
			$prevButton
				.add($nextButton)
				.add($prevPageButton)
				.add($nextPageButton)
				.removeClass(o.disabledClass);

			if ($items && rel.activeItem != null) {
				$items.eq(rel.activeItem).removeClass(o.activeClass);
			}

			// Remove page items
			$pb.empty();

			if (!parallax) {
				// Unbind events from frame
				$frame.off('.' + namespace);
				// Restore original styles
				frameStyles.restore();
				slideeStyles.restore();
				sbStyles.restore();
				handleStyles.restore();
				// Remove the instance from element data storage
				$.removeData(frame, namespace);
			}

			// Clean up collections
			items.length = pages.length = 0;
			last = {};

			// Reset initialized status and return the instance
			self.initialized = 0;
			return self;
		};

		/**
		 * Initialize.
		 *
		 * @return {Object}
		 */
		self.init = function () {
			if (self.initialized) {
				return;
			}

			// Disallow multiple instances on the same element
			if (Sly.getInstance(frame)) throw new Error('There is already a Sly instance on this element');

			// Store the reference to itself
			Sly.storeInstance(frame, self);

			// Register callbacks map
			self.on(callbackMap);

			// Save styles
			var holderProps = ['overflow', 'position'];
			var movableProps = ['position', 'webkitTransform', 'msTransform', 'transform', 'left', 'top', 'width', 'height'];
			frameStyles.save.apply(frameStyles, holderProps);
			sbStyles.save.apply(sbStyles, holderProps);
			slideeStyles.save.apply(slideeStyles, movableProps);
			handleStyles.save.apply(handleStyles, movableProps);

			// Set required styles
			var $movables = $handle;
			if (!parallax) {
				$movables = $movables.add($slidee);
				$frame.css('overflow', 'hidden');
				if (!transform && $frame.css('position') === 'static') {
					$frame.css('position', 'relative');
				}
			}
			if (transform) {
				if (gpuAcceleration) {
					$movables.css(transform, gpuAcceleration);
				}
			} else {
				if ($sb.css('position') === 'static') {
					$sb.css('position', 'relative');
				}
				$movables.css({ position: 'absolute' });
			}

			// Navigation buttons
			if (o.forward) {
				$forwardButton.on(mouseDownEvent, buttonsHandler);
			}
			if (o.backward) {
				$backwardButton.on(mouseDownEvent, buttonsHandler);
			}
			if (o.prev) {
				$prevButton.on(clickEvent, buttonsHandler);
			}
			if (o.next) {
				$nextButton.on(clickEvent, buttonsHandler);
			}
			if (o.prevPage) {
				$prevPageButton.on(clickEvent, buttonsHandler);
			}
			if (o.nextPage) {
				$nextPageButton.on(clickEvent, buttonsHandler);
			}

			// Scrolling navigation
			//$scrollSource.on(wheelEvent, scrollHandler);

			// Clicking on scrollbar navigation
			if ($sb[0]) {
				$sb.on(clickEvent, scrollbarHandler);
			}

			// Click on items navigation
			if (itemNav && o.activateOn) {
				$frame.on(o.activateOn + '.' + namespace, '*', activateHandler);
			}

			// Pages navigation
			if ($pb[0] && o.activatePageOn) {
				$pb.on(o.activatePageOn + '.' + namespace, '*', activatePageHandler);
			}

			// Dragging navigation
			$dragSource.on(dragInitEvents, { source: 'slidee' }, dragInit);

			// Scrollbar dragging navigation
			if ($handle) {
				$handle.on(dragInitEvents, { source: 'handle' }, dragInit);
			}

			// Keyboard navigation
			$doc.on('keydown', keyboardHandler);

			if (!parallax) {
				// Pause on hover
				$frame.on('mouseenter.' + namespace + ' mouseleave.' + namespace, pauseOnHoverHandler);
				// Reset native FRAME element scroll
				$frame.on('scroll.' + namespace, resetScroll);
			}

			// Mark instance as initialized
			self.initialized = 1;

			// Load
			load(true);

			// Initiate automatic cycling
			if (o.cycleBy && !parallax) {
				self[o.startPaused ? 'pause' : 'resume']();
			}

			// Return instance
			return self;
		};
	}

	Sly.getInstance = function (element) {
		return $.data(element, namespace);
	};

	Sly.storeInstance = function (element, sly) {
		return $.data(element, namespace, sly);
	};

	Sly.removeInstance = function (element) {
		return $.removeData(element, namespace);
	};

	/**
	 * Return type of the value.
	 *
	 * @param  {Mixed} value
	 *
	 * @return {String}
	 */
	function type(value) {
		if (value == null) {
			return String(value);
		}

		if (typeof value === 'object' || typeof value === 'function') {
			return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
		}

		return typeof value;
	}

	/**
	 * Event preventDefault & stopPropagation helper.
	 *
	 * @param {Event} event     Event object.
	 * @param {Bool}  noBubbles Cancel event bubbling.
	 *
	 * @return {Void}
	 */
	function stopDefault(event, noBubbles) {
		event.preventDefault();
		if (noBubbles) {
			event.stopPropagation();
		}
	}

	/**
	 * Disables an event it was triggered on and unbinds itself.
	 *
	 * @param  {Event} event
	 *
	 * @return {Void}
	 */
	function disableOneEvent(event) {
		/*jshint validthis:true */
		stopDefault(event, 1);
		$(this).off(event.type, disableOneEvent);
	}

	/**
	 * Resets native element scroll values to 0.
	 *
	 * @return {Void}
	 */
	function resetScroll() {
		/*jshint validthis:true */
		this.scrollLeft = 0;
		this.scrollTop = 0;
	}

	/**
	 * Check if variable is a number.
	 *
	 * @param {Mixed} value
	 *
	 * @return {Boolean}
	 */
	function isNumber(value) {
		return !isNaN(parseFloat(value)) && isFinite(value);
	}

	/**
	 * Parse style to pixels.
	 *
	 * @param {Object}   $item    jQuery object with element.
	 * @param {Property} property CSS property to get the pixels from.
	 *
	 * @return {Int}
	 */
	function getPx($item, property) {
		return 0 | round(String($item.css(property)).replace(/[^\-0-9.]/g, ''));
	}

	/**
	 * Make sure that number is within the limits.
	 *
	 * @param {Number} number
	 * @param {Number} min
	 * @param {Number} max
	 *
	 * @return {Number}
	 */
	function within(number, min, max) {
		return number < min ? min : number > max ? max : number;
	}

	/**
	 * Saves element styles for later restoration.
	 *
	 * Example:
	 *   var styles = new StyleRestorer(frame);
	 *   styles.save('position');
	 *   element.style.position = 'absolute';
	 *   styles.restore(); // restores to state before the assignment above
	 *
	 * @param {Element} element
	 */
	function StyleRestorer(element) {
		var self = {};
		self.style = {};
		self.save = function () {
			if (!element || !element.nodeType) return;
			for (var i = 0; i < arguments.length; i++) {
				self.style[arguments[i]] = element.style[arguments[i]];
			}
			return self;
		};
		self.restore = function () {
			if (!element || !element.nodeType) return;
			for (var prop in self.style) {
				if (self.style.hasOwnProperty(prop)) element.style[prop] = self.style[prop];
			}
			return self;
		};
		return self;
	}

	// Local WindowAnimationTiming interface polyfill
	(function (w) {
		rAF = w.requestAnimationFrame
			|| w.webkitRequestAnimationFrame
			|| fallback;

		/**
		* Fallback implementation.
		*/
		var prev = new Date().getTime();
		function fallback(fn) {
			var curr = new Date().getTime();
			var ms = Math.max(0, 16 - (curr - prev));
			var req = setTimeout(fn, ms);
			prev = curr;
			return req;
		}

		/**
		* Cancel.
		*/
		var cancel = w.cancelAnimationFrame
			|| w.webkitCancelAnimationFrame
			|| w.clearTimeout;

		cAF = function(id){
			cancel.call(w, id);
		};
	}(window));

	// Feature detects
	(function () {
		var prefixes = ['', 'Webkit', 'Moz', 'ms', 'O'];
		var el = document.createElement('div');

		function testProp(prop) {
			for (var p = 0, pl = prefixes.length; p < pl; p++) {
				var prefixedProp = prefixes[p] ? prefixes[p] + prop.charAt(0).toUpperCase() + prop.slice(1) : prop;
				if (el.style[prefixedProp] != null) {
					return prefixedProp;
				}
			}
		}

		// Global support indicators
		transform = testProp('transform');
		gpuAcceleration = testProp('perspective') ? 'translateZ(0) ' : '';
	}());

	// Expose class globally
	w[className] = Sly;

	// jQuery proxy
	$.fn[pluginName] = function (options, callbackMap) {
		var method, methodArgs;

		// Attributes logic
		if (!$.isPlainObject(options)) {
			if (type(options) === 'string' || options === false) {
				method = options === false ? 'destroy' : options;
				methodArgs = Array.prototype.slice.call(arguments, 1);
			}
			options = {};
		}

		// Apply to all elements
		return this.each(function (i, element) {
			// Call with prevention against multiple instantiations
			var plugin = Sly.getInstance(element);

			if (!plugin && !method) {
				// Create a new object if it doesn't exist yet
				plugin = new Sly(element, options, callbackMap).init();
			} else if (plugin && method) {
				// Call method
				if (plugin[method]) {
					plugin[method].apply(plugin, methodArgs);
				}
			}
		});
	};

	// Default options
	Sly.defaults = {
		slidee:     null,  // Selector, DOM element, or jQuery object with DOM element representing SLIDEE.
		horizontal: false, // Switch to horizontal mode.

		// Item based navigation
		itemNav:        null,  // Item navigation type. Can be: 'basic', 'centered', 'forceCentered'.
		itemSelector:   null,  // Select only items that match this selector.
		smart:          false, // Repositions the activated item to help with further navigation.
		activateOn:     null,  // Activate an item on this event. Can be: 'click', 'mouseenter', ...
		activateMiddle: false, // Always activate the item in the middle of the FRAME. forceCentered only.

		// Scrolling
		scrollSource: null,  // Element for catching the mouse wheel scrolling. Default is FRAME.
		scrollBy:     0,     // Pixels or items to move per one mouse scroll. 0 to disable scrolling.
		scrollHijack: 300,   // Milliseconds since last wheel event after which it is acceptable to hijack global scroll.
		scrollTrap:   false, // Don't bubble scrolling when hitting scrolling limits.

		// Dragging
		dragSource:    null,  // Selector or DOM element for catching dragging events. Default is FRAME.
		mouseDragging: false, // Enable navigation by dragging the SLIDEE with mouse cursor.
		touchDragging: false, // Enable navigation by dragging the SLIDEE with touch events.
		releaseSwing:  false, // Ease out on dragging swing release.
		swingSpeed:    0.2,   // Swing synchronization speed, where: 1 = instant, 0 = infinite.
		elasticBounds: false, // Stretch SLIDEE position limits when dragging past FRAME boundaries.
		dragThreshold: 3,     // Distance in pixels before Sly recognizes dragging.
		interactive:   null,  // Selector for special interactive elements.

		// Scrollbar
		scrollBar:     null,  // Selector or DOM element for scrollbar container.
		dragHandle:    false, // Whether the scrollbar handle should be draggable.
		dynamicHandle: false, // Scrollbar handle represents the ratio between hidden and visible content.
		minHandleSize: 50,    // Minimal height or width (depends on sly direction) of a handle in pixels.
		clickBar:      false, // Enable navigation by clicking on scrollbar.
		syncSpeed:     0.5,   // Handle => SLIDEE synchronization speed, where: 1 = instant, 0 = infinite.

		// Pagesbar
		pagesBar:       null, // Selector or DOM element for pages bar container.
		activatePageOn: null, // Event used to activate page. Can be: click, mouseenter, ...
		pageBuilder:          // Page item generator.
			function (index) {
				return '<li>' + (index + 1) + '</li>';
			},

		// Navigation buttons
		forward:  null, // Selector or DOM element for "forward movement" button.
		backward: null, // Selector or DOM element for "backward movement" button.
		prev:     null, // Selector or DOM element for "previous item" button.
		next:     null, // Selector or DOM element for "next item" button.
		prevPage: null, // Selector or DOM element for "previous page" button.
		nextPage: null, // Selector or DOM element for "next page" button.

		// Automated cycling
		cycleBy:       null,  // Enable automatic cycling by 'items' or 'pages'.
		cycleInterval: 5000,  // Delay between cycles in milliseconds.
		pauseOnHover:  false, // Pause cycling when mouse hovers over the FRAME.
		startPaused:   false, // Whether to start in paused sate.

		// Mixed options
		moveBy:        300,     // Speed in pixels per second used by forward and backward buttons.
		speed:         0,       // Animations speed in milliseconds. 0 to disable animations.
		easing:        'swing', // Easing for duration based (tweening) animations.
		startAt:       null,    // Starting offset in pixels or items.
		keyboardNavBy: null,    // Enable keyboard navigation by 'items' or 'pages'.

		// Classes
		draggedClass:  'dragged', // Class for dragged elements (like SLIDEE or scrollbar handle).
		activeClass:   'active',  // Class for active items and pages.
		disabledClass: 'disabled' // Class for disabled navigation elements.
	};
}(jQuery, window));
/* End */
;
; /* Start:"a:4:{s:4:"full";s:74:"/bitrix/templates/aspro-allcorp2/vendor/jquery.bxslider.js?161097003766080";s:6:"source";s:58:"/bitrix/templates/aspro-allcorp2/vendor/jquery.bxslider.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/**
 * bxSlider v4.2.12
 * Copyright 2013-2015 Steven Wanderski
 * Written while drinking Belgian ales and listening to jazz
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */

;(function($) {

  var defaults = {

    // GENERAL
    mode: 'horizontal',
    slideSelector: '',
    infiniteLoop: true,
    hideControlOnEnd: false,
    speed: 500,
    easing: null,
    slideMargin: 0,
    startSlide: 0,
    randomStart: false,
    captions: false,
    ticker: false,
    tickerHover: false,
    adaptiveHeight: false,
    adaptiveHeightSpeed: 500,
    video: false,
    useCSS: true,
    preloadImages: 'visible',
    responsive: true,
    slideZIndex: 50,
    wrapperClass: 'bx-wrapper',

    // TOUCH
    touchEnabled: true,
    swipeThreshold: 50,
    oneToOneTouch: true,
    preventDefaultSwipeX: true,
    preventDefaultSwipeY: false,

    // ACCESSIBILITY
    ariaLive: true,
    ariaHidden: true,

    // KEYBOARD
    keyboardEnabled: false,

    // PAGER
    pager: true,
    pagerType: 'full',
    pagerShortSeparator: ' / ',
    pagerSelector: null,
    buildPager: null,
    pagerCustom: null,

    // CONTROLS
    controls: true,
    nextText: 'Next',
    prevText: 'Prev',
    nextSelector: null,
    prevSelector: null,
    autoControls: false,
    startText: 'Start',
    stopText: 'Stop',
    autoControlsCombine: false,
    autoControlsSelector: null,

    // AUTO
    auto: false,
    pause: 4000,
    autoStart: true,
    autoDirection: 'next',
    stopAutoOnClick: false,
    autoHover: false,
    autoDelay: 0,
    autoSlideForOnePage: false,

    // CAROUSEL
    minSlides: 1,
    maxSlides: 1,
    moveSlides: 0,
    slideWidth: 0,
    shrinkItems: false,

    // CALLBACKS
    onSliderLoad: function() { return true; },
    onSlideBefore: function() { return true; },
    onSlideAfter: function() { return true; },
    onSlideNext: function() { return true; },
    onSlidePrev: function() { return true; },
    onSliderResize: function() { return true; },
	onAutoChange: function() { return true; } //calls when auto slides starts and stops
  };

  $.fn.bxSlider = function(options) {

    if (this.length === 0) {
      return this;
    }

    // support multiple elements
    if (this.length > 1) {
      this.each(function() {
        $(this).bxSlider(options);
      });
      return this;
    }

    // create a namespace to be used throughout the plugin
    var slider = {},
    // set a reference to our slider element
    el = this,
    // get the original window dimens (thanks a lot IE)
    windowWidth = $(window).width(),
    windowHeight = $(window).height();

    // Return if slider is already initialized
    if ($(el).data('bxSlider')) { return; }

    /**
     * ===================================================================================
     * = PRIVATE FUNCTIONS
     * ===================================================================================
     */

    /**
     * Initializes namespace settings to be used throughout plugin
     */
    var init = function() {
      // Return if slider is already initialized
      if ($(el).data('bxSlider')) { return; }
      // merge user-supplied options with the defaults
      slider.settings = $.extend({}, defaults, options);
      // parse slideWidth setting
      slider.settings.slideWidth = parseInt(slider.settings.slideWidth);
      // store the original children
      slider.children = el.children(slider.settings.slideSelector);
      // check if actual number of slides is less than minSlides / maxSlides
      if (slider.children.length < slider.settings.minSlides) { slider.settings.minSlides = slider.children.length; }
      if (slider.children.length < slider.settings.maxSlides) { slider.settings.maxSlides = slider.children.length; }
      // if random start, set the startSlide setting to random number
      if (slider.settings.randomStart) { slider.settings.startSlide = Math.floor(Math.random() * slider.children.length); }
      // store active slide information
      slider.active = { index: slider.settings.startSlide };
      // store if the slider is in carousel mode (displaying / moving multiple slides)
      slider.carousel = slider.settings.minSlides > 1 || slider.settings.maxSlides > 1 ? true : false;
      // if carousel, force preloadImages = 'all'
      if (slider.carousel) { slider.settings.preloadImages = 'all'; }
      // calculate the min / max width thresholds based on min / max number of slides
      // used to setup and update carousel slides dimensions
      slider.minThreshold = (slider.settings.minSlides * slider.settings.slideWidth) + ((slider.settings.minSlides - 1) * slider.settings.slideMargin);
      slider.maxThreshold = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1) * slider.settings.slideMargin);
      // store the current state of the slider (if currently animating, working is true)
      slider.working = false;
      // initialize the controls object
      slider.controls = {};
      // initialize an auto interval
      slider.interval = null;
      // determine which property to use for transitions
      slider.animProp = slider.settings.mode === 'vertical' ? 'top' : 'left';
      // determine if hardware acceleration can be used
      slider.usingCSS = slider.settings.useCSS && slider.settings.mode !== 'fade' && (function() {
        // create our test div element
        var div = document.createElement('div'),
        // css transition properties
        props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
        // test for each property
        for (var i = 0; i < props.length; i++) {
          if (div.style[props[i]] !== undefined) {
            slider.cssPrefix = props[i].replace('Perspective', '').toLowerCase();
            slider.animProp = '-' + slider.cssPrefix + '-transform';
            return true;
          }
        }
        return false;
      }());
      // if vertical mode always make maxSlides and minSlides equal
      if (slider.settings.mode === 'vertical') { slider.settings.maxSlides = slider.settings.minSlides; }
      // save original style data
      el.data('origStyle', el.attr('style'));
      el.children(slider.settings.slideSelector).each(function() {
        $(this).data('origStyle', $(this).attr('style'));
      });

      // perform all DOM / CSS modifications
      setup();
    };

    /**
     * Performs all DOM and CSS modifications
     */
    var setup = function() {
      var preloadSelector = slider.children.eq(slider.settings.startSlide); // set the default preload selector (visible)

      // wrap el in a wrapper
      el.wrap('<div class="' + slider.settings.wrapperClass + '"><div class="bx-viewport"></div></div>');
      // store a namespace reference to .bx-viewport
      slider.viewport = el.parent();

      // add aria-live if the setting is enabled and ticker mode is disabled
      if (slider.settings.ariaLive && !slider.settings.ticker) {
        slider.viewport.attr('aria-live', 'polite');
      }
      // add a loading div to display while images are loading
      slider.loader = $('<div class="bx-loading" />');
      slider.viewport.prepend(slider.loader);
      // set el to a massive width, to hold any needed slides
      // also strip any margin and padding from el
      el.css({
        width: slider.settings.mode === 'horizontal' ? (slider.children.length * 1000 + 215) + '%' : 'auto',
        position: 'relative'
      });
      // if using CSS, add the easing property
      if (slider.usingCSS && slider.settings.easing) {
        el.css('-' + slider.cssPrefix + '-transition-timing-function', slider.settings.easing);
      // if not using CSS and no easing value was supplied, use the default JS animation easing (swing)
      } else if (!slider.settings.easing) {
        slider.settings.easing = 'swing';
      }
      // make modifications to the viewport (.bx-viewport)
      slider.viewport.css({
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      });
      slider.viewport.parent().css({
        maxWidth: getViewportMaxWidth()
      });
      // apply css to all slider children
      slider.children.css({
        // the float attribute is a reserved word in compressors like YUI compressor and need to be quoted #48
        'float': slider.settings.mode === 'horizontal' ? 'left' : 'none',
        listStyle: 'none',
        position: 'relative'
      });
      // apply the calculated width after the float is applied to prevent scrollbar interference
      slider.children.css('width', getSlideWidth());
      // if slideMargin is supplied, add the css
      if (slider.settings.mode === 'horizontal' && slider.settings.slideMargin > 0) { slider.children.css('marginRight', slider.settings.slideMargin); }
      if (slider.settings.mode === 'vertical' && slider.settings.slideMargin > 0) { slider.children.css('marginBottom', slider.settings.slideMargin); }
      // if "fade" mode, add positioning and z-index CSS
      if (slider.settings.mode === 'fade') {
        slider.children.css({
          position: 'absolute',
          zIndex: 0,
          display: 'none'
        });
        // prepare the z-index on the showing element
        slider.children.eq(slider.settings.startSlide).css({zIndex: slider.settings.slideZIndex, display: 'block'});
      }
      // create an element to contain all slider controls (pager, start / stop, etc)
      slider.controls.el = $('<div class="bx-controls" />');
      // if captions are requested, add them
      if (slider.settings.captions) { appendCaptions(); }
      // check if startSlide is last slide
      slider.active.last = slider.settings.startSlide === getPagerQty() - 1;
      // if video is true, set up the fitVids plugin
      if (slider.settings.video) { el.fitVids(); }
      if (slider.settings.preloadImages === 'all' || slider.settings.ticker) { preloadSelector = slider.children; }
      // only check for control addition if not in "ticker" mode
      if (!slider.settings.ticker) {
        // if controls are requested, add them
        if (slider.settings.controls) { appendControls(); }
        // if auto is true, and auto controls are requested, add them
        if (slider.settings.auto && slider.settings.autoControls) { appendControlsAuto(); }
        // if pager is requested, add it
        if (slider.settings.pager) { appendPager(); }
        // if any control option is requested, add the controls wrapper
        if (slider.settings.controls || slider.settings.autoControls || slider.settings.pager) { slider.viewport.after(slider.controls.el); }
      // if ticker mode, do not allow a pager
      } else {
        slider.settings.pager = false;
      }
      loadElements(preloadSelector, start);
    };

    var loadElements = function(selector, callback) {
      var total = selector.find('img:not([src=""]), iframe').length,
      count = 0;
      if (total === 0) {
        callback();
        return;
      }
      selector.find('img:not([src=""]), iframe').each(function() {
        $(this).one('load error', function() {
          if (++count === total) { callback(); }
        }).each(function() {
          if (this.complete || this.src == '') { $(this).trigger('load'); }
        });
      });
    };

    /**
     * Start the slider
     */
    var start = function() {
      // if infinite loop, prepare additional slides
      if (slider.settings.infiniteLoop && slider.settings.mode !== 'fade' && !slider.settings.ticker) {
        var slice    = slider.settings.mode === 'vertical' ? slider.settings.minSlides : slider.settings.maxSlides,
        sliceAppend  = slider.children.slice(0, slice).clone(true).addClass('bx-clone'),
        slicePrepend = slider.children.slice(-slice).clone(true).addClass('bx-clone');
        if (slider.settings.ariaHidden) {
          sliceAppend.attr('aria-hidden', true);
          slicePrepend.attr('aria-hidden', true);
        }
        el.append(sliceAppend).prepend(slicePrepend);
      }
      // remove the loading DOM element
      slider.loader.remove();
      // set the left / top position of "el"
      setSlidePosition();
      // if "vertical" mode, always use adaptiveHeight to prevent odd behavior
      if (slider.settings.mode === 'vertical') { slider.settings.adaptiveHeight = true; }
      // set the viewport height
      slider.viewport.height(getViewportHeight());
      // make sure everything is positioned just right (same as a window resize)
      el.redrawSlider();
      // onSliderLoad callback
      slider.settings.onSliderLoad.call(el, slider.active.index);
      // slider has been fully initialized
      slider.initialized = true;
      // bind the resize call to the window
      if (slider.settings.responsive) { $(window).bind('resize', resizeWindow); }
      // if auto is true and has more than 1 page, start the show
      if (slider.settings.auto && slider.settings.autoStart && (getPagerQty() > 1 || slider.settings.autoSlideForOnePage)) { initAuto(); }
      // if ticker is true, start the ticker
      if (slider.settings.ticker) { initTicker(); }
      // if pager is requested, make the appropriate pager link active
      if (slider.settings.pager) { updatePagerActive(slider.settings.startSlide); }
      // check for any updates to the controls (like hideControlOnEnd updates)
      if (slider.settings.controls) { updateDirectionControls(); }
      // if touchEnabled is true, setup the touch events
      if (slider.settings.touchEnabled && !slider.settings.ticker) { initTouch(); }
      // if keyboardEnabled is true, setup the keyboard events
      if (slider.settings.keyboardEnabled && !slider.settings.ticker) {
        $(document).keydown(keyPress);
      }
    };

    /**
     * Returns the calculated height of the viewport, used to determine either adaptiveHeight or the maxHeight value
     */
    var getViewportHeight = function() {
      var height = 0;
      // first determine which children (slides) should be used in our height calculation
      var children = $();
      // if mode is not "vertical" and adaptiveHeight is false, include all children
      if (slider.settings.mode !== 'vertical' && !slider.settings.adaptiveHeight) {
        children = slider.children;
      } else {
        // if not carousel, return the single active child
        if (!slider.carousel) {
          children = slider.children.eq(slider.active.index);
        // if carousel, return a slice of children
        } else {
          // get the individual slide index
          var currentIndex = slider.settings.moveSlides === 1 ? slider.active.index : slider.active.index * getMoveBy();
          // add the current slide to the children
          children = slider.children.eq(currentIndex);
          // cycle through the remaining "showing" slides
          for (i = 1; i <= slider.settings.maxSlides - 1; i++) {
            // if looped back to the start
            if (currentIndex + i >= slider.children.length) {
              children = children.add(slider.children.eq(i - 1));
            } else {
              children = children.add(slider.children.eq(currentIndex + i));
            }
          }
        }
      }
      // if "vertical" mode, calculate the sum of the heights of the children
      if (slider.settings.mode === 'vertical') {
        children.each(function(index) {
          height += $(this).outerHeight();
        });
        // add user-supplied margins
        if (slider.settings.slideMargin > 0) {
          height += slider.settings.slideMargin * (slider.settings.minSlides - 1);
        }
      // if not "vertical" mode, calculate the max height of the children
      } else {
        height = Math.max.apply(Math, children.map(function() {
          return $(this).outerHeight(false);
        }).get());
      }

      if (slider.viewport.css('box-sizing') === 'border-box') {
        height += parseFloat(slider.viewport.css('padding-top')) + parseFloat(slider.viewport.css('padding-bottom')) +
              parseFloat(slider.viewport.css('border-top-width')) + parseFloat(slider.viewport.css('border-bottom-width'));
      } else if (slider.viewport.css('box-sizing') === 'padding-box') {
        height += parseFloat(slider.viewport.css('padding-top')) + parseFloat(slider.viewport.css('padding-bottom'));
      }

      return height;
    };

    /**
     * Returns the calculated width to be used for the outer wrapper / viewport
     */
    var getViewportMaxWidth = function() {
      var width = '100%';
      if (slider.settings.slideWidth > 0) {
        if (slider.settings.mode === 'horizontal') {
          width = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1) * slider.settings.slideMargin);
        } else {
          width = slider.settings.slideWidth;
        }
      }
      return width;
    };

    /**
     * Returns the calculated width to be applied to each slide
     */
    var getSlideWidth = function() {
      var newElWidth = slider.settings.slideWidth, // start with any user-supplied slide width
      wrapWidth      = slider.viewport.width();    // get the current viewport width
      // if slide width was not supplied, or is larger than the viewport use the viewport width
      if (slider.settings.slideWidth === 0 ||
        (slider.settings.slideWidth > wrapWidth && !slider.carousel) ||
        slider.settings.mode === 'vertical') {
        newElWidth = wrapWidth;
      // if carousel, use the thresholds to determine the width
      } else if (slider.settings.maxSlides > 1 && slider.settings.mode === 'horizontal') {
        if (wrapWidth > slider.maxThreshold) {
          return newElWidth;
        } else if (wrapWidth < slider.minThreshold) {
          newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.minSlides - 1))) / slider.settings.minSlides;
        } else if (slider.settings.shrinkItems) {
          newElWidth = Math.floor((wrapWidth + slider.settings.slideMargin) / (Math.ceil((wrapWidth + slider.settings.slideMargin) / (newElWidth + slider.settings.slideMargin))) - slider.settings.slideMargin);
        }
      }
      return newElWidth;
    };

    /**
     * Returns the number of slides currently visible in the viewport (includes partially visible slides)
     */
    var getNumberSlidesShowing = function() {
      var slidesShowing = 1,
      childWidth = null;
      if (slider.settings.mode === 'horizontal' && slider.settings.slideWidth > 0) {
        // if viewport is smaller than minThreshold, return minSlides
        if (slider.viewport.width() < slider.minThreshold) {
          slidesShowing = slider.settings.minSlides;
        // if viewport is larger than maxThreshold, return maxSlides
        } else if (slider.viewport.width() > slider.maxThreshold) {
          slidesShowing = slider.settings.maxSlides;
        // if viewport is between min / max thresholds, divide viewport width by first child width
        } else {
          childWidth = slider.children.first().width() + slider.settings.slideMargin;
          slidesShowing = Math.floor((slider.viewport.width() +
            slider.settings.slideMargin) / childWidth) || 1;
        }
      // if "vertical" mode, slides showing will always be minSlides
      } else if (slider.settings.mode === 'vertical') {
        slidesShowing = slider.settings.minSlides;
      }
      return slidesShowing;
    };

    /**
     * Returns the number of pages (one full viewport of slides is one "page")
     */
    var getPagerQty = function() {
      var pagerQty = 0,
      breakPoint = 0,
      counter = 0;
      // if moveSlides is specified by the user
      if (slider.settings.moveSlides > 0) {
        if (slider.settings.infiniteLoop) {
          pagerQty = Math.ceil(slider.children.length / getMoveBy());
        } else {
          // when breakpoint goes above children length, counter is the number of pages
          while (breakPoint < slider.children.length) {
            ++pagerQty;
            breakPoint = counter + getNumberSlidesShowing();
            counter += slider.settings.moveSlides <= getNumberSlidesShowing() ? slider.settings.moveSlides : getNumberSlidesShowing();
          }
		  return counter;
        }
      // if moveSlides is 0 (auto) divide children length by sides showing, then round up
      } else {
        pagerQty = Math.ceil(slider.children.length / getNumberSlidesShowing());
      }
      return pagerQty;
    };

    /**
     * Returns the number of individual slides by which to shift the slider
     */
    var getMoveBy = function() {
      // if moveSlides was set by the user and moveSlides is less than number of slides showing
      if (slider.settings.moveSlides > 0 && slider.settings.moveSlides <= getNumberSlidesShowing()) {
        return slider.settings.moveSlides;
      }
      // if moveSlides is 0 (auto)
      return getNumberSlidesShowing();
    };

    /**
     * Sets the slider's (el) left or top position
     */
    var setSlidePosition = function() {
      var position, lastChild, lastShowingIndex;
      // if last slide, not infinite loop, and number of children is larger than specified maxSlides
      if (slider.children.length > slider.settings.maxSlides && slider.active.last && !slider.settings.infiniteLoop) {
        if (slider.settings.mode === 'horizontal') {
          // get the last child's position
          lastChild = slider.children.last();
          position = lastChild.position();
          // set the left position
          setPositionProperty(-(position.left - (slider.viewport.width() - lastChild.outerWidth())), 'reset', 0);
        } else if (slider.settings.mode === 'vertical') {
          // get the last showing index's position
          lastShowingIndex = slider.children.length - slider.settings.minSlides;
          position = slider.children.eq(lastShowingIndex).position();
          // set the top position
          setPositionProperty(-position.top, 'reset', 0);
        }
      // if not last slide
      } else {
        // get the position of the first showing slide
        position = slider.children.eq(slider.active.index * getMoveBy()).position();
        // check for last slide
        if (slider.active.index === getPagerQty() - 1) { slider.active.last = true; }
        // set the respective position
        if (position !== undefined) {
          if (slider.settings.mode === 'horizontal') { setPositionProperty(-position.left, 'reset', 0); }
          else if (slider.settings.mode === 'vertical') { setPositionProperty(-position.top, 'reset', 0); }
        }
      }
    };

    /**
     * Sets the el's animating property position (which in turn will sometimes animate el).
     * If using CSS, sets the transform property. If not using CSS, sets the top / left property.
     *
     * @param value (int)
     *  - the animating property's value
     *
     * @param type (string) 'slide', 'reset', 'ticker'
     *  - the type of instance for which the function is being
     *
     * @param duration (int)
     *  - the amount of time (in ms) the transition should occupy
     *
     * @param params (array) optional
     *  - an optional parameter containing any variables that need to be passed in
     */
    var setPositionProperty = function(value, type, duration, params) {
      var animateObj, propValue;
      // use CSS transform
      if (slider.usingCSS) {
        // determine the translate3d value
        propValue = slider.settings.mode === 'vertical' ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
        // add the CSS transition-duration
        el.css('-' + slider.cssPrefix + '-transition-duration', duration / 1000 + 's');
        if (type === 'slide') {
          // set the property value
          el.css(slider.animProp, propValue);
          if (duration !== 0) {
            // bind a callback method - executes when CSS transition completes
            el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(e) {
              //make sure it's the correct one
              if (!$(e.target).is(el)) { return; }
              // unbind the callback
              el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
              updateAfterSlideTransition();
            });
          } else { //duration = 0
            updateAfterSlideTransition();
          }
        } else if (type === 'reset') {
          el.css(slider.animProp, propValue);
        } else if (type === 'ticker') {
          // make the transition use 'linear'
          el.css('-' + slider.cssPrefix + '-transition-timing-function', 'linear');
          el.css(slider.animProp, propValue);
          if (duration !== 0) {
            el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(e) {
              //make sure it's the correct one
              if (!$(e.target).is(el)) { return; }
              // unbind the callback
              el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
              // reset the position
              setPositionProperty(params.resetValue, 'reset', 0);
              // start the loop again
              tickerLoop();
            });
          } else { //duration = 0
            setPositionProperty(params.resetValue, 'reset', 0);
            tickerLoop();
          }
        }
      // use JS animate
      } else {
        animateObj = {};
        animateObj[slider.animProp] = value;
        if (type === 'slide') {
          el.animate(animateObj, duration, slider.settings.easing, function() {
            updateAfterSlideTransition();
          });
        } else if (type === 'reset') {
          el.css(slider.animProp, value);
        } else if (type === 'ticker') {
          el.animate(animateObj, duration, 'linear', function() {
            setPositionProperty(params.resetValue, 'reset', 0);
            // run the recursive loop after animation
            tickerLoop();
          });
        }
      }
    };

    /**
     * Populates the pager with proper amount of pages
     */
    var populatePager = function() {
      var pagerHtml = '',
      linkContent = '',
      pagerQty = getPagerQty();
      // loop through each pager item
      for (var i = 0; i < pagerQty; i++) {
        linkContent = '';
        // if a buildPager function is supplied, use it to get pager link value, else use index + 1
        if (slider.settings.buildPager && $.isFunction(slider.settings.buildPager) || slider.settings.pagerCustom) {
          linkContent = slider.settings.buildPager(i);
          slider.pagerEl.addClass('bx-custom-pager');
        } else {
          linkContent = i + 1;
          slider.pagerEl.addClass('bx-default-pager');
        }
        // var linkContent = slider.settings.buildPager && $.isFunction(slider.settings.buildPager) ? slider.settings.buildPager(i) : i + 1;
        // add the markup to the string
        pagerHtml += '<div class="bx-pager-item"><a href="" data-slide-index="' + i + '" class="bx-pager-link">' + linkContent + '</a></div>';
      }
      // populate the pager element with pager links
      slider.pagerEl.html(pagerHtml);
    };

    /**
     * Appends the pager to the controls element
     */
    var appendPager = function() {
      if (!slider.settings.pagerCustom) {
        // create the pager DOM element
        slider.pagerEl = $('<div class="bx-pager" />');
        // if a pager selector was supplied, populate it with the pager
        if (slider.settings.pagerSelector) {
          $(slider.settings.pagerSelector).html(slider.pagerEl);
        // if no pager selector was supplied, add it after the wrapper
        } else {
          slider.controls.el.addClass('bx-has-pager').append(slider.pagerEl);
        }
        // populate the pager
        populatePager();
      } else {
        slider.pagerEl = $(slider.settings.pagerCustom);
      }
      // assign the pager click binding
      slider.pagerEl.on('click touchend', 'a', clickPagerBind);
    };

    /**
     * Appends prev / next controls to the controls element
     */
    var appendControls = function() {
      slider.controls.next = $('<a class="bx-next" href="">' + slider.settings.nextText + '</a>');
      slider.controls.prev = $('<a class="bx-prev" href="">' + slider.settings.prevText + '</a>');
      // bind click actions to the controls
      slider.controls.next.bind('click touchend', clickNextBind);
      slider.controls.prev.bind('click touchend', clickPrevBind);
      // if nextSelector was supplied, populate it
      if (slider.settings.nextSelector) {
        $(slider.settings.nextSelector).append(slider.controls.next);
      }
      // if prevSelector was supplied, populate it
      if (slider.settings.prevSelector) {
        $(slider.settings.prevSelector).append(slider.controls.prev);
      }
      // if no custom selectors were supplied
      if (!slider.settings.nextSelector && !slider.settings.prevSelector) {
        // add the controls to the DOM
        slider.controls.directionEl = $('<div class="bx-controls-direction" />');
        // add the control elements to the directionEl
        slider.controls.directionEl.append(slider.controls.prev).append(slider.controls.next);
        // slider.viewport.append(slider.controls.directionEl);
        slider.controls.el.addClass('bx-has-controls-direction').append(slider.controls.directionEl);
      }
    };

    /**
     * Appends start / stop auto controls to the controls element
     */
    var appendControlsAuto = function() {
      slider.controls.start = $('<div class="bx-controls-auto-item"><a class="bx-start" href="">' + slider.settings.startText + '</a></div>');
      slider.controls.stop = $('<div class="bx-controls-auto-item"><a class="bx-stop" href="">' + slider.settings.stopText + '</a></div>');
      // add the controls to the DOM
      slider.controls.autoEl = $('<div class="bx-controls-auto" />');
      // bind click actions to the controls
      slider.controls.autoEl.on('click', '.bx-start', clickStartBind);
      slider.controls.autoEl.on('click', '.bx-stop', clickStopBind);
      // if autoControlsCombine, insert only the "start" control
      if (slider.settings.autoControlsCombine) {
        slider.controls.autoEl.append(slider.controls.start);
      // if autoControlsCombine is false, insert both controls
      } else {
        slider.controls.autoEl.append(slider.controls.start).append(slider.controls.stop);
      }
      // if auto controls selector was supplied, populate it with the controls
      if (slider.settings.autoControlsSelector) {
        $(slider.settings.autoControlsSelector).html(slider.controls.autoEl);
      // if auto controls selector was not supplied, add it after the wrapper
      } else {
        slider.controls.el.addClass('bx-has-controls-auto').append(slider.controls.autoEl);
      }
      // update the auto controls
      updateAutoControls(slider.settings.autoStart ? 'stop' : 'start');
    };

    /**
     * Appends image captions to the DOM
     */
    var appendCaptions = function() {
      // cycle through each child
      slider.children.each(function(index) {
        // get the image title attribute
        var title = $(this).find('img:first').attr('title');
        // append the caption
        if (title !== undefined && ('' + title).length) {
          $(this).append('<div class="bx-caption"><span>' + title + '</span></div>');
        }
      });
    };

    /**
     * Click next binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickNextBind = function(e) {
      e.preventDefault();
      if (slider.controls.el.hasClass('disabled')) { return; }
      // if auto show is running, stop it
      if (slider.settings.auto && slider.settings.stopAutoOnClick) { el.stopAuto(); }
      el.goToNextSlide();
    };

    /**
     * Click prev binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickPrevBind = function(e) {
      e.preventDefault();
      if (slider.controls.el.hasClass('disabled')) { return; }
      // if auto show is running, stop it
      if (slider.settings.auto && slider.settings.stopAutoOnClick) { el.stopAuto(); }
      el.goToPrevSlide();
    };

    /**
     * Click start binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickStartBind = function(e) {
      el.startAuto();
      e.preventDefault();
    };

    /**
     * Click stop binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickStopBind = function(e) {
      el.stopAuto();
      e.preventDefault();
    };

    /**
     * Click pager binding
     *
     * @param e (event)
     *  - DOM event object
     */
    var clickPagerBind = function(e) {
      var pagerLink, pagerIndex;
      e.preventDefault();
      if (slider.controls.el.hasClass('disabled')) {
        return;
      }
      // if auto show is running, stop it
      if (slider.settings.auto  && slider.settings.stopAutoOnClick) { el.stopAuto(); }
      pagerLink = $(e.currentTarget);
      if (pagerLink.attr('data-slide-index') !== undefined) {
        pagerIndex = parseInt(pagerLink.attr('data-slide-index'));
        // if clicked pager link is not active, continue with the goToSlide call
        if (pagerIndex !== slider.active.index) { el.goToSlide(pagerIndex); }
      }
    };

    /**
     * Updates the pager links with an active class
     *
     * @param slideIndex (int)
     *  - index of slide to make active
     */
    var updatePagerActive = function(slideIndex) {
      // if "short" pager type
      var len = slider.children.length; // nb of children
      if (slider.settings.pagerType === 'short') {
        if (slider.settings.maxSlides > 1) {
          len = Math.ceil(slider.children.length / slider.settings.maxSlides);
        }
        slider.pagerEl.html((slideIndex + 1) + slider.settings.pagerShortSeparator + len);
        return;
      }
      // remove all pager active classes
      slider.pagerEl.find('a').removeClass('active');
      // apply the active class for all pagers
      slider.pagerEl.each(function(i, el) { $(el).find('a').eq(slideIndex).addClass('active'); });
    };

    /**
     * Performs needed actions after a slide transition
     */
    var updateAfterSlideTransition = function() {
      // if infinite loop is true
      if (slider.settings.infiniteLoop) {
        var position = '';
        // first slide
        if (slider.active.index === 0) {
          // set the new position
          position = slider.children.eq(0).position();
        // carousel, last slide
        } else if (slider.active.index === getPagerQty() - 1 && slider.carousel) {
          position = slider.children.eq((getPagerQty() - 1) * getMoveBy()).position();
        // last slide
        } else if (slider.active.index === slider.children.length - 1) {
          position = slider.children.eq(slider.children.length - 1).position();
        }
        if (position) {
          if (slider.settings.mode === 'horizontal') { setPositionProperty(-position.left, 'reset', 0); }
          else if (slider.settings.mode === 'vertical') { setPositionProperty(-position.top, 'reset', 0); }
        }
      }
      // declare that the transition is complete
      slider.working = false;
      // onSlideAfter callback
      slider.settings.onSlideAfter.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
    };

    /**
     * Updates the auto controls state (either active, or combined switch)
     *
     * @param state (string) "start", "stop"
     *  - the new state of the auto show
     */
    var updateAutoControls = function(state) {
      // if autoControlsCombine is true, replace the current control with the new state
      if (slider.settings.autoControlsCombine) {
        slider.controls.autoEl.html(slider.controls[state]);
      // if autoControlsCombine is false, apply the "active" class to the appropriate control
      } else {
        slider.controls.autoEl.find('a').removeClass('active');
        slider.controls.autoEl.find('a:not(.bx-' + state + ')').addClass('active');
      }
    };

    /**
     * Updates the direction controls (checks if either should be hidden)
     */
    var updateDirectionControls = function() {
      if (getPagerQty() === 1) {
        slider.controls.prev.addClass('disabled');
        slider.controls.next.addClass('disabled');
      } else if (!slider.settings.infiniteLoop && slider.settings.hideControlOnEnd) {
        // if first slide
        if (slider.active.index === 0) {
          slider.controls.prev.addClass('disabled');
          slider.controls.next.removeClass('disabled');
        // if last slide
        } else if (slider.active.index === getPagerQty() - 1) {
          slider.controls.next.addClass('disabled');
          slider.controls.prev.removeClass('disabled');
        // if any slide in the middle
        } else {
          slider.controls.prev.removeClass('disabled');
          slider.controls.next.removeClass('disabled');
        }
      }
    };
	/* auto start and stop functions */
	var windowFocusHandler = function() { el.startAuto(); };
	var windowBlurHandler = function() { el.stopAuto(); };
    /**
     * Initializes the auto process
     */
    var initAuto = function() {
      // if autoDelay was supplied, launch the auto show using a setTimeout() call
      if (slider.settings.autoDelay > 0) {
        var timeout = setTimeout(el.startAuto, slider.settings.autoDelay);
      // if autoDelay was not supplied, start the auto show normally
      } else {
        el.startAuto();

        //add focus and blur events to ensure its running if timeout gets paused
        $(window).focus(windowFocusHandler).blur(windowBlurHandler);
      }
      // if autoHover is requested
      if (slider.settings.autoHover) {
        // on el hover
        el.hover(function() {
          // if the auto show is currently playing (has an active interval)
          if (slider.interval) {
            // stop the auto show and pass true argument which will prevent control update
            el.stopAuto(true);
            // create a new autoPaused value which will be used by the relative "mouseout" event
            slider.autoPaused = true;
          }
        }, function() {
          // if the autoPaused value was created be the prior "mouseover" event
          if (slider.autoPaused) {
            // start the auto show and pass true argument which will prevent control update
            el.startAuto(true);
            // reset the autoPaused value
            slider.autoPaused = null;
          }
        });
      }
    };

    /**
     * Initializes the ticker process
     */
    var initTicker = function() {
      var startPosition = 0,
      position, transform, value, idx, ratio, property, newSpeed, totalDimens;
      // if autoDirection is "next", append a clone of the entire slider
      if (slider.settings.autoDirection === 'next') {
        el.append(slider.children.clone().addClass('bx-clone'));
      // if autoDirection is "prev", prepend a clone of the entire slider, and set the left position
      } else {
        el.prepend(slider.children.clone().addClass('bx-clone'));
        position = slider.children.first().position();
        startPosition = slider.settings.mode === 'horizontal' ? -position.left : -position.top;
      }
      setPositionProperty(startPosition, 'reset', 0);
      // do not allow controls in ticker mode
      slider.settings.pager = false;
      slider.settings.controls = false;
      slider.settings.autoControls = false;
      // if autoHover is requested
      if (slider.settings.tickerHover) {
        if (slider.usingCSS) {
          idx = slider.settings.mode === 'horizontal' ? 4 : 5;
          slider.viewport.hover(function() {
            transform = el.css('-' + slider.cssPrefix + '-transform');
            value = parseFloat(transform.split(',')[idx]);
            setPositionProperty(value, 'reset', 0);
          }, function() {
            totalDimens = 0;
            slider.children.each(function(index) {
              totalDimens += slider.settings.mode === 'horizontal' ? $(this).outerWidth(true) : $(this).outerHeight(true);
            });
            // calculate the speed ratio (used to determine the new speed to finish the paused animation)
            ratio = slider.settings.speed / totalDimens;
            // determine which property to use
            property = slider.settings.mode === 'horizontal' ? 'left' : 'top';
            // calculate the new speed
            newSpeed = ratio * (totalDimens - (Math.abs(parseInt(value))));
            tickerLoop(newSpeed);
          });
        } else {
          // on el hover
          slider.viewport.hover(function() {
            el.stop();
          }, function() {
            // calculate the total width of children (used to calculate the speed ratio)
            totalDimens = 0;
            slider.children.each(function(index) {
              totalDimens += slider.settings.mode === 'horizontal' ? $(this).outerWidth(true) : $(this).outerHeight(true);
            });
            // calculate the speed ratio (used to determine the new speed to finish the paused animation)
            ratio = slider.settings.speed / totalDimens;
            // determine which property to use
            property = slider.settings.mode === 'horizontal' ? 'left' : 'top';
            // calculate the new speed
            newSpeed = ratio * (totalDimens - (Math.abs(parseInt(el.css(property)))));
            tickerLoop(newSpeed);
          });
        }
      }
      // start the ticker loop
      tickerLoop();
    };

    /**
     * Runs a continuous loop, news ticker-style
     */
    var tickerLoop = function(resumeSpeed) {
      var speed = resumeSpeed ? resumeSpeed : slider.settings.speed,
      position = {left: 0, top: 0},
      reset = {left: 0, top: 0},
      animateProperty, resetValue, params;

      // if "next" animate left position to last child, then reset left to 0
      if (slider.settings.autoDirection === 'next') {
        position = el.find('.bx-clone').first().position();
      // if "prev" animate left position to 0, then reset left to first non-clone child
      } else {
        reset = slider.children.first().position();
      }
      animateProperty = slider.settings.mode === 'horizontal' ? -position.left : -position.top;
      resetValue = slider.settings.mode === 'horizontal' ? -reset.left : -reset.top;
      params = {resetValue: resetValue};
      setPositionProperty(animateProperty, 'ticker', speed, params);
    };

    /**
     * Check if el is on screen
     */
    var isOnScreen = function(el) {
      var win = $(window),
      viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft()
      },
      bounds = el.offset();

      viewport.right = viewport.left + win.width();
      viewport.bottom = viewport.top + win.height();
      bounds.right = bounds.left + el.outerWidth();
      bounds.bottom = bounds.top + el.outerHeight();

      return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
    };

    /**
     * Initializes keyboard events
     */
    var keyPress = function(e) {
      var activeElementTag = document.activeElement.tagName.toLowerCase(),
      tagFilters = 'input|textarea',
      p = new RegExp(activeElementTag,['i']),
      result = p.exec(tagFilters);

      if (result == null && isOnScreen(el)) {
        if (e.keyCode === 39) {
          clickNextBind(e);
          return false;
        } else if (e.keyCode === 37) {
          clickPrevBind(e);
          return false;
        }
      }
    };

    /**
     * Initializes touch events
     */
    var initTouch = function() {
      // initialize object to contain all touch values
      slider.touch = {
        start: {x: 0, y: 0},
        end: {x: 0, y: 0}
      };
      slider.viewport.bind('touchstart MSPointerDown pointerdown', onTouchStart);

      //for browsers that have implemented pointer events and fire a click after
      //every pointerup regardless of whether pointerup is on same screen location as pointerdown or not
      slider.viewport.on('click', '.bxslider a', function(e) {
        if (slider.viewport.hasClass('click-disabled')) {
          e.preventDefault();
          slider.viewport.removeClass('click-disabled');
        }
      });
    };

    /**
     * Event handler for "touchstart"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchStart = function(e) {
      //disable slider controls while user is interacting with slides to avoid slider freeze that happens on touch devices when a slide swipe happens immediately after interacting with slider controls
      slider.controls.el.addClass('disabled');

      if (slider.working) {
        e.preventDefault();
        slider.controls.el.removeClass('disabled');
      } else {
        // record the original position when touch starts
        slider.touch.originalPos = el.position();
        var orig = e.originalEvent,
        touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig];
        // record the starting touch x, y coordinates
        slider.touch.start.x = touchPoints[0].pageX;
        slider.touch.start.y = touchPoints[0].pageY;

        var chromePointerEvents = typeof PointerEvent === 'function'; if (chromePointerEvents) { if (orig.pointerId === undefined) { return; } }
        if (slider.viewport.get(0).setPointerCapture) {
          slider.pointerId = orig.pointerId;
          slider.viewport.get(0).setPointerCapture(slider.pointerId);
        }
        // bind a "touchmove" event to the viewport
        slider.viewport.bind('touchmove MSPointerMove pointermove', onTouchMove);
        // bind a "touchend" event to the viewport
        slider.viewport.bind('touchend MSPointerUp pointerup', onTouchEnd);
        slider.viewport.bind('MSPointerCancel pointercancel', onPointerCancel);
      }
    };

    /**
     * Cancel Pointer for Windows Phone
     *
     * @param e (event)
     *  - DOM event object
     */
    var onPointerCancel = function(e) {
      /* onPointerCancel handler is needed to deal with situations when a touchend
      doesn't fire after a touchstart (this happens on windows phones only) */
      setPositionProperty(slider.touch.originalPos.left, 'reset', 0);

      //remove handlers
      slider.controls.el.removeClass('disabled');
      slider.viewport.unbind('MSPointerCancel pointercancel', onPointerCancel);
      slider.viewport.unbind('touchmove MSPointerMove pointermove', onTouchMove);
      slider.viewport.unbind('touchend MSPointerUp pointerup', onTouchEnd);
      if (slider.viewport.get(0).releasePointerCapture) {
        slider.viewport.get(0).releasePointerCapture(slider.pointerId);
      }
    };

    /**
     * Event handler for "touchmove"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchMove = function(e) {
      var orig = e.originalEvent,
      touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig],
      // if scrolling on y axis, do not prevent default
      xMovement = Math.abs(touchPoints[0].pageX - slider.touch.start.x),
      yMovement = Math.abs(touchPoints[0].pageY - slider.touch.start.y),
      value = 0,
      change = 0;

      // x axis swipe
      if ((xMovement * 3) > yMovement && slider.settings.preventDefaultSwipeX) {
        e.preventDefault();
      // y axis swipe
      } else if ((yMovement * 3) > xMovement && slider.settings.preventDefaultSwipeY) {
        e.preventDefault();
      }
      if (slider.settings.mode !== 'fade' && slider.settings.oneToOneTouch) {
        // if horizontal, drag along x axis
        if (slider.settings.mode === 'horizontal') {
          change = touchPoints[0].pageX - slider.touch.start.x;
          value = slider.touch.originalPos.left + change;
        // if vertical, drag along y axis
        } else {
          change = touchPoints[0].pageY - slider.touch.start.y;
          value = slider.touch.originalPos.top + change;
        }
        setPositionProperty(value, 'reset', 0);
      }
    };

    /**
     * Event handler for "touchend"
     *
     * @param e (event)
     *  - DOM event object
     */
    var onTouchEnd = function(e) {
      slider.viewport.unbind('touchmove MSPointerMove pointermove', onTouchMove);
      //enable slider controls as soon as user stops interacing with slides
      slider.controls.el.removeClass('disabled');
      var orig    = e.originalEvent,
      touchPoints = (typeof orig.changedTouches !== 'undefined') ? orig.changedTouches : [orig],
      value       = 0,
      distance    = 0;
      // record end x, y positions
      slider.touch.end.x = touchPoints[0].pageX;
      slider.touch.end.y = touchPoints[0].pageY;
      // if fade mode, check if absolute x distance clears the threshold
      if (slider.settings.mode === 'fade') {
        distance = Math.abs(slider.touch.start.x - slider.touch.end.x);
        if (distance >= slider.settings.swipeThreshold) {
          if (slider.touch.start.x > slider.touch.end.x) {
            el.goToNextSlide();
          } else {
            el.goToPrevSlide();
          }
          el.stopAuto();
        }
      // not fade mode
      } else {
        // calculate distance and el's animate property
        if (slider.settings.mode === 'horizontal') {
          distance = slider.touch.end.x - slider.touch.start.x;
          value = slider.touch.originalPos.left;
        } else {
          distance = slider.touch.end.y - slider.touch.start.y;
          value = slider.touch.originalPos.top;
        }
        // if not infinite loop and first / last slide, do not attempt a slide transition
        if (!slider.settings.infiniteLoop && ((slider.active.index === 0 && distance > 0) || (slider.active.last && distance < 0))) {
          setPositionProperty(value, 'reset', 200);
        } else {
          // check if distance clears threshold
          if (Math.abs(distance) >= slider.settings.swipeThreshold) {
            if (distance < 0) {
              el.goToNextSlide();
            } else {
              el.goToPrevSlide();
            }
            el.stopAuto();
          } else {
            // el.animate(property, 200);
            setPositionProperty(value, 'reset', 200);
          }
        }
      }
      slider.viewport.unbind('touchend MSPointerUp pointerup', onTouchEnd);
      if (slider.viewport.get(0).releasePointerCapture) {
        slider.viewport.get(0).releasePointerCapture(slider.pointerId);
      }
    };

    /**
     * Window resize event callback
     */
    var resizeWindow = function(e) {
      // don't do anything if slider isn't initialized.
      if (!slider.initialized) { return; }
      // Delay if slider working.
      if (slider.working) {
        window.setTimeout(resizeWindow, 10);
      } else {
        // get the new window dimens (again, thank you IE)
        var windowWidthNew = $(window).width(),
        windowHeightNew = $(window).height();
        // make sure that it is a true window resize
        // *we must check this because our dinosaur friend IE fires a window resize event when certain DOM elements
        // are resized. Can you just die already?*
        if (windowWidth !== windowWidthNew || windowHeight !== windowHeightNew) {
          // set the new window dimens
          windowWidth = windowWidthNew;
          windowHeight = windowHeightNew;
          // update all dynamic elements
          el.redrawSlider();
          // Call user resize handler
          slider.settings.onSliderResize.call(el, slider.active.index);
        }
      }
    };

    /**
     * Adds an aria-hidden=true attribute to each element
     *
     * @param startVisibleIndex (int)
     *  - the first visible element's index
     */
    var applyAriaHiddenAttributes = function(startVisibleIndex) {
      var numberOfSlidesShowing = getNumberSlidesShowing();
      // only apply attributes if the setting is enabled and not in ticker mode
      if (slider.settings.ariaHidden && !slider.settings.ticker) {
        // add aria-hidden=true to all elements
        slider.children.attr('aria-hidden', 'true');
        // get the visible elements and change to aria-hidden=false
        slider.children.slice(startVisibleIndex, startVisibleIndex + numberOfSlidesShowing).attr('aria-hidden', 'false');
      }
    };

    /**
     * Returns index according to present page range
     *
     * @param slideOndex (int)
     *  - the desired slide index
     */
    var setSlideIndex = function(slideIndex) {
      if (slideIndex < 0) {
        if (slider.settings.infiniteLoop) {
          return getPagerQty() - 1;
        }else {
          //we don't go to undefined slides
          return slider.active.index;
        }
      // if slideIndex is greater than children length, set active index to 0 (this happens during infinite loop)
      } else if (slideIndex >= getPagerQty()) {
        if (slider.settings.infiniteLoop) {
          return 0;
        } else {
          //we don't move to undefined pages
          return slider.active.index;
        }
      // set active index to requested slide
      } else {
        return slideIndex;
      }
    };

    /**
     * ===================================================================================
     * = PUBLIC FUNCTIONS
     * ===================================================================================
     */

    /**
     * Performs slide transition to the specified slide
     *
     * @param slideIndex (int)
     *  - the destination slide's index (zero-based)
     *
     * @param direction (string)
     *  - INTERNAL USE ONLY - the direction of travel ("prev" / "next")
     */
    el.goToSlide = function(slideIndex, direction) {
      // onSlideBefore, onSlideNext, onSlidePrev callbacks
      // Allow transition canceling based on returned value
      var performTransition = true,
      moveBy = 0,
      position = {left: 0, top: 0},
      lastChild = null,
      lastShowingIndex, eq, value, requestEl;
      // store the old index
      slider.oldIndex = slider.active.index;
      //set new index
      slider.active.index = setSlideIndex(slideIndex);

      // if plugin is currently in motion, ignore request
      if (slider.working || slider.active.index === slider.oldIndex) { return; }
      // declare that plugin is in motion
      slider.working = true;

      performTransition = slider.settings.onSlideBefore.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);

      // If transitions canceled, reset and return
      if (typeof (performTransition) !== 'undefined' && !performTransition) {
        slider.active.index = slider.oldIndex; // restore old index
        slider.working = false; // is not in motion
        return;
      }

      if (direction === 'next') {
        // Prevent canceling in future functions or lack there-of from negating previous commands to cancel
        if (!slider.settings.onSlideNext.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index)) {
          performTransition = false;
        }
      } else if (direction === 'prev') {
        // Prevent canceling in future functions or lack there-of from negating previous commands to cancel
        if (!slider.settings.onSlidePrev.call(el, slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index)) {
          performTransition = false;
        }
      }

      // check if last slide
      slider.active.last = slider.active.index >= getPagerQty() - 1;
      // update the pager with active class
      if (slider.settings.pager || slider.settings.pagerCustom) { updatePagerActive(slider.active.index); }
      // // check for direction control update
      if (slider.settings.controls) { updateDirectionControls(); }
      // if slider is set to mode: "fade"
      if (slider.settings.mode === 'fade') {
        // if adaptiveHeight is true and next height is different from current height, animate to the new height
        if (slider.settings.adaptiveHeight && slider.viewport.height() !== getViewportHeight()) {
          slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
        }
        // fade out the visible child and reset its z-index value
        slider.children.filter(':visible').fadeOut(slider.settings.speed).css({zIndex: 0});
        // fade in the newly requested slide
        slider.children.eq(slider.active.index).css('zIndex', slider.settings.slideZIndex + 1).fadeIn(slider.settings.speed, function() {
          $(this).css('zIndex', slider.settings.slideZIndex);
          updateAfterSlideTransition();
        });
      // slider mode is not "fade"
      } else {
        // if adaptiveHeight is true and next height is different from current height, animate to the new height
        if (slider.settings.adaptiveHeight && slider.viewport.height() !== getViewportHeight()) {
          slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
        }
        // if carousel and not infinite loop
        if (!slider.settings.infiniteLoop && slider.carousel && slider.active.last) {
          if (slider.settings.mode === 'horizontal') {
            // get the last child position
            lastChild = slider.children.eq(slider.children.length - 1);
            position = lastChild.position();
            // calculate the position of the last slide
            moveBy = slider.viewport.width() - lastChild.outerWidth();
          } else {
            // get last showing index position
            lastShowingIndex = slider.children.length - slider.settings.minSlides;
            position = slider.children.eq(lastShowingIndex).position();
          }
          // horizontal carousel, going previous while on first slide (infiniteLoop mode)
        } else if (slider.carousel && slider.active.last && direction === 'prev') {
          // get the last child position
          eq = slider.settings.moveSlides === 1 ? slider.settings.maxSlides - getMoveBy() : ((getPagerQty() - 1) * getMoveBy()) - (slider.children.length - slider.settings.maxSlides);
          lastChild = el.children('.bx-clone').eq(eq);
          position = lastChild.position();
        // if infinite loop and "Next" is clicked on the last slide
        } else if (direction === 'next' && slider.active.index === 0) {
          // get the last clone position
          position = el.find('> .bx-clone').eq(slider.settings.maxSlides).position();
          slider.active.last = false;
        // normal non-zero requests
        } else if (slideIndex >= 0) {
          //parseInt is applied to allow floats for slides/page
          requestEl = slideIndex * parseInt(getMoveBy());
          position = slider.children.eq(requestEl).position();
        }

        /* If the position doesn't exist
         * (e.g. if you destroy the slider on a next click),
         * it doesn't throw an error.
         */
        if (typeof (position) !== 'undefined') {
          value = slider.settings.mode === 'horizontal' ? -(position.left - moveBy) : -position.top;
          // plugin values to be animated
          setPositionProperty(value, 'slide', slider.settings.speed);
        }
        slider.working = false;
      }
      if (slider.settings.ariaHidden) { applyAriaHiddenAttributes(slider.active.index * getMoveBy()); }
    };

    /**
     * Transitions to the next slide in the show
     */
    el.goToNextSlide = function() {
      // if infiniteLoop is false and last page is showing, disregard call
      if (!slider.settings.infiniteLoop && slider.active.last) { return; }
	  if (slider.working == true){ return ;}
      var pagerIndex = parseInt(slider.active.index) + 1;
      el.goToSlide(pagerIndex, 'next');
    };

    /**
     * Transitions to the prev slide in the show
     */
    el.goToPrevSlide = function() {
      // if infiniteLoop is false and last page is showing, disregard call
      if (!slider.settings.infiniteLoop && slider.active.index === 0) { return; }
	  if (slider.working == true){ return ;}
      var pagerIndex = parseInt(slider.active.index) - 1;
      el.goToSlide(pagerIndex, 'prev');
    };

    /**
     * Starts the auto show
     *
     * @param preventControlUpdate (boolean)
     *  - if true, auto controls state will not be updated
     */
    el.startAuto = function(preventControlUpdate) {
      // if an interval already exists, disregard call
      if (slider.interval) { return; }
      // create an interval
      slider.interval = setInterval(function() {
        if (slider.settings.autoDirection === 'next') {
          el.goToNextSlide();
        } else {
          el.goToPrevSlide();
        }
      }, slider.settings.pause);
	  //allback for when the auto rotate status changes
	  slider.settings.onAutoChange.call(el, true);
      // if auto controls are displayed and preventControlUpdate is not true
      if (slider.settings.autoControls && preventControlUpdate !== true) { updateAutoControls('stop'); }
    };

    /**
     * Stops the auto show
     *
     * @param preventControlUpdate (boolean)
     *  - if true, auto controls state will not be updated
     */
    el.stopAuto = function(preventControlUpdate) {
      // if no interval exists, disregard call
      if (!slider.interval) { return; }
      // clear the interval
      clearInterval(slider.interval);
      slider.interval = null;
	  //allback for when the auto rotate status changes
	  slider.settings.onAutoChange.call(el, false);
      // if auto controls are displayed and preventControlUpdate is not true
      if (slider.settings.autoControls && preventControlUpdate !== true) { updateAutoControls('start'); }
    };

    /**
     * Returns current slide index (zero-based)
     */
    el.getCurrentSlide = function() {
      return slider.active.index;
    };

    /**
     * Returns current slide element
     */
    el.getCurrentSlideElement = function() {
      return slider.children.eq(slider.active.index);
    };

    /**
     * Returns a slide element
     * @param index (int)
     *  - The index (zero-based) of the element you want returned.
     */
    el.getSlideElement = function(index) {
      return slider.children.eq(index);
    };

    /**
     * Returns number of slides in show
     */
    el.getSlideCount = function() {
      return slider.children.length;
    };

    /**
     * Return slider.working variable
     */
    el.isWorking = function() {
      return slider.working;
    };

    /**
     * Update all dynamic slider elements
     */
    el.redrawSlider = function() {
      // resize all children in ratio to new screen size
      slider.children.add(el.find('.bx-clone')).outerWidth(getSlideWidth());
      // adjust the height
      slider.viewport.css('height', getViewportHeight());
      // update the slide position
      if (!slider.settings.ticker) { setSlidePosition(); }
      // if active.last was true before the screen resize, we want
      // to keep it last no matter what screen size we end on
      if (slider.active.last) { slider.active.index = getPagerQty() - 1; }
      // if the active index (page) no longer exists due to the resize, simply set the index as last
      if (slider.active.index >= getPagerQty()) { slider.active.last = true; }
      // if a pager is being displayed and a custom pager is not being used, update it
      if (slider.settings.pager && !slider.settings.pagerCustom) {
        populatePager();
        updatePagerActive(slider.active.index);
      }
      if (slider.settings.ariaHidden) { applyAriaHiddenAttributes(slider.active.index * getMoveBy()); }
    };

    /**
     * Destroy the current instance of the slider (revert everything back to original state)
     */
    el.destroySlider = function() {
      // don't do anything if slider has already been destroyed
      if (!slider.initialized) { return; }
      slider.initialized = false;
      $('.bx-clone', this).remove();
      slider.children.each(function() {
        if ($(this).data('origStyle') !== undefined) {
          $(this).attr('style', $(this).data('origStyle'));
        } else {
          $(this).removeAttr('style');
        }
      });
      if ($(this).data('origStyle') !== undefined) {
        this.attr('style', $(this).data('origStyle'));
      } else {
        $(this).removeAttr('style');
      }
      $(this).unwrap().unwrap();
      if (slider.controls.el) { slider.controls.el.remove(); }
      if (slider.controls.next) { slider.controls.next.remove(); }
      if (slider.controls.prev) { slider.controls.prev.remove(); }
      if (slider.pagerEl && slider.settings.controls && !slider.settings.pagerCustom) { slider.pagerEl.remove(); }
      $('.bx-caption', this).remove();
      if (slider.controls.autoEl) { slider.controls.autoEl.remove(); }
      clearInterval(slider.interval);
      if (slider.settings.responsive) { $(window).unbind('resize', resizeWindow); }
      if (slider.settings.keyboardEnabled) { $(document).unbind('keydown', keyPress); }
      //remove self reference in data
      $(this).removeData('bxSlider');
	  // remove global window handlers
	  $(window).off('blur', windowBlurHandler).off('focus', windowFocusHandler);
    };

    /**
     * Reload the slider (revert all DOM changes, and re-initialize)
     */
    el.reloadSlider = function(settings) {
      if (settings !== undefined) { options = settings; }
      el.destroySlider();
      init();
      //store reference to self in order to access public functions later
      $(el).data('bxSlider', this);
    };

    init();

    $(el).data('bxSlider', this);

    // returns the current jQuery object
    return this;
  };

})(jQuery);

/* End */
;
; /* Start:"a:4:{s:4:"full";s:95:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/catalog/script.js?16109700373792";s:6:"source";s:80:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/catalog/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
//sly functions start
function initSly(){
	var $frame  = $(document).find('.frame');
	var $slidee = $frame.children('ul').eq(0);
	var $wrap   = $frame.parent();

	$frame.sly({
		horizontal: 1,
		itemNav: 'basic',
		smart: 1,
		mouseDragging: 0,
		touchDragging: 0,
		releaseSwing: 0,
		startAt: 0,
		scrollBar: $wrap.find('.scrollbar'),
		scrollBy: 230,
		speed: 100,
		moveBy:100,
		elasticBounds: 1,
		easing: 'swing',
		dragHandle: 1,
		dynamicHandle: 1,
		clickBar: 1,
		swingSpeed:1,

		// Buttons
		forward: $wrap.find('.forward'),
		backward: $wrap.find('.backward'),
	});
	$frame.sly('reload');
}

function createTableCompare(originalTable, appendDiv, cloneTable){
	try{
		var clone = originalTable.clone().removeAttr('id').addClass('clone');
		if(cloneTable.length){
			cloneTable.remove();
			appendDiv.html('');
			appendDiv.html(clone);
		}else{
			appendDiv.append(clone);
		}
	}
	catch(e){}
	finally{

	}
}
//sly functions end

$(document).ready(function(){
	$('.link-block-more span.desc').on('click', function(){ // scroll to block
		if($('.detail .tabs.grey').length)
		{
			var content_offset = $('.detail .tabs.grey').offset();
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
			$('.nav.nav-tabs li:eq('+$('.tab-content #desc').index()+') a').trigger('click');
		}
		else if($('.drag_block.desc').length)
		{
			var content_offset = $('.drag_block.desc').offset();
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
		}
		else if($('div#desc').length)
		{
			var content_offset = $('div#desc').offset();
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
		}
	});

	$('.link-block-more span.char').on('click', function(){ // scroll to block
		if($('.detail .tabs.grey').length)
		{
			var content_offset = $('.detail .tabs.grey').offset();
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
			$('.nav.nav-tabs li:eq('+$('.tab-content .chars').index()+') a').trigger('click');
		}
		else if($('.drag_block.char').length)
		{
			var content_offset = $('.drag_block.char').offset();
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
		}
	});
	
	setBasketItemsClasses();
	$('a[data-toggle="tab"]').on('shown.bs.tab', function(e){
		var _this = $(e.target),
			index = _this.parent().index();

		if(_this.hasClass('gallery-link')) // gallery
		{
			InitFlexSliderClass($('.tab-content .tab-pane:visible').find('.flexslider.bigs'));
			InitFlexSliderClass($('.tab-content .tab-pane:visible').find('.flexslider.small-gallery'));
		}
		else if(_this.hasClass('projects-link')) // projects
		{
			setTimeout(function(){
				$('#projects .projects.item-views .item').sliceHeight();
			},100);
		}
		else if(_this.hasClass('tarif-link')) // tarif
		{
			$(window).resize();
		}
	})
	
	if($('.title-tab-heading').length)
	{
		$('.title-tab-heading').on('click', function(){
			var _this = $(this),
				content_offset = _this.offset();
			if(_this.next().hasClass('gallery-block') || _this.next().hasClass('small-gallery-block'))
			{
				InitFlexSliderClass(_this.next().find('.flexslider.bigs'));
				InitFlexSliderClass(_this.next().find('.flexslider.small-gallery'));
				if(_this.next().hasClass('small-gallery-block'))
				{
					setTimeout(function(){
						$('#gallerys .flexslider .item').sliceHeight({'lineheight': -3});
					},100);
				}
			}
			$('html, body').animate({scrollTop: content_offset.top-100}, 400);
		})
	}
	
	if($('.head-block').length) // tarifs
	{
		$(window).on('resize', function(){
			initSly();
			createTableCompare($('.data_table_props:not(.clone)'), $('.prop_title_table'), $('.data_table_props.clone'));
		});
		$('.head-block .item .body-info .title').sliceHeight({'row': '.head-block .items_view', 'item': '.head-block .items_view .title'});
	}
})
/* End */
;
; /* Start:"a:4:{s:4:"full";s:67:"/bitrix/templates/aspro-allcorp2/js/rating_likes.js?161097003710797";s:6:"source";s:51:"/bitrix/templates/aspro-allcorp2/js/rating_likes.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
if (!BXRL)
{
	var BXRL = {};
	var BXRLW = null;
}

RatingLikes = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax)
{
	this.enabled = true;
	this.likeId = likeId;
	this.entityTypeId = entityTypeId;
	this.entityId = entityId;
	this.available = (available == 'Y');
	this.userId = userId;
	this.localize = localize;
	this.template = template;
	this.pathToUserProfile = pathToUserProfile;
	this.pathToAjax = typeof(pathToAjax) == "string"? pathToAjax: '/bitrix/components/bitrix/rating.vote/vote.ajax.php';

	this.box = BX('bx-ilike-button-'+likeId);
	if (this.box === null)
	{
		this.enabled = false;
		return false;
	}

	this.button = BX.findChild(this.box, {className:'bx-ilike-left-wrap'}, true, false);
	this.wrapp = BX.findChild(this.box, {className:'all-wrapper'}, true, false);
	this.buttonText = BX.findChild(this.button, {className:'bx-ilike-text'}, true, false);
	this.count = BX.findChild(this.box,  {tagName:'span', className:'bx-ilike-right-wrap'}, true, false);
	this.countText	= BX.findChild(this.count, {tagName:'span', className:'bx-ilike-right'}, true, false);
	this.popup = null;
	this.popupId = null;
	this.popupOpenId = null;
	this.popupTimeoutId = null;
	this.popupContent = BX.findChild(BX('bx-ilike-popup-cont-'+likeId), {tagName:'span', className:'bx-ilike-popup'}, true, false);
	this.popupContentPage = 1;
	this.popupListProcess = false;
	this.popupTimeout = false;
	this.likeTimeout = false;

	this.lastVote = BX.hasClass(template == 'standart'? this.button: this.count, 'bx-you-like')? 'plus': 'cancel';
};

RatingLikes.LiveUpdate = function(params)
{
	if (params.USER_ID == BX.message('USER_ID'))
		return false;

	for(var i in BXRL)
	{
		if (BXRL.hasOwnProperty(i))
		{
			if (BXRL[i].entityTypeId == params.ENTITY_TYPE_ID && BXRL[i].entityId == params.ENTITY_ID)
			{
				var element = BXRL[i];
				element.countText.innerHTML = parseInt(params.TOTAL_POSITIVE_VOTES);
				element.count.insertBefore(
					BX.create("span", { props : { className : "bx-ilike-plus-one" }, style: {width: (element.countText.clientWidth-8)+'px', height: (element.countText.clientHeight-8)+'px'}, html: (params.TYPE == 'ADD'? '+1': '-1')})
					, element.count.firstChild);

				if (element.popup)
				{
					element.popup.close();
					element.popupContentPage = 1;
				}
			}
		}
	}
};

RatingLikes.Set = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax)
{
	if (template === undefined)
		template = 'standart';

	if (!BXRL[likeId] || BXRL[likeId].tryToSet <= 5)
	{
		var tryToSend = BXRL[likeId] && BXRL[likeId].tryToSet? BXRL[likeId].tryToSet: 1;
		BXRL[likeId] = new RatingLikes(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax);
		if (BXRL[likeId].enabled)
		{
			RatingLikes.Init(likeId);
		}
		else
		{
			setTimeout(function(){
				BXRL[likeId].tryToSet = tryToSend+1;
				RatingLikes.Set(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax);
			}, 500);
		}
	}
};

RatingLikes.Init = function(likeId)
{
	// like/unlike button
	if (BXRL[likeId].available)
	{

		BX.bind(BXRL[likeId].template == 'standart'? BXRL[likeId].button: BXRL[likeId].buttonText, 'click' ,function(e) {
			clearTimeout(BXRL[likeId].likeTimeout);
			if (BX.hasClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like'))
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_N'];
				BXRL[likeId].countText.innerHTML		= 	parseInt(BXRL[likeId].countText.innerHTML)-1;
				BX.removeClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'cancel')
						RatingLikes.Vote(likeId, 'cancel');
				}, 1000);
			}
			else
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_Y'];
				BXRL[likeId].countText.innerHTML 	= 	parseInt(BXRL[likeId].countText.innerHTML)+1;
				BX.addClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'plus')
						RatingLikes.Vote(likeId, 'plus');
				}, 1000);
			}
			BX.removeClass(this.box, 'bx-ilike-button-hover');
			BX.PreventDefault(e);
		});
		// Hover/unHover like-button
		BX.bind(BXRL[likeId].box, 'mouseover', function() {BX.addClass(this, 'bx-ilike-button-hover')});
		BX.bind(BXRL[likeId].box, 'mouseout', function() {BX.removeClass(this, 'bx-ilike-button-hover')});

	}
	else
	{
		if (BXRL[likeId].buttonText != undefined)
			BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_D'];
	}
	// get like-user-list
	RatingLikes.PopupScroll(likeId);
	console.log();
	BX.bind(BXRL[likeId].wrapp, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		BXRL[likeId].popupTimeoutId = setTimeout(function(){
			if (BXRLW == likeId)
				return false;
			if (BXRL[likeId].popupContentPage == 1)
				RatingLikes.List(likeId, 1);
			BXRL[likeId].popupTimeoutId = setTimeout(function() {
				RatingLikes.OpenWindow(likeId);
			}, 400);
		}, 400);
	});
	BX.bind(BXRL[likeId].wrapp, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
	});
	/*BX.bind(BXRL[likeId].count, 'click' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		if (BXRL[likeId].popupContentPage == 1)
			RatingLikes.List(likeId, 1);
		RatingLikes.OpenWindow(likeId);
	});*/

	BX.bind(BXRL[likeId].box, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
	});
	BX.bind(BXRL[likeId].box, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
		BXRL[likeId].popupTimeout = setTimeout(function(){
			if (BXRL[likeId].popup !== null)
			{
				BXRL[likeId].popup.close();
				BXRLW = null;
			}
		}, 1000);
	});
};

RatingLikes.OpenWindow = function(likeId)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (BXRL[likeId].popup == null)
	{
		BXRL[likeId].popup = new BX.PopupWindow('ilike-popup-'+likeId, (BXRL[likeId].template == 'standart'? BXRL[likeId].count: BXRL[likeId].box), {
			lightShadow : true,
			offsetLeft: 5,
			autoHide: true,
			closeByEsc: true,
			zIndex: 2005,
			bindOptions: {position: "top"},
			events : {
				onPopupClose : function() { BXRLW = null; },
				onPopupDestroy : function() {  }
			},
			content : BX('bx-ilike-popup-cont-'+likeId)
		});
		BXRL[likeId].popup.setAngle({});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseout' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
			BXRL[likeId].popupTimeout = setTimeout(function(){
				BXRL[likeId].popup.close();
			}, 1000);
		});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseover' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
		});
	}

	if (BXRLW != null)
		BXRL[BXRLW].popup.close();

	BXRLW = likeId;
	BXRL[likeId].popup.show();

	RatingLikes.AdjustWindow(likeId);
};

RatingLikes.Vote = function(likeId, voteAction)
{
	BX.ajax({
		url: BXRL[likeId].pathToAjax,
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_ACTION' : voteAction, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)	{
			BXRL[likeId].lastVote = data.action;
			BXRL[likeId].countText.innerHTML = data.items_all;
			BXRL[likeId].popupContentPage = 1;

			BXRL[likeId].popupContent.innerHTML = '';
			spanTag0 = document.createElement("span");
			spanTag0.className = "bx-ilike-wait";
			BXRL[likeId].popupContent.appendChild(spanTag0);
			RatingLikes.AdjustWindow(likeId);

			if(BX('ilike-popup-'+likeId) && BX('ilike-popup-'+likeId).style.display == "block")
				RatingLikes.List(likeId, null);
		},
		onfailure: function(data)	{}
	});
	return false;
};

RatingLikes.List = function(likeId, page)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (page == null)
		page = BXRL[likeId].popupContentPage;
	BXRL[likeId].popupListProcess = true;
	BX.ajax({
		url: BXRL[likeId].pathToAjax,
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE_LIST' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_LIST_PAGE' : page, 'PATH_TO_USER_PROFILE' : BXRL[likeId].pathToUserProfile, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)
		{
			BXRL[likeId].countText.innerHTML = data.items_all;

			if ( parseInt(data.items_page) == 0 )
				return false;

			if (page == 1)
			{
				BXRL[likeId].popupContent.innerHTML = '';
				spanTag0 = document.createElement("span");
				spanTag0.className = "bx-ilike-bottom_scroll";
				BXRL[likeId].popupContent.appendChild(spanTag0);
			}
			BXRL[likeId].popupContentPage += 1;

			var avatarNode = null;

			for (var i = 0; i < data.items.length; i++)
			{
				if (data.items[i]['PHOTO_SRC'].length > 0)
				{
					avatarNode = BX.create("IMG", {
						attrs: {src: data.items[i]['PHOTO_SRC']},
						props: {className: "bx-ilike-popup-avatar-img"}
					});
				}
				else
				{
					avatarNode = BX.create("IMG", {
						attrs: {src: '/bitrix/images/main/blank.gif'},
						props: {className: "bx-ilike-popup-avatar-img bx-ilike-popup-avatar-img-default"}
					});
				}

				BXRL[likeId].popupContent.appendChild(
					BX.create("div", {
						/*attrs: {
							href: data.items[i]['URL'],
							target: '_blank'
						},*/
						props: {
							className: "bx-ilike-popup-img" + (!!data.items[i]['USER_TYPE'] ? " bx-ilike-popup-img-" + data.items[i]['USER_TYPE'] : "")
						},
						children: [
							BX.create("SPAN", {
								props: {
									className: "bx-ilike-popup-avatar-new"
								},
								children: [
									avatarNode,
									BX.create("SPAN", {
										props: {className: "bx-ilike-popup-avatar-status-icon"}
									})
								]
							}),
							BX.create("SPAN", {
								props: {
									className: "bx-ilike-popup-name-new"
								},
								html: data.items[i]['FULL_NAME']
							})
						]
					})
				);
			}

			RatingLikes.AdjustWindow(likeId);
			RatingLikes.PopupScroll(likeId);

			BXRL[likeId].popupListProcess = false;
		},
		onfailure: function(data)	{}
	});
	return false;
};

RatingLikes.AdjustWindow = function(likeId)
{
	if (BXRL[likeId].popup != null)
	{
		BXRL[likeId].popup.bindOptions.forceBindPosition = true;
		BXRL[likeId].popup.adjustPosition();
		BXRL[likeId].popup.bindOptions.forceBindPosition = false;
	}
};

RatingLikes.PopupScroll = function(likeId)
{
	BX.bind(BXRL[likeId].popupContent, 'scroll' , function() {
		if (this.scrollTop > (this.scrollHeight - this.offsetHeight) / 1.5)
		{
			RatingLikes.List(likeId, null);
			BX.unbindAll(this);
		}
	});
};

/* End */
;
; /* Start:"a:4:{s:4:"full";s:97:"/bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js?16109700377355";s:6:"source";s:82:"/bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(window) {
if (!!window.JCCatalogSocnetsComments)
{
	return;
}

window.JCCatalogSocnetsComments = function(arParams)
{
	var i;

	this.errorCode = 0;

	this.params = {};

	this.serviceList = {
		blog: false,
		facebook: false,
		vk: false
	};
	this.settings = {
		blog: {
			ajaxUrl: '',
			ajaxParams: {},
			contID: 'bx-cat-soc-comments-blg'
		},
		facebook: {
			contID: 'bx-cat-soc-comments-fb',
			contWidthID: '',
			parentContID: 'soc_comments',
			facebookJSDK: 'facebook-jssdk',
			facebookPath: ''
		},
		vk: {}
	};

	this.services = {
		blog: {
			obBlogCont: null
		},
		facebook: {
			obFBCont: null,
			obFBContWidth: null,
			obFBParentCont: null,
			obFBjSDK: null,
			currentWidth: 0
		}
	};

	this.activeTabId = '';
	this.currentTab = -1;
	this.tabsContId = '';
	this.tabList = [];
	this.obTabList = [];

	if (typeof arParams === 'object')
	{
		this.params = arParams;
		if (!!this.params.serviceList && typeof(this.params.serviceList) === 'object')
		{
			for (i in this.serviceList)
			{
				if (this.serviceList.hasOwnProperty(i) && !!this.params.serviceList[i])
					this.serviceList[i] = true;
			}
		}
		if (this.serviceList.blog)
			this.initParams('blog');
		if (this.serviceList.facebook)
			this.initParams('facebook');

		if (typeof(this.params.tabs) === 'object')
		{
			this.activeTabId = this.params.tabs.activeTabId;
			this.tabsContId = this.params.tabs.tabsContId;
			this.tabList = this.params.tabs.tabList;
		}
	}
	else
	{
		this.errorCode = -1;
	}

	if (this.errorCode === 0)
		BX.ready(BX.proxy(this.Init, this));
};

window.JCCatalogSocnetsComments.prototype.initParams = function(id)
{
	var i;

	if (!!this.params.settings && typeof(this.params.settings) === 'object' && typeof(this.params.settings[id]) === 'object')
	{
		for (i in this.settings[id])
		{
			if (this.settings[id].hasOwnProperty(i) && !!this.params.settings[id][i])
				this.settings[id][i] = this.params.settings[id][i];
		}
	}
};

window.JCCatalogSocnetsComments.prototype.Init = function()
{
	if (!this.tabList || !BX.type.isArray(this.tabList) || this.tabList.length === 0)
	{
		this.errorCode = -1;
		return;
	}
	var i,
		strFullId;

	for (i = 0; i < this.tabList.length; i++)
	{
		strFullId = this.tabsContId + this.tabList[i];
		this.obTabList[i] = {
			id: this.tabList[i],
			tabId: strFullId,
			contId: strFullId+'_cont',
			tab: BX(strFullId),
			cont: BX(strFullId+'_cont')
		};
		if (!this.obTabList[i].tab || !this.obTabList[i].cont)
		{
			this.errorCode = -2;
			break;
		}
		if (this.activeTabId === this.tabList[i])
			this.currentTab = i;
		BX.bind(this.obTabList[i].tab, 'click', BX.proxy(this.onClick, this));
	}

	if (this.serviceList.blog)
	{
		this.services.blog.obBlogCont = BX(this.settings.blog.contID);
		if (!this.services.blog.obBlogCont)
		{
			this.serviceList.blog = false;
			this.errorCode = -16;
		}
	}
	if (this.serviceList.facebook)
	{
		this.services.facebook.obFBCont = BX(this.settings.facebook.contID);
		if (!this.services.facebook.obFBCont)
		{
			this.serviceList.facebook = false;
			this.errorCode = -32;
		}
		else
		{
			this.services.facebook.obFBContWidth = this.services.facebook.obFBCont.firstChild;
		}
		this.services.facebook.obFBParentCont = BX(this.settings.facebook.parentContID);
	}

	if (this.errorCode === 0)
	{
		this.showActiveTab();
		if (this.serviceList.blog)
			this.loadBlog();
		if (this.serviceList.facebook)
			this.loadFB();
	}

	this.params = {};
};

window.JCCatalogSocnetsComments.prototype.loadBlog = function()
{
	var postData;

	if (this.errorCode !== 0 || !this.serviceList.blog || this.settings.blog.ajaxUrl.length === 0)
	{
		return;
	}

	postData = this.settings.blog.ajaxParams;
	postData.sessid = BX.bitrix_sessid();
	BX.ajax({
		timeout:   30,
		method:   'POST',
		dataType: 'html',
		url:       this.settings.blog.ajaxUrl,
		data:      postData,
		onsuccess: BX.proxy(this.loadBlogResult, this)
	});
};

window.JCCatalogSocnetsComments.prototype.loadBlogResult = function(result)
{
	if (BX.type.isNotEmptyString(result))
		BX.adjust(this.services.blog.obBlogCont, { html: result });
};

window.JCCatalogSocnetsComments.prototype.loadFB = function()
{
	var width;

	if (this.services.facebook.obFBParentCont && this.services.facebook.obFBContWidth)
	{
		width = parseInt(this.services.facebook.obFBParentCont.offsetWidth, 10);
		if (!isNaN(width) && width > 20)
		{
			BX.adjust(this.services.facebook.obFBContWidth, { attrs: { 'data-width': (width-20) } });
			this.services.facebook.currentWidth = width;
		}

		if (!this.services.facebook.obFBjSDK)
		{
			this.services.facebook.obFBjSDK = true;
			BX.defer(BX.proxy((function(d, s, id, fbpath) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id))
				{
					return;
				}
				js = d.createElement(s); js.id = id;
				js.src = fbpath;
				fjs.parentNode.insertBefore(js, fjs);
			}(document, "script", this.settings.facebook.facebookJSDK, this.settings.facebook.facebookPath)), this));
		}
	}
};

window.JCCatalogSocnetsComments.prototype.getFBParentWidth = function()
{
	var width = 0;
	if (!!this.services.facebook.obFBParentCont)
	{
		width = parseInt(this.services.facebook.obFBParentCont.offsetWidth, 10);
		if (isNaN(width))
			width = 0;
	}
	return width;
};

window.JCCatalogSocnetsComments.prototype.setFBWidth = function(width)
{
	var obFrame = null,
		src,
		newSrc;

	if (
		this.serviceList.facebook &&
		this.services.facebook.currentWidth !== width &&
		width > 20 &&
		!!this.services.facebook.obFBContWidth
	)
	{
		if (!!this.services.facebook.obFBContWidth.firstChild && !!this.services.facebook.obFBContWidth.firstChild.fitrstChild)
		{
			obFrame = this.services.facebook.obFBContWidth.firstChild.fitrstChild;
			if (!!obFrame)
			{
				src = obFrame.getAttribute("src");
				newSrc = src.replace(/width=(\d+)/ig, "width="+width);
				BX.adjust(this.services.facebook.obFBContWidth, { attrs: { 'data-width': (width-20) } });
				this.services.facebook.currentWidth = width;
				BX.style(this.services.facebook.obFBContWidth.firstChild, 'width', width+'px');
				BX.adjust(obFrame, { attrs : { src: newSrc }, style: { width: width+'px' } });
			}
		}
	}
};

window.JCCatalogSocnetsComments.prototype.onResize = function()
{
	if (this.serviceList.facebook)
		this.setFBWidth(this.getFBParentWidth());
};

window.JCCatalogSocnetsComments.prototype.onClick = function()
{
	var target = BX.proxy_context,
		index = -1,
		i;

	for (i = 0; i < this.obTabList.length; i++)
	{
		if (target.id === this.obTabList[i].tabId)
		{
			index = i;
			break;
		}
	}
	if (index > -1)
	{
		if (index !== this.currentTab)
		{
			this.hideActiveTab();
			this.currentTab = index;
			this.showActiveTab();
		}
	}
};

window.JCCatalogSocnetsComments.prototype.hideActiveTab = function()
{
	BX.removeClass(this.obTabList[this.currentTab].tab, 'active');
	BX.addClass(this.obTabList[this.currentTab].cont, 'tab-off');
	BX.addClass(this.obTabList[this.currentTab].cont, 'hidden');
};

window.JCCatalogSocnetsComments.prototype.showActiveTab = function()
{
	BX.onCustomEvent('onAfterBXCatTabsSetActive_'+this.tabsContId,[{activeTab: this.obTabList[this.currentTab].id}]);
	BX.addClass(this.obTabList[this.currentTab].tab, 'active');
	BX.removeClass(this.obTabList[this.currentTab].cont, 'tab-off');
	BX.removeClass(this.obTabList[this.currentTab].cont, 'hidden');
};
})(window);
/* End */
;; /* /bitrix/templates/aspro-allcorp2/js/sly.js?161097003761252*/
; /* /bitrix/templates/aspro-allcorp2/vendor/jquery.bxslider.js?161097003766080*/
; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/catalog/script.js?16109700373792*/
; /* /bitrix/templates/aspro-allcorp2/js/rating_likes.js?161097003710797*/
; /* /bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js?16109700377355*/

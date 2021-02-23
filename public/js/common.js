"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var $ = jQuery;

function eventHandler() {
	// JSCCommon.CustomInputFile(); 
	var x = window.location.host;
	var screenName;
	screenName = 'main.jpg';

	if (screenName && x.includes("localhost:30")) {
		document.body.insertAdjacentHTML("beforeend", "<div class=\"pixel-perfect\" style=\"background-image: url(screen/".concat(screenName, ");\"></div>"));
	}

	function makeDDGroup(qSelecorts) {
		var _iterator = _createForOfIteratorHelper(qSelecorts),
				_step;

		try {
			for (_iterator.s(); !(_step = _iterator.n()).done;) {
				var parentSelect = _step.value;
				var parent = document.querySelector(parentSelect);

				if (parent) {
					(function () {
						// childHeads, kind of funny))
						var ChildHeads = parent.querySelectorAll('.accardion-head-js');
						$(ChildHeads).click(function () {
							var clickedHead = this;
							$(ChildHeads).each(function () {
								if (this === clickedHead) {
									$(this.parentElement).toggleClass('active');
									$(this.parentElement).find('.accardion-content-js').slideToggle(function () {
										$(this).toggleClass('active');
									});
								} else {
									$(this.parentElement).removeClass('active');
									$(this.parentElement).find('.accardion-content-js').slideUp(function () {
										$(this).removeClass('active');
									});
								}
							});
						});
					})();
				}
			}
		} catch (err) {
			_iterator.e(err);
		} finally {
			_iterator.f();
		}
	}

	makeDDGroup(['.catalogWrap', '.dd-price-js']);
}

;

if (document.readyState !== 'loading') {
	eventHandler();
} else {
	document.addEventListener('DOMContentLoaded', eventHandler);
} // window.onload = function () {
// 	document.body.classList.add('loaded_hiding');
// 	window.setTimeout(function () {
// 		document.body.classList.add('loaded');
// 		document.body.classList.remove('loaded_hiding');
// 	}, 500);
// }
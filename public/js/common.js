"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var JSCCommon = {
	modalCall: function modalCall() {
		$("a.fancybox").fancybox({
			arrows: false,
			infobar: false,
			touch: false,
			type: 'inline',
			autoFocus: false,
			i18n: {
				en: {
					CLOSE: "Закрыть",
					NEXT: "Вперед",
					PREV: "Назад" // PLAY_START: "Start slideshow",
					// PLAY_STOP: "Pause slideshow",
					// FULL_SCREEN: "Full screen",
					// THUMBS: "Thumbnails",
					// DOWNLOAD: "Download",
					// SHARE: "Share",
					// ZOOM: "Zoom"

				}
			},
			beforeLoad: function beforeLoad() {
				document.querySelector("html").classList.add("fixed");
			},
			afterClose: function afterClose() {
				document.querySelector("html").classList.remove("fixed");
			}
		});
		$(".modal-close-js").click(function () {
			$.fancybox.close();
		});
		$.fancybox.defaults.backFocus = false;
		var linkModal = document.querySelectorAll('.link-modal');

		function addData() {
			linkModal.forEach(function (element) {
				element.addEventListener('click', function () {
					var modal = document.querySelector(element.getAttribute("href"));
					var data = element.dataset;

					function setValue(val, elem) {
						if (elem && val) {
							var el = modal.querySelector(elem);
							el.tagName == "INPUT" ? el.value = val : el.innerHTML = val; // console.log(modal.querySelector(elem).tagName)
						}
					}

					setValue(data.title, '.ttu');
					setValue(data.text, '.after-headline');
					setValue(data.btn, '.btn');
					setValue(data.order, '.order');
				});
			});
		}

		if (linkModal) addData();
	}
};
var $ = jQuery;

function eventHandler() {
	JSCCommon.modalCall();

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

	makeDDGroup(['.catalogWrap', '.dd-price-js']); // console.log('.content-left');
	// var Sticky = new hcSticky('.sidebar-fixed', {
	// 	// stickTo: 'main'
	// 	stickTo: $('main')[0],
	// 	// innerTop: 50,
	// 	bottomEnd: 500
	// });

	(function () {
		var a = document.querySelector('.sidebar-fixed'),
				b = null,
				K = null,
				Z = 0,
				P = 0,
				N = 0; // если у P ноль заменить на число, то блок будет прилипать до того, как верхний край окна браузера дойдёт до верхнего края элемента, если у N — нижний край дойдёт до нижнего края элемента. Может быть отрицательным числом

		window.addEventListener('scroll', Ascroll, false);
		document.body.addEventListener('scroll', Ascroll, false);

		function Ascroll() {
			var Ra = a.getBoundingClientRect(),
					R1bottom = document.querySelector('.main-block').getBoundingClientRect().bottom;

			if (Ra.bottom < R1bottom) {
				if (b == null) {
					var Sa = getComputedStyle(a, ''),
							s = '';

					for (var i = 0; i < Sa.length; i++) {
						if (Sa[i].indexOf('overflow') == 0 || Sa[i].indexOf('padding') == 0 || Sa[i].indexOf('border') == 0 || Sa[i].indexOf('outline') == 0 || Sa[i].indexOf('box-shadow') == 0 || Sa[i].indexOf('background') == 0) {
							s += Sa[i] + ': ' + Sa.getPropertyValue(Sa[i]) + '; ';
						}
					}

					b = document.createElement('div');
					b.className = "stop";
					b.style.cssText = s + ' box-sizing: border-box; width: ' + a.offsetWidth + 'px;';
					a.insertBefore(b, a.firstChild);
					var l = a.childNodes.length;

					for (var i = 1; i < l; i++) {
						b.appendChild(a.childNodes[1]);
					}

					a.style.height = b.getBoundingClientRect().height + 'px';
					a.style.padding = '0';
					a.style.border = '0';
				}

				var Rb = b.getBoundingClientRect(),
						Rh = Ra.top + Rb.height,
						W = document.documentElement.clientHeight,
						R1 = Math.round(Rh - R1bottom),
						R2 = Math.round(Rh - W);

				if (Rb.height > W) {
					if (Ra.top < K) {
						// скролл вниз
						if (R2 + N > R1) {
							// не дойти до низа
							if (Rb.bottom - W + N <= 0) {
								// подцепиться
								b.className = 'sticky';
								b.style.top = W - Rb.height - N + 'px';
								Z = N + Ra.top + Rb.height - W;
							} else {
								b.className = 'stop';
								b.style.top = -Z + 'px';
							}
						} else {
							b.className = 'stop';
							b.style.top = -R1 + 'px';
							Z = R1;
						}
					} else {
						// скролл вверх
						if (Ra.top - P < 0) {
							// не дойти до верха
							if (Rb.top - P >= 0) {
								// подцепиться
								b.className = 'sticky';
								b.style.top = P + 'px';
								Z = Ra.top - P;
							} else {
								b.className = 'stop';
								b.style.top = -Z + 'px';
							}
						} else {
							b.className = '';
							b.style.top = '';
							Z = 0;
						}
					}

					K = Ra.top;
				} else {
					if (Ra.top - P <= 0) {
						if (Ra.top - P <= R1) {
							b.className = 'stop';
							b.style.top = -R1 + 'px';
						} else {
							b.className = 'sticky';
							b.style.top = P + 'px';
						}
					} else {
						b.className = '';
						b.style.top = '';
					}
				}

				window.addEventListener('resize', function () {
					a.children[0].style.width = getComputedStyle(a, '').width;
				}, false);
			}
		}
	})();
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
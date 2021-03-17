const JSCCommon = {
  modalCall() {

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
					PREV: "Назад",
					// PLAY_START: "Start slideshow",
					// PLAY_STOP: "Pause slideshow",
					// FULL_SCREEN: "Full screen",
					// THUMBS: "Thumbnails",
					// DOWNLOAD: "Download",
					// SHARE: "Share",
					// ZOOM: "Zoom"
				},
			},
			beforeLoad: function () {
				document.querySelector("html").classList.add("fixed")
			},
			afterClose: function () {
				document.querySelector("html").classList.remove("fixed")
			},
		});
		$(".modal-close-js").click(function () {
			$.fancybox.close();
		})
		$.fancybox.defaults.backFocus = false;
		const linkModal = document.querySelectorAll('.link-modal');
		function addData() {
			linkModal.forEach(element => {
				element.addEventListener('click', () => {
					let modal = document.querySelector(element.getAttribute("href"));
					const data = element.dataset;

					function setValue(val, elem) {
						if (elem && val) {
							const el = modal.querySelector(elem)
							el.tagName == "INPUT"
								? el.value = val
								: el.innerHTML = val;
							// console.log(modal.querySelector(elem).tagName)
						}
					}
					setValue(data.title, '.ttu');
					setValue(data.text, '.after-headline');
					setValue(data.btn, '.btn');
					setValue(data.order, '.order');
				})
			})
		}
		if (linkModal) addData();
	},
}
const $ = jQuery;

function eventHandler() {
	JSCCommon.modalCall();

	function makeDDGroup(qSelecorts){
    for (let parentSelect of qSelecorts){
      let parent = document.querySelector(parentSelect);
      if (parent){
        // childHeads, kind of funny))
        let ChildHeads = parent.querySelectorAll('.accardion-head-js');
        $(ChildHeads).click(function (){
          let clickedHead = this;
          $(ChildHeads).each(function (){
            if (this === clickedHead){
              $(this.parentElement).toggleClass('active');
              $(this.parentElement).find('.accardion-content-js').slideToggle(function (){
                $(this).toggleClass('active');
              });
            }
            else{
              $(this.parentElement).removeClass('active');
              $(this.parentElement).find('.accardion-content-js').slideUp(function (){
                $(this).removeClass('active');
              });
            }
          });
        });
      }
    }
  }
  makeDDGroup(['.catalogWrap', '.dd-price-js']);

};
if (document.readyState !== 'loading') {
	eventHandler();
} else {
	document.addEventListener('DOMContentLoaded', eventHandler);
}

// window.onload = function () {
// 	document.body.classList.add('loaded_hiding');
// 	window.setTimeout(function () {
// 		document.body.classList.add('loaded');
// 		document.body.classList.remove('loaded_hiding');
// 	}, 500);
// }
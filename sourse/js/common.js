
const $ = jQuery;

function eventHandler() {

	// JSCCommon.CustomInputFile(); 
	var x = window.location.host;
	let screenName;
	screenName = 'main.jpg';
	if (screenName && x.includes("localhost:30")) {
		document.body.insertAdjacentHTML("beforeend", `<div class="pixel-perfect" style="background-image: url(screen/${screenName});"></div>`);
	}

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
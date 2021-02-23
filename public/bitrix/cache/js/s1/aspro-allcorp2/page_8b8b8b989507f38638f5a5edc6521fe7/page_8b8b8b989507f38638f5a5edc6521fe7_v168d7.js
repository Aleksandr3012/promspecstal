
; /* Start:"a:4:{s:4:"full";s:98:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/landings_list/script.js?1610970037587";s:6:"source";s:84:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/landings_list/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	$('.landings_list .more>span').on('click', function(){
		var $this = $(this),
			dataOpened = $this.data('opened'),
			dataText = $this.data('text'),
			thisText = $this.text(),
			item = $this.closest('.landings_list').find('.hidden_items'),
			animationTime = 400;
		
		if(dataOpened == 'N'){
			item.slideDown(animationTime);
			$this.addClass('opened').data('opened', 'Y');
		}
		else{
			item.slideUp(animationTime);
			$this.removeClass('opened').data('opened', 'N');
		}
		
		$this.data('text', thisText).text(dataText);
	});
});
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/landings_list/script.js?1610970037587*/

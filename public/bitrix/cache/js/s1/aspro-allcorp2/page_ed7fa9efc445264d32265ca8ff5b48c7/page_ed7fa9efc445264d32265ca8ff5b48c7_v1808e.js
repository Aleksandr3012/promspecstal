
; /* Start:"a:4:{s:4:"full";s:95:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/items-list/script.js?1610970037914";s:6:"source";s:81:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/items-list/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	if($('.table .row.sid').length)
	{
		if(BX.browser.IsIE9() && BX.browser.IsIE())
		{
			$('.table .row.sid').each(function(){
				// $(this).find('.item:visible .image').sliceHeight({lineheight: -3});
				$(this).find('.item:visible .properties').sliceHeight({fixWidth: 2});
				$(this).find('.item:visible .text').sliceHeight({fixWidth: 2});
			})
		}
	}
	if($('.table.item-views .tabs a').length)
	{
		$('.table.item-views .tabs a').first().addClass('heightsliced');
		$('.table.item-views .tabs a').on('click', function() {
			if(!$(this).hasClass('heightsliced')){
				$('.table.item-views .tab-pane.active').find('.item .image').sliceHeight({lineheight: -3});
				$('.table.item-views .tab-pane.active').find('.item .properties').sliceHeight();
				$('.table.item-views .tab-pane.active').find('.item .text').sliceHeight();
				$(this).addClass('heightsliced');
			}
		});
	}
})
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/items-list/script.js?1610970037914*/

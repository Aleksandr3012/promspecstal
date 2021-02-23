
; /* Start:"a:4:{s:4:"full";s:103:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog-sections-2/script.js?1610970037222";s:6:"source";s:89:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog-sections-2/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	if((BX.browser.IsIE9() && BX.browser.IsIE()) || BX.browser.IsMac())
	{
		if($('.catalog .item.slice-item').length)
		{
			$('.catalog .item.slice-item').sliceHeight({'fixWidth':1});
		}
	}
})
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog-sections-2/script.js?1610970037222*/

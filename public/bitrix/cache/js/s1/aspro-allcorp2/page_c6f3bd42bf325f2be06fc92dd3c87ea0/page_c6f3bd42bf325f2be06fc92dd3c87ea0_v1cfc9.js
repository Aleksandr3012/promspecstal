
; /* Start:"a:4:{s:4:"full";s:103:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/services-section_1/script.js?1610970037198";s:6:"source";s:89:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/services-section_1/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	if(BX.browser.IsIE9() && BX.browser.IsIE())
	{
		if($('.catalog .item.slice-item').length)
		{
			$('.catalog .item.slice-item').sliceHeight({'fixWidth':1});
		}
	}
})
/* End */
;
; /* Start:"a:4:{s:4:"full";s:90:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/news2/script.js?1610970037213";s:6:"source";s:76:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/news2/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	if(BX.browser.IsIE9() && BX.browser.IsIE())
	{
		if($('.item.slice-item').length)
		{
			$('.item.slice-item .title').sliceHeight();
			$('.item.slice-item').sliceHeight();
		}
	}
})
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/services-section_1/script.js?1610970037198*/
; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/news2/script.js?1610970037213*/

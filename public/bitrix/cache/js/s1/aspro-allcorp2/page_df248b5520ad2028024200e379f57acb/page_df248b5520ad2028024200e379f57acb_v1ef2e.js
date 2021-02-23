
; /* Start:"a:4:{s:4:"full";s:91:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/news/script.js?1610970037626";s:6:"source";s:77:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/news/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	if($('.detail .galery-block .flexslider .item').length)
	{
		$('.detail .galery-block .flexslider .item').sliceHeight({lineheight: -3});
		if($('.detail .galery #carousel').length)
		{
			$('.detail .galery #carousel').flexslider({
				animation: 'slide',
				controlNav: false,
				animationLoop: true,
				slideshow: false,
				itemWidth: 77,
				itemMargin: 7.5,
				minItems: 2,
				maxItems: 4,
				asNavFor: '.detail .galery #slider'
			});
		}
	}
	if($('.docs-block .blocks').length)
		$('.docs-block .blocks .inner-wrapper').sliceHeight({'row': '.blocks', 'item': '.inner-wrapper'});
});
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.detail/news/script.js?1610970037626*/

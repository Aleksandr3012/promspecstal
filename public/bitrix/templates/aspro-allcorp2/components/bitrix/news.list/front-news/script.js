$(document).ready(function(){
	if(BX.browser.IsIE9() && BX.browser.IsIE())
	{
		$('.news_block .items .item').sliceHeight();
	}
});
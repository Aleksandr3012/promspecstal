$(document).ready(function(){
	if((BX.browser.IsIE9() && BX.browser.IsIE()) || BX.browser.IsMac())
	{
		if($('.catalog .item.slice-item').length)
		{
			$('.catalog .item.slice-item').sliceHeight({'fixWidth':1});
		}
	}
})
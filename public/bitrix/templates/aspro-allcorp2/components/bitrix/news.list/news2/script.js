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
$(document).ready(function(){
	var index = $('.head-block .item-link.active').index();
	setBasketItemsClasses();

	if(!index)
	{
		$('.item-block:eq('+index+') .catalog.item-views.table .item .title').sliceHeight({sliceEqualLength: true});
		$('.item-block:eq('+index+') .catalog.item-views.table .item .cont').sliceHeight({sliceEqualLength: true});
		$('.item-block:eq('+index+') .catalog.item-views.table .item .slice_price').sliceHeight({sliceEqualLength: true});
		$('.item-block:eq('+index+') .catalog.item-views.table .item').sliceHeight({classNull: '.desktop-wrapper', sliceEqualLength: true});
	}
});
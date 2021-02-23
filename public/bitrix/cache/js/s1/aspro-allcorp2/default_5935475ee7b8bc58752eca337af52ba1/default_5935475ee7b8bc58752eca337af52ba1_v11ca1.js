
; /* Start:"a:4:{s:4:"full";s:98:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog_table/script.js?1610970037346";s:6:"source";s:84:"/bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog_table/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
$(document).ready(function(){
	setBasketItemsClasses();

	$('.catalog.item-views.table.many .item .title').sliceHeight();
	$('.catalog.item-views.table.many .item .cont').sliceHeight();
	// $('.catalog.item-views.table.many .item .slice_price').sliceHeight();
	$('.catalog.item-views.table .item').sliceHeight({classNull: '.desktop-wrapper'});
})
/* End */
;; /* /bitrix/templates/aspro-allcorp2/components/bitrix/news.list/catalog_table/script.js?1610970037346*/

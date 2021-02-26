/*
You can use this file with your scripts.
It will not be overwritten when you upgrade solution.
*/
$(document).ready(function(){
	$('.services').click(function(){
		$('.product-submenu').addClass('hide');	
		$('.services-submenu').removeClass('hide');      
		$('.proizv-submenu').addClass('hide');	
		return false;
	});				
});
$(document).ready(function(){
	$('.product').click(function(){
		$('.product-submenu').removeClass('hide');	
		$('.services-submenu').addClass('hide');      
		$('.proizv-submenu').addClass('hide');	
		return false;
	});				
});
$(document).ready(function(){
	$('.proizvodstvo').click(function(){
		$('.product-submenu').addClass('hide');	
		$('.services-submenu').addClass('hide');      
		$('.proizv-submenu').removeClass('hide');	
		return false;
	});				
});
$(document).ready(function(){
	$('.f-item').click(function(){
		//$('.product-submenu').addClass('hide');	
		//$('.submenu-wrapper').addClass('hide');      
		$('.f-item>.submenu-wrapper').toggleClass('hide');	
		return false;
	});				
});
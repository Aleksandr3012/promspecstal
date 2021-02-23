
window.BX_YMapAddPlacemark = function(map, arPlacemark, isClustered){
	if (null == map)
		return false;

	if(!arPlacemark.LAT || !arPlacemark.LON)
		return false;

	var props = {};

	
	if (null != arPlacemark.TEXT && arPlacemark.TEXT.length > 0)
	{
		var value_view = '';

		if (arPlacemark.TEXT.length > 0)
		{
			var rnpos = arPlacemark.TEXT.indexOf("\n");
			value_view = rnpos <= 0 ? arPlacemark.TEXT : arPlacemark.TEXT.substring(0, rnpos);
		}

		props.balloonContent = arPlacemark.TEXT.replace(/\n/g, '<br />');
		props.hintContent = value_view;
	}

	if (null != arPlacemark.HTML && arPlacemark.HTML.length > 0)
	{
		props.balloonContent = arPlacemark.HTML;
	}

	var option = {
		item: arPlacemark.ITEM_ID,
		// hideIconOnBalloonOpen: false,
		hasHint: false,
		// hasBalloon: false,
	};
	
	if(typeof ymaps !== 'undefined' && arAllcorp2Options['THEME']['DEFAULT_MAP_MARKET'] != 'Y')
	{
		var markerSVG = ymaps.templateLayoutFactory.createClass([
		'<svg xmlns="http://www.w3.org/2000/svg" width="44" height="55" class="marker dynamic" viewBox="0 0 44 55">',
		'<defs><style>.mcls-1,.mcls-3{fill:#fff;}.mcls-1,.mcls-2{fill-rule:evenodd;}.mcls-2{opacity: 0.75;fill:#fff;}.mcls-1{fill: #ff6307;}</style></defs>',
		'<path class="mcls-2" d="M44,23.051c0,15.949-22,31.938-22,31.938S0.009,39,.009,23.051c0-.147.019-0.29,0.022-0.436C0.025,22.409,0,22.208,0,22A22,22,0,0,1,19.627.132,19.174,19.174,0,0,1,24.5.152,22,22,0,0,1,44,22c0,0.172-.022.338-0.026,0.509S44,22.869,44,23.051Z"></path>',
		'<path class="mcls-1" d="M42,23.393c0,13.424-20,29.6-20,29.6s-20-16.174-20-29.6c0-.209.024-0.414,0.03-0.623C2.029,22.513,2,22.26,2,22a20,20,0,0,1,40,0c0,0.227-.026.448-0.034,0.673C41.974,22.914,42,23.151,42,23.393Z"></path>',
		'<circle class="mcls-3" cx="22" cy="22" r="11"></circle>',
		'</svg>'
		].join(''));

		option.iconImageSize = [46, 57];
		option.iconLayout = markerSVG;

	}
	
	var obPlacemark = new ymaps.Placemark(
		[arPlacemark.LAT, arPlacemark.LON],
		props,
		option,
		{balloonCloseButton: true}
	);

	if(!isClustered) { map.geoObjects.add(obPlacemark); }

	return obPlacemark;
}

if (!window.BX_YMapAddPolyline)
{
	window.BX_YMapAddPolyline = function(map, arPolyline)
	{
		if (null == map)
			return false;

		if (null != arPolyline.POINTS && arPolyline.POINTS.length > 1)
		{
			var arPoints = [];
			for (var i = 0, len = arPolyline.POINTS.length; i < len; i++)
			{
				arPoints.push([arPolyline.POINTS[i].LAT, arPolyline.POINTS[i].LON]);
			}
		}
		else
		{
			return false;
		}

		var obParams = {clickable: true};
		if (null != arPolyline.STYLE)
		{
			obParams.strokeColor = arPolyline.STYLE.strokeColor;
			obParams.strokeWidth = arPolyline.STYLE.strokeWidth;
		}
		var obPolyline = new ymaps.Polyline(
			arPoints, {balloonContent: arPolyline.TITLE}, obParams
		);

		map.geoObjects.add(obPolyline);

		return obPolyline;
	}
}
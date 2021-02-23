
; /* Start:"a:4:{s:4:"full";s:67:"/bitrix/templates/aspro-allcorp2/js/rating_likes.js?161097003710797";s:6:"source";s:51:"/bitrix/templates/aspro-allcorp2/js/rating_likes.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
if (!BXRL)
{
	var BXRL = {};
	var BXRLW = null;
}

RatingLikes = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax)
{
	this.enabled = true;
	this.likeId = likeId;
	this.entityTypeId = entityTypeId;
	this.entityId = entityId;
	this.available = (available == 'Y');
	this.userId = userId;
	this.localize = localize;
	this.template = template;
	this.pathToUserProfile = pathToUserProfile;
	this.pathToAjax = typeof(pathToAjax) == "string"? pathToAjax: '/bitrix/components/bitrix/rating.vote/vote.ajax.php';

	this.box = BX('bx-ilike-button-'+likeId);
	if (this.box === null)
	{
		this.enabled = false;
		return false;
	}

	this.button = BX.findChild(this.box, {className:'bx-ilike-left-wrap'}, true, false);
	this.wrapp = BX.findChild(this.box, {className:'all-wrapper'}, true, false);
	this.buttonText = BX.findChild(this.button, {className:'bx-ilike-text'}, true, false);
	this.count = BX.findChild(this.box,  {tagName:'span', className:'bx-ilike-right-wrap'}, true, false);
	this.countText	= BX.findChild(this.count, {tagName:'span', className:'bx-ilike-right'}, true, false);
	this.popup = null;
	this.popupId = null;
	this.popupOpenId = null;
	this.popupTimeoutId = null;
	this.popupContent = BX.findChild(BX('bx-ilike-popup-cont-'+likeId), {tagName:'span', className:'bx-ilike-popup'}, true, false);
	this.popupContentPage = 1;
	this.popupListProcess = false;
	this.popupTimeout = false;
	this.likeTimeout = false;

	this.lastVote = BX.hasClass(template == 'standart'? this.button: this.count, 'bx-you-like')? 'plus': 'cancel';
};

RatingLikes.LiveUpdate = function(params)
{
	if (params.USER_ID == BX.message('USER_ID'))
		return false;

	for(var i in BXRL)
	{
		if (BXRL.hasOwnProperty(i))
		{
			if (BXRL[i].entityTypeId == params.ENTITY_TYPE_ID && BXRL[i].entityId == params.ENTITY_ID)
			{
				var element = BXRL[i];
				element.countText.innerHTML = parseInt(params.TOTAL_POSITIVE_VOTES);
				element.count.insertBefore(
					BX.create("span", { props : { className : "bx-ilike-plus-one" }, style: {width: (element.countText.clientWidth-8)+'px', height: (element.countText.clientHeight-8)+'px'}, html: (params.TYPE == 'ADD'? '+1': '-1')})
					, element.count.firstChild);

				if (element.popup)
				{
					element.popup.close();
					element.popupContentPage = 1;
				}
			}
		}
	}
};

RatingLikes.Set = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax)
{
	if (template === undefined)
		template = 'standart';

	if (!BXRL[likeId] || BXRL[likeId].tryToSet <= 5)
	{
		var tryToSend = BXRL[likeId] && BXRL[likeId].tryToSet? BXRL[likeId].tryToSet: 1;
		BXRL[likeId] = new RatingLikes(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax);
		if (BXRL[likeId].enabled)
		{
			RatingLikes.Init(likeId);
		}
		else
		{
			setTimeout(function(){
				BXRL[likeId].tryToSet = tryToSend+1;
				RatingLikes.Set(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax);
			}, 500);
		}
	}
};

RatingLikes.Init = function(likeId)
{
	// like/unlike button
	if (BXRL[likeId].available)
	{

		BX.bind(BXRL[likeId].template == 'standart'? BXRL[likeId].button: BXRL[likeId].buttonText, 'click' ,function(e) {
			clearTimeout(BXRL[likeId].likeTimeout);
			if (BX.hasClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like'))
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_N'];
				BXRL[likeId].countText.innerHTML		= 	parseInt(BXRL[likeId].countText.innerHTML)-1;
				BX.removeClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'cancel')
						RatingLikes.Vote(likeId, 'cancel');
				}, 1000);
			}
			else
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_Y'];
				BXRL[likeId].countText.innerHTML 	= 	parseInt(BXRL[likeId].countText.innerHTML)+1;
				BX.addClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'plus')
						RatingLikes.Vote(likeId, 'plus');
				}, 1000);
			}
			BX.removeClass(this.box, 'bx-ilike-button-hover');
			BX.PreventDefault(e);
		});
		// Hover/unHover like-button
		BX.bind(BXRL[likeId].box, 'mouseover', function() {BX.addClass(this, 'bx-ilike-button-hover')});
		BX.bind(BXRL[likeId].box, 'mouseout', function() {BX.removeClass(this, 'bx-ilike-button-hover')});

	}
	else
	{
		if (BXRL[likeId].buttonText != undefined)
			BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_D'];
	}
	// get like-user-list
	RatingLikes.PopupScroll(likeId);
	console.log();
	BX.bind(BXRL[likeId].wrapp, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		BXRL[likeId].popupTimeoutId = setTimeout(function(){
			if (BXRLW == likeId)
				return false;
			if (BXRL[likeId].popupContentPage == 1)
				RatingLikes.List(likeId, 1);
			BXRL[likeId].popupTimeoutId = setTimeout(function() {
				RatingLikes.OpenWindow(likeId);
			}, 400);
		}, 400);
	});
	BX.bind(BXRL[likeId].wrapp, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
	});
	/*BX.bind(BXRL[likeId].count, 'click' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		if (BXRL[likeId].popupContentPage == 1)
			RatingLikes.List(likeId, 1);
		RatingLikes.OpenWindow(likeId);
	});*/

	BX.bind(BXRL[likeId].box, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
	});
	BX.bind(BXRL[likeId].box, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
		BXRL[likeId].popupTimeout = setTimeout(function(){
			if (BXRL[likeId].popup !== null)
			{
				BXRL[likeId].popup.close();
				BXRLW = null;
			}
		}, 1000);
	});
};

RatingLikes.OpenWindow = function(likeId)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (BXRL[likeId].popup == null)
	{
		BXRL[likeId].popup = new BX.PopupWindow('ilike-popup-'+likeId, (BXRL[likeId].template == 'standart'? BXRL[likeId].count: BXRL[likeId].box), {
			lightShadow : true,
			offsetLeft: 5,
			autoHide: true,
			closeByEsc: true,
			zIndex: 2005,
			bindOptions: {position: "top"},
			events : {
				onPopupClose : function() { BXRLW = null; },
				onPopupDestroy : function() {  }
			},
			content : BX('bx-ilike-popup-cont-'+likeId)
		});
		BXRL[likeId].popup.setAngle({});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseout' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
			BXRL[likeId].popupTimeout = setTimeout(function(){
				BXRL[likeId].popup.close();
			}, 1000);
		});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseover' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
		});
	}

	if (BXRLW != null)
		BXRL[BXRLW].popup.close();

	BXRLW = likeId;
	BXRL[likeId].popup.show();

	RatingLikes.AdjustWindow(likeId);
};

RatingLikes.Vote = function(likeId, voteAction)
{
	BX.ajax({
		url: BXRL[likeId].pathToAjax,
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_ACTION' : voteAction, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)	{
			BXRL[likeId].lastVote = data.action;
			BXRL[likeId].countText.innerHTML = data.items_all;
			BXRL[likeId].popupContentPage = 1;

			BXRL[likeId].popupContent.innerHTML = '';
			spanTag0 = document.createElement("span");
			spanTag0.className = "bx-ilike-wait";
			BXRL[likeId].popupContent.appendChild(spanTag0);
			RatingLikes.AdjustWindow(likeId);

			if(BX('ilike-popup-'+likeId) && BX('ilike-popup-'+likeId).style.display == "block")
				RatingLikes.List(likeId, null);
		},
		onfailure: function(data)	{}
	});
	return false;
};

RatingLikes.List = function(likeId, page)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (page == null)
		page = BXRL[likeId].popupContentPage;
	BXRL[likeId].popupListProcess = true;
	BX.ajax({
		url: BXRL[likeId].pathToAjax,
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE_LIST' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_LIST_PAGE' : page, 'PATH_TO_USER_PROFILE' : BXRL[likeId].pathToUserProfile, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)
		{
			BXRL[likeId].countText.innerHTML = data.items_all;

			if ( parseInt(data.items_page) == 0 )
				return false;

			if (page == 1)
			{
				BXRL[likeId].popupContent.innerHTML = '';
				spanTag0 = document.createElement("span");
				spanTag0.className = "bx-ilike-bottom_scroll";
				BXRL[likeId].popupContent.appendChild(spanTag0);
			}
			BXRL[likeId].popupContentPage += 1;

			var avatarNode = null;

			for (var i = 0; i < data.items.length; i++)
			{
				if (data.items[i]['PHOTO_SRC'].length > 0)
				{
					avatarNode = BX.create("IMG", {
						attrs: {src: data.items[i]['PHOTO_SRC']},
						props: {className: "bx-ilike-popup-avatar-img"}
					});
				}
				else
				{
					avatarNode = BX.create("IMG", {
						attrs: {src: '/bitrix/images/main/blank.gif'},
						props: {className: "bx-ilike-popup-avatar-img bx-ilike-popup-avatar-img-default"}
					});
				}

				BXRL[likeId].popupContent.appendChild(
					BX.create("div", {
						/*attrs: {
							href: data.items[i]['URL'],
							target: '_blank'
						},*/
						props: {
							className: "bx-ilike-popup-img" + (!!data.items[i]['USER_TYPE'] ? " bx-ilike-popup-img-" + data.items[i]['USER_TYPE'] : "")
						},
						children: [
							BX.create("SPAN", {
								props: {
									className: "bx-ilike-popup-avatar-new"
								},
								children: [
									avatarNode,
									BX.create("SPAN", {
										props: {className: "bx-ilike-popup-avatar-status-icon"}
									})
								]
							}),
							BX.create("SPAN", {
								props: {
									className: "bx-ilike-popup-name-new"
								},
								html: data.items[i]['FULL_NAME']
							})
						]
					})
				);
			}

			RatingLikes.AdjustWindow(likeId);
			RatingLikes.PopupScroll(likeId);

			BXRL[likeId].popupListProcess = false;
		},
		onfailure: function(data)	{}
	});
	return false;
};

RatingLikes.AdjustWindow = function(likeId)
{
	if (BXRL[likeId].popup != null)
	{
		BXRL[likeId].popup.bindOptions.forceBindPosition = true;
		BXRL[likeId].popup.adjustPosition();
		BXRL[likeId].popup.bindOptions.forceBindPosition = false;
	}
};

RatingLikes.PopupScroll = function(likeId)
{
	BX.bind(BXRL[likeId].popupContent, 'scroll' , function() {
		if (this.scrollTop > (this.scrollHeight - this.offsetHeight) / 1.5)
		{
			RatingLikes.List(likeId, null);
			BX.unbindAll(this);
		}
	});
};

/* End */
;
; /* Start:"a:4:{s:4:"full";s:97:"/bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js?16109700377355";s:6:"source";s:82:"/bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(window) {
if (!!window.JCCatalogSocnetsComments)
{
	return;
}

window.JCCatalogSocnetsComments = function(arParams)
{
	var i;

	this.errorCode = 0;

	this.params = {};

	this.serviceList = {
		blog: false,
		facebook: false,
		vk: false
	};
	this.settings = {
		blog: {
			ajaxUrl: '',
			ajaxParams: {},
			contID: 'bx-cat-soc-comments-blg'
		},
		facebook: {
			contID: 'bx-cat-soc-comments-fb',
			contWidthID: '',
			parentContID: 'soc_comments',
			facebookJSDK: 'facebook-jssdk',
			facebookPath: ''
		},
		vk: {}
	};

	this.services = {
		blog: {
			obBlogCont: null
		},
		facebook: {
			obFBCont: null,
			obFBContWidth: null,
			obFBParentCont: null,
			obFBjSDK: null,
			currentWidth: 0
		}
	};

	this.activeTabId = '';
	this.currentTab = -1;
	this.tabsContId = '';
	this.tabList = [];
	this.obTabList = [];

	if (typeof arParams === 'object')
	{
		this.params = arParams;
		if (!!this.params.serviceList && typeof(this.params.serviceList) === 'object')
		{
			for (i in this.serviceList)
			{
				if (this.serviceList.hasOwnProperty(i) && !!this.params.serviceList[i])
					this.serviceList[i] = true;
			}
		}
		if (this.serviceList.blog)
			this.initParams('blog');
		if (this.serviceList.facebook)
			this.initParams('facebook');

		if (typeof(this.params.tabs) === 'object')
		{
			this.activeTabId = this.params.tabs.activeTabId;
			this.tabsContId = this.params.tabs.tabsContId;
			this.tabList = this.params.tabs.tabList;
		}
	}
	else
	{
		this.errorCode = -1;
	}

	if (this.errorCode === 0)
		BX.ready(BX.proxy(this.Init, this));
};

window.JCCatalogSocnetsComments.prototype.initParams = function(id)
{
	var i;

	if (!!this.params.settings && typeof(this.params.settings) === 'object' && typeof(this.params.settings[id]) === 'object')
	{
		for (i in this.settings[id])
		{
			if (this.settings[id].hasOwnProperty(i) && !!this.params.settings[id][i])
				this.settings[id][i] = this.params.settings[id][i];
		}
	}
};

window.JCCatalogSocnetsComments.prototype.Init = function()
{
	if (!this.tabList || !BX.type.isArray(this.tabList) || this.tabList.length === 0)
	{
		this.errorCode = -1;
		return;
	}
	var i,
		strFullId;

	for (i = 0; i < this.tabList.length; i++)
	{
		strFullId = this.tabsContId + this.tabList[i];
		this.obTabList[i] = {
			id: this.tabList[i],
			tabId: strFullId,
			contId: strFullId+'_cont',
			tab: BX(strFullId),
			cont: BX(strFullId+'_cont')
		};
		if (!this.obTabList[i].tab || !this.obTabList[i].cont)
		{
			this.errorCode = -2;
			break;
		}
		if (this.activeTabId === this.tabList[i])
			this.currentTab = i;
		BX.bind(this.obTabList[i].tab, 'click', BX.proxy(this.onClick, this));
	}

	if (this.serviceList.blog)
	{
		this.services.blog.obBlogCont = BX(this.settings.blog.contID);
		if (!this.services.blog.obBlogCont)
		{
			this.serviceList.blog = false;
			this.errorCode = -16;
		}
	}
	if (this.serviceList.facebook)
	{
		this.services.facebook.obFBCont = BX(this.settings.facebook.contID);
		if (!this.services.facebook.obFBCont)
		{
			this.serviceList.facebook = false;
			this.errorCode = -32;
		}
		else
		{
			this.services.facebook.obFBContWidth = this.services.facebook.obFBCont.firstChild;
		}
		this.services.facebook.obFBParentCont = BX(this.settings.facebook.parentContID);
	}

	if (this.errorCode === 0)
	{
		this.showActiveTab();
		if (this.serviceList.blog)
			this.loadBlog();
		if (this.serviceList.facebook)
			this.loadFB();
	}

	this.params = {};
};

window.JCCatalogSocnetsComments.prototype.loadBlog = function()
{
	var postData;

	if (this.errorCode !== 0 || !this.serviceList.blog || this.settings.blog.ajaxUrl.length === 0)
	{
		return;
	}

	postData = this.settings.blog.ajaxParams;
	postData.sessid = BX.bitrix_sessid();
	BX.ajax({
		timeout:   30,
		method:   'POST',
		dataType: 'html',
		url:       this.settings.blog.ajaxUrl,
		data:      postData,
		onsuccess: BX.proxy(this.loadBlogResult, this)
	});
};

window.JCCatalogSocnetsComments.prototype.loadBlogResult = function(result)
{
	if (BX.type.isNotEmptyString(result))
		BX.adjust(this.services.blog.obBlogCont, { html: result });
};

window.JCCatalogSocnetsComments.prototype.loadFB = function()
{
	var width;

	if (this.services.facebook.obFBParentCont && this.services.facebook.obFBContWidth)
	{
		width = parseInt(this.services.facebook.obFBParentCont.offsetWidth, 10);
		if (!isNaN(width) && width > 20)
		{
			BX.adjust(this.services.facebook.obFBContWidth, { attrs: { 'data-width': (width-20) } });
			this.services.facebook.currentWidth = width;
		}

		if (!this.services.facebook.obFBjSDK)
		{
			this.services.facebook.obFBjSDK = true;
			BX.defer(BX.proxy((function(d, s, id, fbpath) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id))
				{
					return;
				}
				js = d.createElement(s); js.id = id;
				js.src = fbpath;
				fjs.parentNode.insertBefore(js, fjs);
			}(document, "script", this.settings.facebook.facebookJSDK, this.settings.facebook.facebookPath)), this));
		}
	}
};

window.JCCatalogSocnetsComments.prototype.getFBParentWidth = function()
{
	var width = 0;
	if (!!this.services.facebook.obFBParentCont)
	{
		width = parseInt(this.services.facebook.obFBParentCont.offsetWidth, 10);
		if (isNaN(width))
			width = 0;
	}
	return width;
};

window.JCCatalogSocnetsComments.prototype.setFBWidth = function(width)
{
	var obFrame = null,
		src,
		newSrc;

	if (
		this.serviceList.facebook &&
		this.services.facebook.currentWidth !== width &&
		width > 20 &&
		!!this.services.facebook.obFBContWidth
	)
	{
		if (!!this.services.facebook.obFBContWidth.firstChild && !!this.services.facebook.obFBContWidth.firstChild.fitrstChild)
		{
			obFrame = this.services.facebook.obFBContWidth.firstChild.fitrstChild;
			if (!!obFrame)
			{
				src = obFrame.getAttribute("src");
				newSrc = src.replace(/width=(\d+)/ig, "width="+width);
				BX.adjust(this.services.facebook.obFBContWidth, { attrs: { 'data-width': (width-20) } });
				this.services.facebook.currentWidth = width;
				BX.style(this.services.facebook.obFBContWidth.firstChild, 'width', width+'px');
				BX.adjust(obFrame, { attrs : { src: newSrc }, style: { width: width+'px' } });
			}
		}
	}
};

window.JCCatalogSocnetsComments.prototype.onResize = function()
{
	if (this.serviceList.facebook)
		this.setFBWidth(this.getFBParentWidth());
};

window.JCCatalogSocnetsComments.prototype.onClick = function()
{
	var target = BX.proxy_context,
		index = -1,
		i;

	for (i = 0; i < this.obTabList.length; i++)
	{
		if (target.id === this.obTabList[i].tabId)
		{
			index = i;
			break;
		}
	}
	if (index > -1)
	{
		if (index !== this.currentTab)
		{
			this.hideActiveTab();
			this.currentTab = index;
			this.showActiveTab();
		}
	}
};

window.JCCatalogSocnetsComments.prototype.hideActiveTab = function()
{
	BX.removeClass(this.obTabList[this.currentTab].tab, 'active');
	BX.addClass(this.obTabList[this.currentTab].cont, 'tab-off');
	BX.addClass(this.obTabList[this.currentTab].cont, 'hidden');
};

window.JCCatalogSocnetsComments.prototype.showActiveTab = function()
{
	BX.onCustomEvent('onAfterBXCatTabsSetActive_'+this.tabsContId,[{activeTab: this.obTabList[this.currentTab].id}]);
	BX.addClass(this.obTabList[this.currentTab].tab, 'active');
	BX.removeClass(this.obTabList[this.currentTab].cont, 'tab-off');
	BX.removeClass(this.obTabList[this.currentTab].cont, 'hidden');
};
})(window);
/* End */
;; /* /bitrix/templates/aspro-allcorp2/js/rating_likes.js?161097003710797*/
; /* /bitrix/templates/aspro-allcorp2/components/bitrix/catalog.comments/main/script.js?16109700377355*/

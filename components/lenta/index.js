var lenta = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el;

		var mid = p.mid;

		var currentComments = {}, w, essenseData, recomended = [], recommended, mestate;

		var commentsInited = {},
			shareInitedMap = {},
			shareInitingMap = {},
			loading = false,
			ended = false,
			players = {},
			sharesInview = [],
			scrolling = false,
			mscrolling = false,
			rendering = false,
			prevscroll = 0,
			playVideoTimer,
			ascroll = 0,
			ascrollel = null,
			newmaterials = 0,
			tempTimer,
		 	getPreviewTimer;

		var countshares = 0;

		var beginmaterial = null;
		var beginmaterialloaded = false;

		var errors = {
			comments : {
				content : "message empty",
				share : "hasn't share",
				messagelength : ">140",
				money : "hasn't money",
				network : "network error"
			},

			upvote : {
				share : "hasn't share",
				network : "network error"
			},

			complain : {
				share : "hasn't share",
				network : "network error"
			}
		}

		var actions = {
			clear : function(){

				countshares = 0;

				recomended = []
				currentComments = {}
				shareInitedMap = {}
				shareInitingMap = {}
				loading = false
				ended = false
				players = {}
				sharesInview = []
				scrolling = false
				mscrolling = false
				rendering = false
				prevscroll = 0
				playVideoTimer = null
				ascroll = 0
				ascrollel = null
				beginmaterial = null
				beginmaterialloaded = false
				ended = false;
				loaded = false;

				newmaterials = 0;

				

			},
			loadmore : function(){
				load.shares(function(shares, error){

					if(!shares){
						
					}
					else
					{
						renders.shares(shares, function(){

							renders.sharesInview(shares, function(){
						
							})

						}, {
							index : sharesInview.length
						})
					}


				})
			},
			removeAdditionalByScroll : function(){

				if(ascrollel){
					var s = $(window).scrollTop();

					if(Math.abs(s - ascroll) > 150){
						actions.additional(ascrollel, false)
					}
				}

			},
			additional : function(el, show){
				if(show){
					el.addClass('showAdditional')
					el.find('.subscribeWrapper').fadeIn();

					ascroll = $(window).scrollTop();
					ascrollel = el;
					window.addEventListener('scroll', actions.removeAdditionalByScroll);
				}
				else
				{
					el.removeClass('showAdditional')
					el.find('.subscribeWrapper').fadeOut();
					window.removeEventListener('scroll', actions.removeAdditionalByScroll);
				}
				
			},
			applyheight : function(iniH, curH, key){


				return

				var wn = w.scrollTop();
				var b = wn + Number(curH - iniH)

				var wh = $('html').height();

				if (wn == b) return

				mscrolling = true;

					w.scrollTop(b);	

					prevscroll =  b

				mscrolling = false;



				
				
			},

			applyheightEl : function(iniH, _el, key){

				if(!el || !el.shares) return

				if(!iniH || !_el.length) return

				var hc = _el.height()
				
				if(_el.length && w.scrollTop() > _el.offset().top) {

					actions.applyheight(iniH, hc, key)

					el.shares.css('height', 'auto')

					return hc;
				}

				if (el.shares)
					el.shares.css('height', 'auto')

				return hc;
			},

			stateAction : function(link, clbk){
				self.app.user.isState(function(state){

					if(state){
						clbk()
					}

					else
					{
						self.nav.api.load({
							open : true,
							id : 'authorization',
							inWnd : true,

							essenseData : {
								loginText : self.app.localization.e('llogin'),
								successHref : link,
								signInClbk : function(){

									if (clbk)
										clbk()
								}
							}
						})
					}

				})
			},
			initVideo : function(el, share){
				var pels = el.find('.js-player');
				var vel = el.find('.videoWrapper')


				if (pels.length)
				{		
					var h = el.height();	

					var s = {
						muted : true,
						//autoplay : true,
						resetOnEnd : true
					}

					if(share.settings.v == 'a'){
						s.muted = false;
						s.autoplay = false;
					}


					var player = new Plyr(pels[0], s)

					
					players[share.txid] || (players[share.txid] = {})


					players[share.txid].p = player
					players[share.txid].initing = true
					players[share.txid].el = vel
					players[share.txid].id = vel.attr('pid')


					player.on('ready', function(){

						players[share.txid].inited = true
						players[share.txid].inited = true

						h = actions.applyheightEl(h, el, 'video')
					})
				}
			},
			linksFromText : function(text){
				
				var r = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi; 

				var matches = text.match(r);

				if(matches && matches.length > 0){
					return matches[0]
				}
				
			},

			sendComment : function(comment, clbk){
				
				var id = comment.share.v

				var _el = el.c.find('#' + id);

				var error = _el.find('.error');

				self.sdk.node.transactions.create.commonFromUnspent(

					comment,

					function(tx, _error){

						topPreloader(100)

						if(!tx){
							error.html(errors.comments[_error])

							if (clbk)
								clbk(false)
						}
						else
						{
							if (clbk)
								clbk(tx)
						}

					}
				)
			},

			initCommentProcess : function(id){

				commentsInited[id] = true

				if(!currentComments[id]){
					currentComments[id] = new CommentShare();
					currentComments[id].share.set(id)
				}

				var _el = el.c.find('#' + id);

				var error = _el.find('.error');

				var textarea = _el.find('textarea');

				textarea.off('keyup')
				textarea.on('keyup', function(){

					var v = $(this).val()

					currentComments[id].message.set(v)

					if(!currentComments[id].url.v){

						var l = actions.linksFromText(v);

						if (l)
						{
							currentComments[id].url.set(l)
							renders.newCommentAttachement(id, 'url')
						}
					}
				})

				textarea.off('change')
				textarea.on('change', function(){

					var v = $(this).val()

					if(!currentComments[id].url.v){

						var l = actions.linksFromText(v);

						if (l)
						{
							currentComments[id].url.set(l)
							renders.newCommentAttachement(id, 'url')
						}
					}

				})


				_el.find('.leaveCommentCnt .panel .item').off('click').on('click', function(){
					var type = $(this).attr('embeding')

					actions.embeding(id, type)
				})

				_el.find('.leaveCommentCnt .post').off('click').on('click', function(){
					var e = currentComments[id].validation();

					

					if (e){
						error.html(errors.comments[e])
					}
					else
					{

						_el.find('.leaveCommentCnt').addClass('loading')

						error.html('')

						actions.sendComment(currentComments[id], function(r){

							_el.find('.leaveCommentCnt').removeClass('loading')

							if(r){

								var comment = currentComments[id].alias(r)

								self.app.platform.sdk.node.shares.storage.trx[id].comment(comment)

								delete currentComments[id];

								textarea.blur();
								textarea.val('');
								_el.find('.att').html('');

								actions.initCommentProcess(id)
								
							}
							
						})
					}
				})
			},

			

			embeding : function(id, type){

				var storage = currentComments[id].export(true)

				self.nav.api.load({
					open : true,
					id : 'embeding',
					inWnd : true,

					essenseData : {
						type : type,
						storage : storage,
						on : {
							added : function(value){

								currentComments[id][type].set(value)

								renders.newCommentAttachement(id, type)

							}
						}
					}
				})
			},

			///
			openPost : function(id, clbk){

				self.nav.api.load({
					open : true,
					href : 'post?s=' + id,
					inWnd : true,
					history : true,

					clbk : function(){					

						if (clbk)
							clbk();

					},

					essenseData : {
						share : id,

						like : function(share){
							renders.stars(share)
						}
					}
				})

			},

			sharesocial : function(id, clbk){
				var share = self.app.platform.sdk.node.shares.storage.trx[id];

				if (share){

					var url = 'https://pocketnet.app/'+self.app.nav.get.pathname()+'?s='+id+'&mpost=true' + '&ref=' + self.app.platform.sdk.address.pnet().address + '&address=' + (parameters().address || '')

					var m = share.caption || share.message;

					var nm = trimHtml(m, 20);

					var image = share.images[0];

					if (!image && share.url){
						var v = videoImage(share.url)

						if (v){
							image = v;
						}
					}

					self.nav.api.load({
						open : true,
						href : 'socialshare',
						history : true,
						inWnd : true,

						essenseData : {
							url : url,
							caption : 'Share publication in social',
							image : image,
							title : nm
						}
					})
				}
			},

			donate : function(id, clbk){
				var share = self.app.platform.sdk.node.shares.storage.trx[id];

				if (share){

					var userinfo = deep(app, 'platform.sdk.usersl.storage.' + share.address) || {
						address : share.address,
						addresses : []
					}

					var link = 'send?address=' + share.address + '&amount=1&message='
					+hexEncode(self.app.localization.e('postlabel') + ' &mdash; ' + (share.caption || share.message).substr(0, 20) + "...")
					+'&label=' + (userinfo.name || userinfo.address) + '&setammount=true'


					

					self.fastTemplate('donation', function(rendered){
						dialog({
							html : rendered,
							class : "one donation",

							btn1text : self.app.localization.e('dcancel'),

							clbk : function(el,d ){

								el.find('.pnetdnt').on('click', function(){
									self.nav.api.load({
										open : true,
										href : link,
										history : true
									})

									d.destroy()
								})

								el.find('.copy').on('click', function(){
									var a = $(this).closest('.address').find('.addr')

									copyText(a)

									sitemessage(self.app.localization.e('successfullycopiedaddress'))
								})

							}
						})
					}, {
						userinfo : userinfo
					})
				

				}
			},

			videoPosition : function(el){

				var work = el.find('.work');

				if(!el.hasClass('fullScreenVideo')){

					work.css('margin-top', '0px')

					return
				}

				var h = $(window).height();

				var wh = el.find('.videoWrapper').height() + 100;

				var d = (h - wh) / 2



				if (d > 0){
					work.css('margin-top', d + 'px')
				}
				else
				{
					work.css('margin-top', 0 + 'px')
				}

			},

			fullScreenVideo : function(id, clbk){

				if(!players[id]) return;

				//var share = self.app.platform.sdk.node.shares.storage.trx[id];

				var _el = el.c.find("#" + id)

				_el.addClass('fullScreenVideo')

				actions.videoPosition(_el)

				self.app.nav.api.history.addParameters({
					v : id
				})

				var player = players[id]

				if(!player.p.playing)
					player.p.play()

				player.p.muted = false

				self.app.actions.offScroll()

				if (clbk)
					clbk()


			},

			exitFullScreenVideo : function(id){
				//var share = self.app.platform.sdk.node.shares.storage.trx[id];

				var _el = el.c.find("#" + id)

				_el.removeClass('fullScreenVideo')

				actions.videoPosition(_el)

				var player = players[id]

				player.p.muted = true;

				self.app.nav.api.history.removeParameters(['v'])

				/*if (player.p.playing)
					player.p.pause()*/

				self.app.actions.onScroll()
			},

			like : function(obj, value, clbk){


				var upvoteShare = obj.upvote(value);

				if(!upvoteShare){
					self.app.platform.errorHandler('4', true)	

					if(clbk)
						clbk(false)

					return
				}

			
				self.sdk.node.transactions.create.commonFromUnspent(

					upvoteShare,

					function(tx, error){

						topPreloader(100)

						if(!tx){				


							upvoteShare.myVal = null;	
							obj.myVal = 0;	

							self.app.platform.errorHandler(error, true)	


							if(clbk)
								clbk(false)
							
						}
						else
						{

							if (clbk)
								clbk(true)
						}

					}
				)
			},

			complain : function(obj, clbk){

				var complainShare = obj.complain();

			
				self.sdk.node.transactions.create.commonFromUnspent(

					complainShare,

					function(tx, error){

						topPreloader(100)

						if(!tx){

							el.postWrapper.addClass('showError');

							self.app.platform.errorHandler(error, true)	
							
							if (clbk)
								clbk()
						}
						else
						{

							if (clbk)
								clbk(true)
						}

					}
				)
			},			

			

		
			openGallery : function(share, initialValue, clbk){
				
				var images = _.map(share.images, function(i){
					return {
						src : i
					}
				})

				var num = findIndex(images, function(image){

					if (image.src == initialValue) return true;						

				})

				self.app.nav.api.load({
					open : true,
					href : 'imagegallery?i=' + share.txid + '&num=' + (num || 0),
					inWnd : true,
					history : true,

					essenseData : {
						initialValue : initialValue,
						idName : 'src',
						images : images,

						gid : share.txid
					},

					clbk : function(){
						if (clbk)
							clbk()
					}
				})
			},

			///

			videosInview : function(players, action, nvaction){

				var ap = _.filter(players, function(p){
					if(p.inited && !p.playing && !p.stopped && p.el) return true
				})

				if(ap.length){
					playVideoTimer = slowMade(function(){

						ap = _.filter(ap, function(p){
							return p.el
						})

						var vs = _.map(ap, function(p){
							return p.el[0]
						})
						
						var inv = inView(el.c.find('.videoWrapper'), {
						
							offset : $(window).height() / 10,
							mode : 'all'
						})

						var id = null;

						if (inv.length > 0){

							var vel = $(inv[0]);

							id = vel.attr('pid')							


							var player = _.find(ap, function(p){
								return p.id == id
							})

							if(!id || !player) return

							

							if (player){

								setTimeout(function(){

									var inv = inView(vel, {
						
										offset : -100,
										mode : 'all'
									})

									if(inv.length){
										action(player, vel)
									}

								}, 320)

								

							}

							
							
						}

						var another = _.filter(ap, function(p){
							return p.id != id
						})

						if(another.length){
							nvaction(another)
						}


					}, playVideoTimer, 30)
				}

			},

			scrollToPost : function(id){
			
				_scrollTo($('#' + id))
				
			},
			
			sharesInview : function(shares, action, nvaction){

				var cscroll = w.scrollTop();

				if (shares.length && !mscrolling)

					getPreviewTimer = slowMade(function(){
						
						var els = el.c.find('.share');

						var _el = w; 

						var h = $(window).height() / 4
						
						var inv = inView(els, {
							inel : _el,
							offsetTop : h,
							offsetBottom : h,
							mode : 'line',
						})


						if (inv.length > 0){

							var invmap = {};
						
							var invshares = _.map(inv, function(el){
							
								var id = $(el).attr('id');

								return _.find(shares, function(s){
									return s.txid == id
								});
							})

							invshares = _.filter(invshares, function(is){
								if(!is.temp) return true
							})

							/*var i = $(inv[0]).attr('index')

							invshares = _.filter(shares, function(s, j){
								if(Math.abs(i - j) < 5) {
									invmap[s.txid] = true;
									return true
								}
							})*/
							
							//window.requestAnimationFrame(function(){

							scrolling = true;

							action(invshares, inv, function(){

								scrolling = false

								if(nvaction){
									var nvshares = _.filter(shares, function(s){
										if(!invmap[s.txid]) return true
									})

									nvaction(nvshares)
								}


							})

								

							//})
							
						}


					}, getPreviewTimer, 30)

			},

			complain : function(id){
				self.nav.api.load({
					open : true,
					id : 'complain',
					inWnd : true,

					essenseData : {
						item : 'post',
						obj : self.app.platform.sdk.node.shares.storage.trx[id],

						success : function(){
							
						}
					},

					clbk : function(){
						
					}
				})
			}
		}

		var events = {
			showmorebyauthor : function(){
				console.log('showmorebyauthor')

				$(this).closest('.authorgroup').find('.share').removeClass('hidden')

				$(this).remove()
			},
			metmenu : function(){
				var _el = $(this);

				var id = $(this).closest('.share').attr('id');
				var address = $(this).closest('.shareTable').attr('address')

				var d = {};

					d.share = self.app.platform.sdk.node.shares.storage.trx[id]

				self.fastTemplate('metmenu', function(rendered, template){

					self.app.platform.api.tooltip(_el, function(){

						d.share = self.app.platform.sdk.node.shares.storage.trx[id]
						d.mestate = mestate
						
						return template(d);

					}, function(el){

						el.find('.socialshare').on('click', function(){
							actions.sharesocial(id)

							_el.tooltipster('hide')	
						})

						el.find('.subscribe').on('click', function(){

							self.app.platform.api.actions.subscribe(address, function(tx, error){
								if(!tx){
									self.app.platform.errorHandler(error, true)	
								}
							})

							_el.tooltipster('hide')	
						})

						el.find('.unsubscribe').on('click', function(){

							self.app.platform.api.actions.unsubscribe(address, function(tx, error){
								if(!tx){
									self.app.platform.errorHandler(error, true)	
								}
							})

							_el.tooltipster('hide')	
						})

						el.find('.complain').on('click', function(){

							actions.complain(id)

							_el.tooltipster('hide')	

						})

						el.find('.donate').on('click', function(){

							actions.donate(id)

							_el.tooltipster('hide')	

						})

						

					})

				}, d)

				

			},
			resize : function(){

				var _el = el.c.find('.fullScreenVideo');

				if (_el.length > 0){
					actions.videoPosition(_el)
				}

				
			},	
			loadmorescroll : function(){
				if (

					($(window).scrollTop() + $(window).height() > $(document).height() - 400) 

					&& !loading && !ended) {

					actions.loadmore()

				}
			},
			sharesInview : function(e){

				
				actions.sharesInview(sharesInview, function(invshares, els, clbk){

					if(isMobile()) return

					var rooms = _.map(invshares, function(s){
						return s.txid + '_' + s.address
					})

					if(rooms.length){

						var room = rooms[0]

						var load = [room]

						if(isMobile()){
							load = rooms
						}


						self.app.platform.rtc.load.info([room], function(){

							if(isMobile()){
								renders.roomsinfo(rooms)
							}
							else
							{

								tempTimer = slowMade(function(){

									self.app.platform.sdk.chats.addTemp(room, 'share', deep(self.app.platform, 'rtc.storage.info.' + room + '.d.users_count') || 0)
								
								}, tempTimer, 30)

							}
						})

					}


					
					
					if(clbk)
						clbk();

				}, function(nvshares){

					
				})

				
			},

			videosInview : function(e){

				actions.videosInview(players, function(player, el, clbk){	

					if(!el.closest('.share').hasClass('showAdditional')){
						player.p.play()
					}

				}, function(players){
					
					_.each(players, function(player){

						player.p.muted = true;

						if (player.p.playing){
							player.p.stop()
						}
					})

				})

				
			},

			commentLike : function(){
				
				var id = $(this).closest('.comment').attr('id');
				var shareId = $(this).closest('.share').attr('id');

					actions.like(self.app.platform.sdk.node.shares.storage.trx[shareId].findComment(id))

					$(this).addClass('active')


			},

			toComments : function(){
				var id = $(this).closest('.share').attr('id');

				if(commentsInited[id]){
					var txt = $(this).closest('.share').find('textarea');

					_scrollTo(txt)

					txt.focus();
				}
				else
				{
					renders.comments(id, {

						init : true

					}, function(txt){

						if (txt)
							txt.focus()

					})
				}

			},

			initCommentProcess : function(){
				var _el = $(this).closest('.share');
				var id = _el.attr('id');

				if(!currentComments[id]){
					_el.find('.leavewrapper').addClass('active')

					actions.initCommentProcess(id);
				}

				
			},

			//

			getTransaction : function(){
				var id = $(this).closest('.share').attr('id');

				self.app.platform.sdk.node.transactions.get.tx(id)
			},

			like : function(){

				if (essenseData.authAction) {

					essenseData.authAction('like')

					return

				}

				var p = $(this).closest('.stars');

				if (p.attr('value')){
					return
				}

				var id = $(this).closest('.share').attr('id');
				var value = $(this).attr('value')

				var s = self.app.platform.sdk.node.shares.storage.trx[id]

				p.attr('value', value)
				p.addClass('liked')

				actions.stateAction('_this', function(){
					actions.like(s, value, function(r){
						if(r){
							

							s.scnt || (s.scnt = 0)
							s.score || (s.score = 0)


							s.scnt++;
							s.score = Number(s.score || 0) + Number(value);

							var v = Number(s.score) / Number(s.scnt) 


							p.find('.tstarsov').css('width', ((v / 5) * 100) + '%')
							p.closest('.itemwr').find('.count span.v').html(v.toFixed(1))

							renders.stars(s)

						}
						else
						{
							p.removeAttr('value')
							p.removeClass('liked')
						}
					})

				})


			},

			complain : function(){

				var p = $(this).closest('.share')
				
				var id = p.attr('id');

				actions.complain(id)
					
			},

			additional : function(){

				var _el = $(this).closest('.share');

				actions.additional(_el, !_el.hasClass('showAdditional'))

			},

			openGallery : function(){
				var id = $(this).closest('.share').attr('id');
				var src = $(this).attr('i')

				var share = self.app.platform.sdk.node.shares.storage.trx[id];

				if(!share){
					var temp = _.find(self.sdk.node.transactions.temp.share, function(s){
						return s.txid == id
					})


					share = new pShare();
					share._import(temp);
					share.temp = true;
					share.address = self.app.platform.sdk.address.pnet().address
				}

				actions.openGallery(share, src)
			},

			
			asubscribe : function(){
				var address = $(this).closest('.shareTable').attr('address')

				var _el = $(this).closest('.share')



				self.app.platform.api.actions.subscribe(address, function(tx, error){
					if(tx){
						
					}	
					else{
						self.app.platform.errorHandler(error, true)	
					}
					
				})
			},

			aunsubscribe : function(){
				var address = $(this).closest('.shareTable').attr('address')

				var _el = $(this).closest('.share')

				self.app.platform.api.actions.unsubscribe(address, function(tx, error){

					if(tx){
						_el.find('.shareTable').removeClass('subscribed');
					}	
					else{
						self.app.platform.errorHandler(error, true)	
					}
					
				})
			},

			exitFullScreenVideo : function(){
				var shareId = $(this).closest('.share').attr('id');

					actions.exitFullScreenVideo(shareId)
			},
			fullScreenVideo : function(){
				var shareId = $(this).closest('.share').attr('id');

					actions.fullScreenVideo(shareId)
			},
			openPost : function(){

				if (essenseData.authAction) {

					essenseData.authAction('like')

					return

				}				

				var shareId = $(this).closest('.share').attr('id');

					actions.openPost(shareId)
			},

			sharesocial : function(){
				var shareId = $(this).closest('.share').attr('id');

					actions.sharesocial(shareId)
			},

			donate : function(){
				if (essenseData.authAction) {

					essenseData.authAction('donate')

					return

				}

				var shareId = $(this).closest('.share').attr('id');

					actions.donate(shareId)
			},

			discussion : function(){
				if (essenseData.authAction) {

					essenseData.authAction('discussion')

					return

				}

				var shareId = $(this).closest('.share').attr('id');

				var share = self.app.platform.sdk.node.shares.getWithTemp(shareId)

				if (isMobile()){
					self.nav.api.load({
						open : true,
						id : 'discussions',
						history : true,

						clbk : function(){
							self.app.platform.sdk.chats.add(shareId + '_' + share.address, 'share')
						}
					})
				}
				else
				{
					self.app.platform.sdk.chats.add(shareId + '_' + share.address, 'share')
				}
			},

			loadmore : function(){
				actions.loadmore()
			},
			loadprev : function(){

				el.c.find('.shares').html('<div class="bspacer"></div>')
				el.c.removeClass('showprev')

				el.c.removeClass('loading');
				el.c.removeClass("sharesEnded")
				el.c.removeClass('sharesZero')

				actions.clear()

				make();

			}

		}	

		var renders = {
			roomsinfo : function(rooms){
				

				var h = function(count){

					if(!count){
						return ''
					}

					return '<b>' + count + '</b>'

				}

				_.each(rooms, function(id){

					var count = deep(self.app.platform, 'rtc.storage.info.' + id + '.d.users_count');

					var _id = id.split("_")[0]


					if(typeof count != 'undefined' && el.c)
					{
						var _el = el.c.find('#' + _id + " .discussion .count");
							_el.html(h(count))
					}

				})

			},
			newCommentAttachement : function(id, type){
				var _el = el.c.find('#' + id + " ." + type + "Wrapper");

				if(type == 'url'){

				}
			},
			shareSpacers : function(shares){

				_.each(shares, function(s){
					renders.shareSpacer(s)
				})
			},
			shareSpacer : function(share){

				if(shareInitedMap[share.txid] && !shareInitingMap[share.txid]/* && !deep(players, share.txid + '.initing')*/){

					var _el = el.shares.find("#" + share.txid);

					var h = _el.height()
					var hw = _el.find('.work').outerHeight()

					if (players[share.txid] && players[share.txid].inited){

						players[share.txid].p.destroy()
						players[share.txid].el = null
						players[share.txid].inited = false
					}


					shareInitedMap[share.txid] = false;
				
					el.shares.css('height', el.shares.outerHeight())

					_el.html('<div class="shareSpacer added"></div>')	

					_el.find('.shareSpacer').outerHeight(hw)					

					h = actions.applyheightEl(h, _el, 'space')
				}

				
			},
			share : function(share, clbk){

				var _el = el.shares.find("#" + share.txid);
				var h = _el.height()
				//var index = _el.attr('index');

				el.shares.css('height', el.shares.outerHeight())

				var added = _el.find('.added')
				var ah = 0;

				if(added.length) ah = added.outerHeight();

				shareInitingMap[share.txid] = true;

				self.shell({
					name :  'share',
					el : _el,
					data : {
						share : share,
						ed : essenseData,
						mestate : mestate
					}					

				}, function(p){

					var work = _el.find('.work');

					if (ah){

						work.outerHeight(ah)
					}

					shareInitedMap[share.txid] = true;	
					
					h = actions.applyheightEl(h, _el, 'share')

					if(!isMobile())

						p.el.find('.tooltip').tooltipster({
			                theme: 'tooltipster-light',
			                maxWidth : 600,
			                zIndex : 20,
			            }); 

					var action = function(action){

						if(shareInitedMap[share.txid]){
							action()
						}
						else
						{
							_clbk();
						}
						

					}

					var _clbk = function(){
						work.css('height', 'auto')
						shareInitingMap[share.txid] = false;					
											
						if (clbk)
							clbk();
					}

						
					action(function(){

						renders.stars(share)
						renders.url(p.el.find('.url'), share.url, share, function(){
						
							action(function(){

								renders.urlContent(share, function(){

									//

									actions.initVideo(p.el, share)

									

									if( _clbk)
										_clbk()

									action(function(){

										renders.images(share, function(){
											
											
										})

									});

								});

							})
					

						})

					})


					
				})

			},

			stars : function(share, clbk){

				if (!el.shares) return

				var _el = el.shares.find("#" + share.txid);

				if (_el.length){

					self.shell({
						name :  'stars',
						el : _el.find('.forstars'),
						data : {
							share : share
						}					

					}, function(p){


						fastars(p.el.find('.stars'))

						if (clbk)
							clbk()

					})

				}
				
			},

			sharesInview : function(shares, clbk){
				lazyEach({
					array : shares,
					//sync : true,

					action : function(p){
						var share = p.item;



						if(shareInitedMap[share.txid]){
							p.success()
						}
						else
						{
							shareInitedMap[share.txid] = true
							renders.share(share, p.success)
						}

						
					},

					all : {
						success : function(){
							clbk()
						}
					}
				})
			},

			shares : function(shares, clbk, p){

				if(!p) p = {};

				if(!p.inner) p.inner = append

				var tpl = 'groupshares';

				if (essenseData.author){
					tpl = 'shares'
				}
				
				self.shell({
					name :  tpl,
					inner : p.inner,
					el : el.shares,
					data : {
						shares : shares || [],
						index : p.index || 0
					},
					animation : false,

				}, function(p){

					if(p.inner == append){
						sharesInview = sharesInview.concat(shares)	
					}
					else
					{
						sharesInview = shares.concat(sharesInview)	
					}
				

					//events.sharesInview()				

					if (clbk)
						clbk();
				})
			},

			videoPreview : function(s, clbk){

				var sel = el.c.find('#' + s.txid)

				if(s.settings.v == "a"){
					var pl = sel.find('.plyrvideo')

					var map = [];

					$.each(pl, function(){

						var d = $(this);

						var obj = {
							type : d.attr('provider'),
							id : d.attr('eid')
						};

						map.push(videoImage(obj))

					})
				}
				else
				{
					if (clbk)
						clbk();
				}
			},

			images : function(s, clbk){

					if(!el.c) return

					var sel = el.c.find('#' + s.txid)

					var _el = sel.find(".image");
					var images = sel.find(".images");

					if(images.hasClass('active') || !_el.length || !images.length){

						if (clbk)
							clbk()

						return

					}

					var h = sel.height()

					_el.imagesLoaded({ background: true }, function(image) {

						if(s.settings.v != "a"){

							_.each(image.images, function(img, n){

								var _img = img.img;

								var el = $(image.elements[n]).closest('.imagesWrapper');
								var ac = '';

								var _w = el.width();
								var _h = el.height()

								if(_img.width > _img.height * 1.2 && !isMobile()){
									ac = 'w2'

									var w = _w * (_img.width / _img.height);

									el.width(_w * (_img.width / _img.height));
								}

								if(_img.height > _img.width * 1.2 || isMobile()){
									ac = 'h2'

									el.height(_w * (_img.height / _img.width))
								}

								if(ac){
									el.addClass(ac)
								}
								
							})

						}


						h = actions.applyheightEl(h, sel)

						var isclbk = function(){
							images.addClass('active')

							_el.addClass('active')

							h = actions.applyheightEl(h, sel)



							if (clbk)
								clbk()
						}

						if(!isMobile() && s.settings.v != 'a'){
							images.isotope({

								layoutMode: 'packery',
								itemSelector: '.imagesWrapper',
								packery: {
									gutter: 20
								},
								initLayout: false
							});

							images.on('arrangeComplete', function(){
			
								isclbk()

							});

							images.isotope()
						}
						else
						{
							isclbk()
						}
					

					});

				
			},

			leavecomment : function(shareId, clbk){

				self.shell({
					name :  'leavecomment',
					el : el.shares.find('#' + shareId + " .leaveCommentCnt"),
					data : {
					
					},

				}, function(p){

					var txt = p.el.find('textarea');

						txt.on('focus', events.initCommentProcess)

					autosize(txt);

					if (clbk)
						clbk(txt);
				})
			},

			commentslist : function(shareId, p, clbk){

				if(!p) p = {};

				self.shell({
					name :  'commentslist',
					el : el.shares.find('#' + shareId + " .commentsCnt"),
					inner : p.inner || append,
					data : {
						comments : p.comments || []
					},

				}, function(p){

					p.el.find('.commentLikeAction').on('click', events.commentLike)
					p.el.find('.usericoncmt').off('click').on('click', events.subscribe)

					if (clbk)
						clbk();
					
				})
			},

			comments : function(shareId, p, clbk){

				if(!p) p = {};

				p.comments || (p.comments = lastEls(self.app.platform.sdk.node.shares.storage.trx[shareId].comments || []), 1)
				p.init || (p.init = false);

				self.shell({
					name :  'comments',
					el : el.shares.find('#' + shareId + " .commentsWrapper"),
					data : {
					},

				}, function(_p){

					if(p.init)
					{
						renders.leavecomment(shareId, clbk)
						renders.commentslist(shareId, p)
					}
					else
					{
						if (clbk)
							clbk();
					}

					
				})
			},

			url : function(el, url, share, clbk){

				if(essenseData.nourlload){

					if (clbk)
						clbk()

					return

				}


				var og = self.app.platform.sdk.remote.storage[url];				

				var _el = el.closest('.share')

				var h = _el.height()

				self.shell({
					turi : 'share',
					name :  'url',
					el : el,
					data : {
						url : url,
						og : og,
						share : share
					},

				}, function(_p){


					h = actions.applyheightEl(h, _el, 'url')

					var images = _p.el.find('img');

					_p.el.find('img').imagesLoaded({ background: true }, function(image) {




						_.each(image.images, function(i, index){


							if(i.isLoaded){
								$(images[index]).addClass('active')

								if(i.img.naturalWidth > 500){
									_p.el.addClass('bigimageinlink')
								}
								
							}
							else
							{
								$(images[index]).closest('.image').css('display', 'none')
							}
						})

						h = actions.applyheightEl(h, _el, 'url')

						if (clbk)
							clbk()

					  	
					});

					

					

				})
			},

			urlContent : function(share, clbk){

				if(!el.c) return
				

				var url = share.url;

				if (url){

					var _el = el.c.find('#' + share.txid + " .url");

					var meta = self.app.platform.parseUrl(url);
					var og = self.app.platform.sdk.remote.storage[url];

					if (url && !og){

						if (meta.type == 'youtube' || meta.type == 'vimeo'){
							if (clbk)
								clbk()
						}
						else
						{
							self.app.platform.sdk.remote.get(url, function(og){

								if(og){
									renders.url(_el, url, share, clbk)
								}
								else
								{
									if (clbk)
										clbk()
								}

							})
						}
					}

					else
					{
						if(clbk)
							clbk()
					}

				}	

				else
				{
					if(clbk)
						clbk()
				}			

			},

			urlsContent : function(shares){


				_.each(shares, function(share){

					renders.urlContent(share)

				})

				

			},

			urls : function(urls, clbk){
				lazyEach({
					array : urls, 
					sync : true,
					action : function(p){

						renders.url(p.item.el, p.item.url, p.item.share, p.success)
					},

					all : {
						success : function(){																				

							if (clbk) 
								clbk()
						}
					}
				})
			}
		}

		var load = {
			recomended : function(clbk, firstshares){

				el.loader.fadeIn()

				el.c.addClass('loading');

				recomended = []

				if(!essenseData.author && !beginmaterial){

					self.app.platform.sdk.node.shares.recomended({}, function(shares){

						recomended = _.filter(shares, function(id){
							var fs = _.find(firstshares, function(s){
								if(s.txid == id) return true
							})

							if(!fs) return true;
						});

						self.app.platform.sdk.node.shares.users(shares, function(){
							if (clbk)
								clbk(recomended)
						})

					})
				}
				else
				{
					if (clbk)
						clbk(recomended)
				}

			},
			begin : function(clbk){
				if(beginmaterial && !beginmaterialloaded){
					self.app.platform.sdk.node.shares.getbyid(beginmaterial, function(shares){

						beginmaterialloaded = true;

						clbk(shares)
					})
				}
				else
				{
					clbk([])
				}
			},
			shares : function(clbk, cache){

				if (loading || ended) return

				el.loader.fadeIn()

				el.c.addClass('loading');

				loading = true;

				load.begin(function(bshares){

					var author = essenseData.author;

					var loader = 'common';

					if (recommended){

						if(recommended == 'recommended'){
							loader = 'recommended'
						}
						else
						{
							loader = 'common'
							author = '1';
						}

						
					}

					self.app.platform.sdk.node.shares[loader]({

						author : author,
						begin : beginmaterial || ''

					}, function(shares, error, pr){

						_.each(bshares, function(bs){
							if(bs)

								shares.unshift(bs)
						})

						if (essenseData.filter) {

							shares = _.filter(shares, essenseData.filter)

						}


						self.app.platform.sdk.node.shares.users(shares, function(){

							countshares = countshares + shares.length

							loading = false;

							if (!el.c)
								return

							if(!shares || !shares.length || shares.length < pr.count){							

								if(!beginmaterial && !countshares){
									el.c.addClass("sharesZero")
								}
								else
								{
									el.c.addClass("sharesEnded")
								}

								ended = true
							}

							el.loader.fadeOut()

							if (clbk)
								clbk(shares, error)

						})					

					}, cache)

				})

				
			},

			
		}

		var state = {
			save : function(){

			},
			load : function(){
				
			}
		}

		var initEvents = function(){

			window.addEventListener('scroll', events.sharesInview);
			window.addEventListener('scroll', events.videosInview);
			window.addEventListener('resize', events.resize);

			if(!essenseData.notscrollloading){
				window.addEventListener('scroll', events.loadmorescroll);
			}			

			el.c.on('click', '.stars i', events.like)
			el.c.on('click', '.complain', events.complain)
			el.c.on('click', '.imageOpen', events.openGallery)
			el.c.on('click', '.txid', events.getTransaction)

			if(!isMobile()){
				el.c.on('click', '.sharecaption', events.openPost)
				el.c.on('click', '.message', events.openPost)
			}
			
			el.c.on('click', '.showMore', events.openPost)
			
			el.c.on('click', '.videoTips', events.fullScreenVideo)
			el.c.on('click', '.exitFull', events.exitFullScreenVideo)
			
			//el.c.on('click', '.subscribe', events.subscribe)
			el.c.on('click', '.additional', events.additional)

			el.c.on('click', '.asubscribe', events.asubscribe)
			el.c.on('click', '.aunsubscribe', events.aunsubscribe)
			

			el.c.on('click', '.donate', events.donate)
			el.c.on('click', '.sharesocial', events.sharesocial)
			el.c.on('click', '.discussion', events.discussion)

			el.c.on('click', '.metmenu', events.metmenu)

			el.c.find('.loadmore button').on('click', events.loadmore)
			el.c.find('.loadprev button').on('click', events.loadprev)

			el.c.on('click', '.showmorebyauthor', events.showmorebyauthor)
			
			self.app.platform.sdk.node.shares.clbks.added.lenta = function(share){
				renders.shares([share], function(){
					renders.sharesInview([share], function(){
						
					})
				}, {
					inner : prepend
				})
			}

			self.app.platform.ws.messages.transaction.clbks.temp = function(data){

				if(data.temp){

					var s = _.find(sharesInview, function(sh){
						if(sh.txid == data.temp.txid) return true
					})

					if (s){

						s.temp = false

						s.scnt = "0"
						s.score = "0"
						s.myVal = 0

						shareInitedMap[s.txid] = false

						renders.sharesInview([s], function(){
							
						})

						
					}

				}
				
			}

			self.app.platform.ws.messages.event.clbks.lenta = function(data){

				if(data.mesType == 'upvoteShare' && data.share){

					var s = _.find(sharesInview, function(sh){
						if(sh.txid == data.share.txid) return true
					})

					if (s){

						renders.stars(s, function(){
							
						})

					}

				}
				
			}

			var shownewmaterials = function(c){
				if(!beginmaterial && recommended != 'recommended' && !essenseData.author){

					var a = 0;
					
					if (self.sdk.node.transactions.temp.share && self.sdk.node.transactions.temp.share.length){

						a = a - _.toArray(self.sdk.node.transactions.temp.share).length;
					}

					

					if(((c || 0) + a > 0)){

						newmaterials = newmaterials + (c || 0) + a;

						el.c.addClass('showprev')

						el.c.find('.countnew').html( "(" + newmaterials + ")" )
					}
				}
			}

			self.app.platform.ws.messages["newblocks"].clbks.newsharesLenta = function(data){

				shownewmaterials(data.cntposts)
				
			}

			self.app.platform.ws.messages["new block"].clbks.newsharesLenta = function(data){

				shownewmaterials(data['shares'])
				
			}

			self.app.platform.clbks.api.actions.subscribe.lenta = function(address){

				var addressEl = el.c.find('.shareTable[address="'+address+'"]')

				addressEl.addClass('subscribed');
			}

			self.app.platform.clbks.api.actions.unsubscribe.lenta = function(address){

				var addressEl = el.c.find('.shareTable[address="'+address+'"]')

				addressEl.removeClass('subscribed');
			}
			
		}

		var make = function(){

			load.shares(function(shares, error){

				if(!shares){
					//sitemessage(error)
				}
				else
				{

					if(beginmaterial){
						el.c.addClass('showprev')
					}

					renders.shares(shares, function(){
						renders.sharesInview(shares, function(){

							events.sharesInview()

							var p = parameters()

							if (p.s){
								actions.openPost(p.s, function(){
									actions.scrollToPost(p.p)
								})
							}

							if (p.i){
								var share = deep(self.app.platform, 'sdk.node.shares.storage.trx.' + p.i)
								var src = null;

								if (share){

									if(p.num){
										src = deep(share, 'images.' + p.num)
									}

									actions.openGallery(share, src)
								}

									
							}

							if(p.v){

								actions.scrollToPost(p.v)

								actions.fullScreenVideo(p.v, function(){

									
								})
								
							}
						
						})
		
						/*load.recomended(function(){

						}, shares)*/
					})
				}


			}, 'clear')

						
		}

		return {
			id : mid,

			primary : primary,

			getdata : function(clbk, p){
				newmaterials = 0;
				

				essenseData = p.settings.essenseData || {};

				actions.clear()

				

				var _s = parameters();

				beginmaterial = _s.s || _s.i || _s.v || null;

				if(_s.r) 	recommended = _s.r;

				else 		recommended = false;		

				self.app.platform.sdk.ustate.me(function(_mestate){

					mestate = _mestate || {}

					var data = {
						beginmaterial : beginmaterial,
						author : essenseData.author,
						recommended : recommended,

					};

					self.loadTemplate({
						name : 'share'
					}, function(){

						self.loadTemplate({
							turi : 'share',
							name : 'url'
						}, function(){

							self.loadTemplate({
								name : 'stars'
							}, function(){

								clbk(data);

							})

						})

						

					})
				})

				

			},

			destroy : function(){

				delete self.app.platform.sdk.node.shares.clbks.added.lenta
				delete self.app.platform.ws.messages.transaction.clbks.temp
				delete self.app.platform.ws.messages.event.clbks.lenta

				delete self.app.platform.ws.messages["new block"].clbks.newsharesLenta
			 	delete self.app.platform.clbks.api.actions.subscribe.lenta
				delete self.app.platform.clbks.api.actions.unsubscribe.lenta

				self.app.platform.sdk.chats.removeTemp()
								

				window.removeEventListener('scroll', events.videosInview);
				window.removeEventListener('scroll', events.sharesInview);
				window.removeEventListener('scroll', events.loadmorescroll);
				window.removeEventListener('resize', events.resize);

				el = {};
			},
			
			init : function(p){

				w = $(window)

				state.load();

				el = {};
				el.c = p.el.find('#' + self.map.id);
				el.shares = el.c.find('.shares');
				el.loader = el.c.find('.loader')


				initEvents();

				make();

				p.clbk(null, p);

				
			}
		}
	};



	self.run = function(p){

		var essense = self.addEssense(essenses, Essense, p);

		self.init(essense, p);

	};

	self.stop = function(){

		_.each(essenses, function(essense){

			essense.destroy();

		})

	}

	return self;
})();


if(typeof module != "undefined")
{
	module.exports = lenta;
}
else{

	app.modules.lenta = {};
	app.modules.lenta.module = lenta;

}
var video = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el;
		var allowedVideos = [{
			key : "311925017",
			width : 560,
			height : 315,

			source : 'vimeo',

			loc : {
				
				en : {
					title : "Pocketnet - Decentralized Social Network on the Blockchain",
					id : "311925017",
					description : "Pocketnet is a fully decentralized publishing and social platform. Based on the blockchain technology, it runs on a set of computers around the world, not controlled by any single entity.No corporation behind it to take fruits of your labor. All advertising revenue is split equally between node operators and those who publish highly rated content. Your subscribers always see your content, unless they decide to unsubscribe. Pocketnet is self-policed by the platform participants with good reputation. Nobody records your keystrokes, viewing habits or searches. Join The New Peer-To-Peer Internet: Go to Pocketnet.app and join for free now"
				}
			}

		}];

		var actions = {
			validateEmail : function(v){
				if(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(v)){
					return true;
				}
				else
				{
					return false;
				}
			},
			saveEmail : function(email, name, clbk, id){

				if(!id) id = '4'

				var _p = {
					Email : email,
					Name : name,
				}

				_p.Action || (_p.Action = 'ADDTOMAILLIST');
				_p.TemplateID || (_p.TemplateID = id);

				$.ajax({
					type: 'POST',
					url: 'https://pocketnet.app/Shop/AJAXMain.aspx',
					data: _p,
					dataType: 'json',
					success : function(){

						if (clbk)
							clbk();

					}
				});

			},
			joinSuccess : function(email){
				self.fastTemplate('joinSuccess', function(rendered){
					dialog({
						html : rendered,
						class : "one joinbeta",

						btn1text : 'Okay'
					})
				}, {
					email : email
				})
			},
			
			join : function(action){

				self.fastTemplate('join', function(rendered){

					dialog({
						html : rendered,

						wrap : true,

						success : function(d){

							var i = d.el.find('.email')
							var n = d.el.find('.name')

							var email = i.val();
							var name = n.val();

							if (actions.validateEmail(email) && name){

								actions.saveEmail(email, name)

								actions.joinSuccess(email, name)

								return true
							}
						},

						clbk : function(_el){

							var n = _el.find('.name')
							var i = _el.find('.email')

							var vl = function(){
								var email = i.val();
								var name = n.val();

								if(actions.validateEmail(email) && name){
									b.removeClass('disabled')

									return true;
								}
								else
								{
									b.addClass('disabled')
									return false;
								}
							}

							var b = _el.find('.btn1')
								b.addClass('disabled')
								b.on('click', function(){

								})

								n.focus()
								n.on('change', vl)
								n.on('keyup', vl)						
					
								i.on('change', vl)
								i.on('keyup', vl)
						},

						class : "one joinbeta"
					})

				}, {
					action : action
				})

				
			}
		}

		var events = {
			join : function(){
				actions.join()
			}
		}

		var container = null;

		var info;

		var setWidth = function(info, el)
		{
			var w = el.width();

			var c = info.width / info.height;

			var h = w / c;

			el.find("iframe").width(w);
			el.find("iframe").height(h);
		}

		var make = function(){

			pasteVideo();

			setWidth(info, el.container);
					
			el.container.find("iframe").fadeIn(200);
			el.c.find(".description").fadeIn(200);

		}

		var extend = function(info){
			var loc = deep(info, 'loc.en') || null;

			if (loc){
				info = _.extend(info, loc)
			}

		}

		var pasteVideo = function(){

			var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+info.id+'?rel=0&amp;autoplay=1" frameborder="0" allow="autoplay;" allowfullscreen></iframe>';
			

			if(info.source == 'vimeo'){
				code = '<iframe src="https://player.vimeo.com/video/'+info.id+'?title=0&byline=0&portrait=0" width="560" height="315" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'		
			}
			
			el.c.find('.container').html(code);

			if (info.description)
				el.c.find('.description').html(info.description);
		}

		return {
			primary : primary,

			getdata : function(clbk, p){

				var params = parameters();
					params.v || (params.v = '311925017')

				var allowed = _.find(allowedVideos, function(v){
					return v.key == params.v
				})

				var fail = function(){
					self.nav.api.load({
						open : true,
						href : 'page404',
						history : true
					})
				}

				if(!allowed){

					fail()

				}

				else
				{
					self.app.el.menu.addClass('logoview').addClass('landing');

					info = _.clone(allowed);

					extend(info);

					if(!info.id){

						fail();

					}
					else
					{
						clbk(info);
					}

					
				}
						
					
				
			},
			destroy : function(){
				el = {};
				self.app.el.menu.removeClass('logoview').removeClass('landing');
				self.app.el.app.removeClass('videoActive')
			},
			init : function(p){


				el = {};
				el.c = p.el.find('#' + self.map.id);
				el.container = el.c.find(".container");

				if (el.c.click)
					el.c.click();

				self.app.el.app.addClass('videoActive')

				el.c.find('.joinbeta').on('click', events.join)
				

				setTimeout(function(){

					make();
					p.clbk(null, p);

				}, 100)
				
			},

			animation : false
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
	module.exports = video;
}
else{

	app.modules.video = {};
	app.modules.video.module = video;

}
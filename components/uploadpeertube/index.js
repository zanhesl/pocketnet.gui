var uploadpeertube = (function(){

	var self = new nModule();

	var essenses = {};

	var Essense = function(p){

		var primary = deep(p, 'history');

		var el;

		var actions = {

		}

		var events = {
			
		}

		var renders = {

		}

		var state = {
			save : function(){

			},
			load : function(){
				
			}
		}

		var initEvents = function(){
			

		}

		return {
			primary : primary,

			getdata : function(clbk){

				var data = {};

				clbk(data);

			},

			destroy : function(){
				el = {};
			},
			
			init : function(p){

				state.load();

				el = {};
				el.c = p.el.find('#' + self.map.id);

				initEvents();

				p.clbk(null, p);
			},

			wnd : {
				header : "",
				buttons : {

					close : {
						class : "close",
						html : '<i class="fa fa-check"></i> Finish',
						fn : function(wnd, wndObj){
							var videoInputFile = wnd.find('.upload-video-file').prop('files');
							var videoError = wnd.find('.file-type-error');

							var videoWallpaperFile = wnd.find('.upload-video-wallpaper').prop('files');
							var wallpaperError = wnd.find('.wallpaper-type-error');

							var videoName = wnd.find('.upload-video-name').val();
							var nameError = wnd.find('.name-type-error');

							videoError.text('');
							wallpaperError.text('');
							nameError.text('');

							var filesArray = [];

							// validation
							if (!videoInputFile[0]) {
								videoError.text('No video selected');
								
								return;
							}
							if (!videoInputFile[0].type.includes('video')) {
								videoError.text('Incorrect video format');
								
								return;
							};

							filesArray.push(videoInputFile[0]);

							if (videoWallpaperFile[0]) {
								if (!videoWallpaperFile[0].type.includes('image')) {
									wallpaperError.text('Incorrect wallpaper format');
	
									return;
								};

								filesArray.push(videoWallpaperFile[0]);
							}
							if (!videoName) {
								nameError.text('Name is empty');

								return;
							}

							var filesWrittenArray = []

							lazyEach({
								array : filesArray,
								action : function(p){
									var filePeertube = p.item

									var fileReader = new FileReader();
									fileReader.onload = function(file) {
										console.log(file);
										filesWrittenArray.push(fileReader.result);
										p.success();
									};
									fileReader.readAsBinaryString(filePeertube);
								},
		
								all : {
									success : function() {
										console.log(filesWrittenArray);
									}
								}
							})
						}
					}

				},
				close : function(){

				},
				success : function(_wnd, _wndObj){
					wndObj = _wndObj;
					wnd = _wnd;
				},
				offScroll : true,
				noInnerScroll : true,
				class : 'uploadpeertube',


				swipeClose : true,
				swipeCloseDir : 'right',
				swipeMintrueshold : 30,
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
	module.exports = uploadpeertube;
}
else{

	app.modules.uploadpeertube = {};
	app.modules.uploadpeertube.module = uploadpeertube;

}
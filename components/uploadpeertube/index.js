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
						html : '<i class="fas fa-upload"></i> Upload',
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

							var filesWrittenObject = {};

							// validation
							if (!videoInputFile[0]) {
								videoError.text('No video selected');
								
								return;
							}
							if (!videoInputFile[0].type.includes('video')) {
								videoError.text('Incorrect video format');
								
								return;
							};

							filesWrittenObject.video = videoInputFile[0];

							if (videoWallpaperFile[0]) {
								console.log(videoWallpaperFile);
								if (videoWallpaperFile[0].type !== 'image/jpeg' || videoWallpaperFile[0].type !== 'image/jpg') {
									wallpaperError.text('Incorrect wallpaper format. Supported: .jpg, .jpeg');
	
									return;
								};

								filesWrittenObject.image = videoWallpaperFile[0];
							}
							if (!videoName) {
								nameError.text('Name is empty');

								return;
							}

							filesWrittenObject.name = videoName;

							self.app.peertubeHandler.uploadVideo(filesWrittenObject);
							// lazyEach({
							// 	array : filesArray,
							// 	action : function(p){
							// 		var filePeertube = p.item;
							// 		var fileType = filePeertube.type.split('/')[0];
							// 		var fileReader = new FileReader();
							// 		fileReader.onload = function(file) {
							// 			filesWrittenObject[fileType] = fileReader.result;
							// 			p.success();
							// 		};
							// 		fileReader.readAsBinaryString(filePeertube);
							// 	},
		
							// 	all : {
							// 		success : function() {
							// 			self.app.peertubeHandler.uploadVideo(filesWrittenObject);
							// 		}
							// 	}
							// })
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
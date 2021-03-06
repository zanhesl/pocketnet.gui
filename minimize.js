fs = require('fs');
_ = require('underscore');

require('./js/functions.js');
var uglifyJS = require("uglify-js");
 


var args = {
	test : false,
	prodaction : true,
	vendor : 89,
	path : '/'
}


var argcli = _.filter(process.argv, function(a){
	return a.indexOf('-') == 0
})

_.each(argcli, function(a){
	var prs = a.replace('-', '').split('=')

	if(!prs[0]) return

	if(!prs[1]) return

	try{
		args[prs[0]] = JSON.parse(prs[1])
	}
	catch(e){
		args[prs[0]] = prs[1]
	}
	
})

var mapJsPath = './js/_map.js';

console.log("run")
console.log(args)

var tpls = ['embedVideo.php', 'index_el.html', 'index.html', 'index.php', 'openapi.html', '.htaccess']
	

var vars = {
	test : {
		proxypath : '"https://test.pocketnet.app:8899/"',
		domain : 'test.pocketnet.app',
		test : '<script>window.testpocketnet = true;</script>',
		path : args.path
	},
	prod : {
		proxypath : '"https://pocketnet.app:8899/"',
		domain : 'pocketnet.app',
		test : '',
		path : args.path
	}
}


var VARS = args.test ? vars.test : vars.prod

fs.exists(mapJsPath, function (exists) { 
	if(exists) {

		var m = require(mapJsPath);

		var modules = {
			data : "",
			path : './js/mdls.js'
		}

		var join = {
			data : "",
			path : './js/join.min.js'
		}

		var vendor = {
			data : "",
			path : './js/vendor.min.js'
		}

		var cssmaster = {
			data : "",
			path : './css/master.css'
		}

		var exported = {
			data : "",
			path : '../matrix/src/components/events/event/metaMessage/exported.less'
			// path : './css/exported.less'
		}

		var _modules = _.filter(m, function(_m, mn){
			if(mn != "__sources" && mn != "__css" && mn != '__vendor') return true;
			
		})


		/*JOIN MODULES*/

		lazyEach({
			syncCallbacks : true,
			array : _modules,
			action : function(p){

				var module = p.item;

				var path = module.path || './';

				var _csspath = (module.csspath || module.path) || './';

				if(module.csspath) _csspath = "." + _csspath

				path = path.replace("..", '.')
				_csspath = _csspath.replace("..", '.')
			
				var modulepath = path + 'components/' + module.uri + '/index.js';
				var csspath = _csspath + 'components/' + module.uri + '/index.css';

				fs.exists(modulepath, function (exists) {
					if(exists){


						fs.readFile(modulepath, function read(err, data) {
							if (err) {
								throw err;
							}

							var minified = uglifyJS.minify(data.toString())
							

							if(!minified.error){
								data = minified.code
							}
							else
							{
								console.log('UglifyJS Fail: ' + minified.error, modulepath)
							}
							

							modules.data = modules.data + "\n /*_____*/ \n" + data;

							fs.exists(csspath, function (exists) {
								if(exists){

									console.log(csspath)

									fs.readFile(csspath, function read(err, data) {
										if (err) {
											throw err;
										}

										data = data.toString().replaceAll("../..", "..");

										cssmaster.data = cssmaster.data + "\n" + "/*" + csspath +"*/\n" + data;
										exported.data = exported.data + "\n" + "/*" + csspath +"*/\n" + data;

										p.success();
									})
								}

								else
								{
									throw "notexist (CSS) " + module.csspath + ": " + csspath
									p.success();
								}
							})


							
						});

					}
					else
					{
						console.log('module.uri', module.uri)
						throw "notexist (CSS) " + module.uri
					}
				})

			},
			
			all : {
				success : function(){

					console.log(modules.path)
			
					fs.writeFile(modules.path, modules.data, function(err) {

						if(err) {

							throw "Access not permitted " + modules.path
						}

						//console.log("Access permitted", item)

						var ar = _.clone(m.__sources || []);

						ar.push(modules.path.replace('./', ''));

						var ver = _.clone(m.__vendor || []);

						joinVendor(ver, function(){

							console.log("joinVendor DONE")

							joinScripts(ar, function(){

								console.log("joinScripts DONE")

								joinCss(function(){

									console.log("joinCss DONE")

									createTemplates()
								})
								
							});
							
						});

						
												
					});
				}
			}
		})

		var joinCss = function(clbk){
			if(m.__css)
			{

				var currentcssdata = ''

				lazyEach({
					sync : true,
					array : m.__css,
					action : function(p){

						var filepath = p.item;

						var path;

						if(filepath.indexOf("..") == -1) path = './'+ filepath;
						else path = filepath.replace("..", '.');				  				

						fs.exists(path, function (exists) {
						
							if(exists){

								console.log(path)

								fs.readFile(path, function read(err, data) {
									if (err) {
										throw err;
									}

									currentcssdata = currentcssdata + '\n' + data;

									p.success();
								});

							}
							else
							{
								throw "notexist (CSS) " + module.uri + ": " + path

							}
						})

					},
					
					all : {
						success : function(){
							cssmaster.data = currentcssdata + '\n' + cssmaster.data;

							exported.data = currentcssdata + '\n' + exported.data;
							exported.data = '.pocketnet_iframe{' + exported.data + '}'
							exported.data = exported.data.split('\n')

							exported.data = exported.data.map(item => {
								return item.replace(/\(max-width:640px\)/g, '(max-width:1920px)')
							})

							exported.data = exported.data.join('\n')

							fs.writeFile(cssmaster.path, cssmaster.data, function(err) {

								if(err) {
									throw "Access not permitted (CSS) " +  cssmaster.path
								}
										
								clbk();				
							});

							fs.writeFile(exported.path, exported.data, function(err) {

								if (err) {

									console.log("Access not permitted (LESS) " +  exported.path) 
								}
										
							});
						}
					}
				})
			}

			else
			{
				throw "m.__css"
			}
		}

		var joinScripts = function(ar, clbk){
			if(m.__sources)

				lazyEach({
					sync : true,
					array : ar,
					action : function(p){

						var filepath = p.item;

						var path;

						if(filepath.indexOf("..") == -1) path = './'+ filepath;
						else path = filepath.replace("..", '.');				  				

						fs.exists(path, function (exists) {
							//console.log(path)
							if(exists){

								console.log(path)

								fs.readFile(path, function read(err, data) {
									if (err) {
										throw err;
									}

									var minified = uglifyJS.minify(data.toString())

									if(!minified.error){
										data = minified.code
									}
									else
									{
										console.log('UglifyJS Fail: ' + minified.error, path)
									}
									

									join.data = join.data + "\n /*_____*/ \n" + data;

									p.success();
								});

							}
							else
							{
								throw "File doesn't exist " +  path
							}
						})

					},
					
					all : {
						success : function(){
							console.log(join.path)

							fs.writeFile(join.path, join.data, function(err) {

								if(err) {

									throw "Access not permitted (JS) " +  join.path
								}
										
								clbk();				
							});
						}
					}
				})

			else
				throw "Access not permitted (JS) " +  join.path
		}

		var joinVendor = function(ar, clbk){
			if(m.__vendor)

				lazyEach({
					sync : true,
					array : ar,
					action : function(p){

						var filepath = p.item;

						var path;

						if(filepath.indexOf("..") == -1) path = './'+ filepath;
						else path = filepath.replace("..", '.');				  				

						fs.exists(path, function (exists) {
							//
							if(exists){

								console.log(path)

								fs.readFile(path, function read(err, data) {
									if (err) {
										throw err;
									}

									var minified = uglifyJS.minify(data.toString())

									if(!minified.error){
										data = minified.code
									}
									else
									{
										console.log('UglifyJS Fail: ' + minified.error, path)
									}
									

									vendor.data = vendor.data + "\n /*_____*/ \n" + data;
									p.success();
								});

							}
							else
							{
								throw "File doesn't exist " +  path
							}
						})

					},
					
					all : {
						success : function(){

							console.log(vendor.path)

							fs.writeFile(vendor.path, vendor.data, function(err) {

								if(err) {

									throw "Access not permitted (JS) " +  vendor.path

								}
										
								clbk();				
							});
						}
					}
				})

			else{
				throw "File doesn't exist m.__vendor"
			}
		}

		var createTemplatedFile = function(tplname){
			/*WORK WITH INDEX*/
			var pth = './tpls/' + tplname + '.tpl'

			console.log("CREATING TEMPLATE: ", tplname)

			return new Promise((resolve, reject) => {

				fs.exists(pth, function (exists) {

					if(exists){
	
						fs.readFile(pth, {encoding: 'utf-8'}, function read(err, index) {
							if (err) {
								return reject(err)
							}
							var JSENV = "";
							var JS = "";
							var CSS = "";
							var VE = ""
	
							if(args.test){
								JSENV += '<script>window.testpocketnet = true;</script>';
							}

							if(args.path){
								JSENV += '<script>window.pocketnetpublicpath = "'+args.path+'";</script>';
							}
	
							if(args.prodaction)
							{
	
								JS += '<script join src="js/join.min.js?v='+rand(1, 999999999999)+'"></script>';
	
								VE = '<script join src="js/vendor.min.js?v='+args.vendor+'"></script>';
	
								CSS = '<link rel="stylesheet" href="css/master.css?v='+rand(1, 999999999999)+'">';
	
								index = index.replace(new RegExp(/\?v=([0-9]*)/g), '?v=' + rand(1, 999999999999));
							}
							else
							{
	
								JSENV += '<script>window.design = true;</script>';
								
								_.each(m.__sources, function(source){
									JS += '<script join src="'+source+'?v='+rand(1, 999999999999)+'"></script>\n';
								})
	
								_.each(m.__css, function(source){
									CSS += '<link rel="stylesheet" href="'+source+'?v='+rand(1, 999999999999)+'">\n';
								})	
	
								_.each(m.__vendor, function(source){
									VE += '<script join src="'+source+'?v='+args.vendor+'"></script>\n';
								})			            		
							}
							index = index.replace("__JSENV__" , JSENV);
							index = index.replace("__VE__" , VE);
							index = index.replace("__JS__" , JS);
							index = index.replace("__CSS__" , CSS);

							_.each(VARS, function(v, i){
								index = index.replaceAll("__VAR__." + i, v);
							})
	
							fs.writeFile('./' + tplname, index, function(err) {

								if (err) {
									return reject(err)
								}

								resolve()
								
							})
	
						});
	
					}
					else
					{
						return reject("not index tpl")
					}
				})

			})	

			
		}

		var createTemplates = function(){
			var promises = _.map(tpls, function(t){
				return createTemplatedFile(t)
			})

			return Promise.all(promises)
		}

		/**/
	}
	else
	{
		
	}
});



var regForjs = function(modulename, c)
{
	var ex = '<script join src=\"([\/.a-zA-Z0-9]*'+modulename+'.js)\?v=([0-9]*)\"><\/script>';
	if(c) ex = '<\!--' + ex + '-->';

	return ex;
}

rand = function(min, max)
{
  min = parseInt(min);
  max = parseInt(max);
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

String.prototype.replaceAll=function(a,b){return a?this.split(a).join(b):this};
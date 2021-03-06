var _ = require('underscore')
var f = require('../functions');
const Roy = require('./roy');

var Peertube = function(settings){
    var self = this

    const PEERTUBE_ID = 'peertube://';
    const SLASH = '/';

    var roys = {}

    var cache = {}

    var parselink = function (link) {

        var ch = link.replace(PEERTUBE_ID, '').split(SLASH);

        return {
          host: ch[0],
          id: ch[1],
        };

    };

    var getroy = function(host){

        var roy = null
        

        if (host){
            roy = roys[host] || _.find(roys, function(roy){
                return roy.find(host)
            })
        }

        if(!roy){
            var aroy = _.toArray(roys)
            if (aroy.length) roy = aroy[0]
        }

        return roy
    }

    self.timeout = function(){
        if(self.proxy.users() > 10){
            return 1500
        }

        return 30000
    }

    self.statsInterval = function(){
        if(self.proxy.users() > 10){
            return 60000
        }

        return 600000
    }

    self.request = function(method, data, host){

        var roy = getroy(host)

        if(!roy) return Promise.reject('roy')
       
        return roy.request(method, data)

    }

    self.api = {

        best : function({roy}){
            if(!roy) roy = 'default'

            roy = getroy(roy)

            if(!roy) return Promise.reject('roy')

            var best = roy.best()

            if(!best) return Promise.reject('best')

            return Promise.resolve(best.export())
        },

        video : function({url}){

            var parsed = parselink(url)

            if (!parsed.id) return Promise.reject('No id info received');
      
            return self.request('video', {id : parsed.id}, parsed.host).then((res) => {

              
                
                return Promise.resolve(res)
                
            }).catch((err) => {


                return Promise.reject(err);

            });
        },

        videos : function({urls}){  

            var result = {}

            return Promise.all(_.map(urls, function(url){

                return self.api.video({url}).then(r => {
                    result[url] = r.data

                    return Promise.resolve()
                }).catch(e => {

                    return Promise.resolve()

                })

            })).then(() => {
                return Promise.resolve(result)
            })
        }

    }

    self.addroy = function(urls, key){
        var roy = new Roy(self)

        roy.init(urls)

        roys[key] = roy
    }

    self.info = function(compact){
        var info = {}

        _.each(roys, function(roy){
            info = _.extend(info, roy.info(compact))
        })

        return info
    }

    self.init = function({urls}){
        self.addroy(urls, 'default')

        return Promise.resolve()
    }

    self.extendApi = function(api, cache){

        _.each(self.api, function(f, i){
            api[i] = {
                path : '/peertube/' + i,

                action : function(data){

                    var cachekey = 'peertube' + i
                    var cacheparameters = _.clone(data)

                    delete cacheparameters.ip
                    delete cacheparameters.ua
                    delete cacheparameters.signature

                    return new Promise((resolve, reject) => {
                        cache.wait(cachekey, cacheparameters, function (waitstatus) {
							resolve(waitstatus);
						});
                    })
                    
					.then((waitstatus) => {

						var cached = cache.get(cachekey, cacheparameters);

						if (cached)
							return Promise.resolve({
								data: cached,
								code: 208,
							});

                        return f(data).then(r => {
                            cache.set(cachekey, cacheparameters, r);

                            return Promise.resolve({
                                data : r,
                                code: 200
                            })
                        })

					}).catch(e => {

                        console.log("E", e)

                        return Promise.reject({
                            data: e,
                            code: 400,
                        })
                    })
                }
            }
        })

    }

    return self
}

module.exports = Peertube;
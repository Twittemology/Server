var request = require('superagent');
var async = require('async');
var _ = require('underscore');
var API_KEY = '09C43A9B270A470B8EB8F2946A9369F3';
var BING_KEY = 'AgrIS_e1yz4TZhJcQY9WkD752JmiOX_6TD5NVIlJ_W0UPLix1cVyZlsRc0L7Ze7X';
var nextChunkTime = 0;

function queryBing(q, callback){
	var url = "http://dev.virtualearth.net/REST/v1/Locations/"+encodeURIComponent(q)+"?o=json&key="+BING_KEY;
	return request.get(url, function(err, response){
		return callback(err, response, url);
	});
}

function getLocation(tweet, i, done){
	if(!tweet.location || tweet.location == undefined){
		tweet.location = ""
	}
	if(tweet.coordinates){
		tweet.location = tweet.coordinates.coordinates
		return done()
	}
	if(tweet.location.match(/-?\d+\.\d+\s-?\d+\.\d+/)){ // Already a lat/long coordinate
		tweet.location = tweet.location.split(' ');
		console.log('reg1')
		return done()
	}
	if(tweet.location.match(/(\W?D\W?M\W?V\W?)|(dc)|(district)/i)){ // Common DMV
		console.log('reg2', tweet.location)
		tweet.location = [38.90618896484375+((Math.random()-0.5)*1.5), -77.01726531982422+((Math.random()-0.5))*1.2]
		return done()
	}
	if(tweet.location.match(/(nova)|(fairfax)|(virginia)|(pg)/)){
		console.log('reg3')
		tweet.location = [38.84178924560547+(Math.random()-0.5)*1.2, -77.30886840820312+(Math.random()-0.5)*1.1]
		return done()
	}
	
	queryBing(tweet.location, function(err, res, url){
		if(err){
			console.log("ERROR!", err);
		}
		try{
			var response = typeof res.body == 'object' ? res.body : JSON.parse(res.body);
			var loc;
			if(response.resourceSets && response.resourceSets[0].resources)
				loc = response.resourceSets[0].resources[0];
			if(loc){
				console.log('loc1')
				tweet.location = loc.point
			}else{
				queryBing(tweet.timezone, function(err, res){
					if(err){
						console.log("ERROR!", err)
					}
					if (res) {
						var response = typeof res.body == 'object' ? res.body : JSON.parse(res.body);
						var loc;
						if(response.resourceSets && response.resourceSets[0].resources)
							loc = response.resourceSets[0].resources[0];
						if(loc){
							console.log('loc2')
							tweet.location = loc.point;
						}else if(tweet.timezone){
							if(tweet.timezone.indexOf("Eastern") != -1){
								tweet.location = [20.0+(Math.random()-0.5)*20, -82.0+(Math.random()-0.5)*10]
							} else if(tweet.timezone.indexOf('Central') != -1){
								tweet.location = [20.0+(Math.random()-0.5)*20, -97.0+(Math.random()-0.5)*10]
							}else if(tweet.timezone.indexOf('Mountain') != -1){
								tweet.location = [20.0+(Math.random()-0.5)*20, -112.0+(Math.random()-0.5)*10]
							}else if(tweet.timezone.indexOf("Pacific") != -1){
								tweet.location = [20.0+(Math.random()-0.5)*20, -127.0+(Math.random()-0.5)*10]
							}
						}else{
							console.log("no locs found")
							delete tweet[i]
						}
					}
					else {
						console.log("No res, possible timeout?");
					}
				});
			}
			return done()
		}catch(e){
			console.log("ERROR PARSING JSON", e);
			delete tweet[i]
			return done()
		}
	});
}

function loadTweets(query, offset, mintime, callback){
	request.get("http://otter.topsy.com/search.json")
		.query({
			apikey: API_KEY,
			_: 1410631253865,
			q: query,
			offset: offset,
			perpage: 20000,
			limit: 20000,
			mintime: mintime,
			sort_method: '-date',
			allow_lang: 'en',
			include_enrichment_all: 0,
			call_timestamp: 1410630740966,
			latlong: 1
		})
		.end(function(err, response){
			if(err){
				return res.send(500, err);
			}

			var result = JSON.parse(response.text).response
			total = result.total;
			var ids = []
			result.list.forEach(function(tweet, i){
				var link = tweet.trackback_permalink;
				result.list[i].id = link.substring(link.lastIndexOf('/')+1);
				ids.push(result.list[i].id);
			});
			var batch = [];
			if(ids.length == 0)
				console.log("IDS empty!", response.text);
			// else
			// 	console.log("IDS ok!", result.offset);
			var idCopy = ids;
			while(ids.length > 0){
				(function(){
					var temp = ids.splice(0, 9)
					batch.push(function(done){
						request.get('http://api.topsy.com/v2/content/tweet.json')
						.query({
							apikey: API_KEY,
							postids: temp.join(',')
						}).end(function(err, response){
							var tweets = [];
							var split = response.text.split('\n');
							split.forEach(function(s){
								if(s.length > 0)
									tweets.push( JSON.parse(s) )
							});
							done(null, tweets)
						});
					});
				})()
			}
			async.parallel(batch, function(err, results){
				var tweets = [].concat.apply([], results);
				// if(tweets.length == 0){
				// 	console.log("FAIL - ", results)
				// }
				return callback(null, {tweets: tweets, total: total});
			});
		});
}

function loadChunk(query, mintime, callback){
	loadTweets(query, 0, mintime, function(err, result){
		console.log("TOTAL NUMBER", result.total);
		console.log("MIN TIME", new Date(mintime*1000));
		var tweets1 = result.tweets;

		var soFar = result.tweets.length,
			total = result.total;

		var batch = [];
		for(var i=1; 99*i<1000; i++){
			(function(i){
				batch.push(function(done){
					loadTweets(query, 99*i, mintime, function(err, result){
						return done(null, result.tweets);
					});
				});
			})(i);
		}

		async.parallel(batch, function(err, results){
			var tweets = [].concat.apply(tweets1, results);

			// console.log("Pre-clean tweets length", tweets.length);

			for(var i=0; i<tweets.length; i++){
				if(tweets[i].status && tweets[i].status != 200){
					tweets.slice(i, 1)
					continue;
				}
				if(new Date(tweets[i].created_at)/1 > nextChunkTime){
					nextChunkTime = new Date(tweets[i].created_at)/1000
				}

				delete tweets[i].contributors
				delete tweets[i].source
				delete tweets[i].text
				delete tweets[i].in_reply_to_status_id_str
				delete tweets[i].in_reply_to_user_id_str
				delete tweets[i].entities
				delete tweets[i].in_reply_to_status_id
				delete tweets[i].id_str
				delete tweets[i].in_reply_to_user_id
				tweets[i].location = tweets[i].user.location
				tweets[i].screen_name = tweets[i].user.screen_name
				tweets[i].user_id = tweets[i].user.id
				tweets[i].user_name = tweets[i].user.user_name
				tweets[i].timezone = tweets[i].user.time_zone
				delete tweets[i].user
			}

			return callback(err, {tweets: tweets, total: total})
		});
	});
}

module.exports = function(app, db){
	app.get('/search', function(req, res){
		var startTime = new Date();
		if( !req.param('q') )
			return res.send(400, "Query required")

		var query = req.param('q')
		db.searches.findOne({'query': query}, function(err, cachedResult){
			
			if( cachedResult && (new Date() - cachedResult.date) < 262974000 ){ // One month expiry
				console.log("Falling back on cached result for query", cachedResult.query)
				return setTimeout(function(){
					res.json(cachedResult.tweets)
				}, 1000)
			}

			var chunkQueue = []
			loadChunk(query, nextChunkTime, function(err, result){
				for(var i=1; i<parseInt(result.total/990); i++){
					(function(){
						chunkQueue.push(function(done){
							// console.log("Loading chunk with mintime at", nextChunkTime)
							loadChunk(query, nextChunkTime, function(err, result){
								return done(null, result.tweets);
							});
						});
					})();
				}

				async.series(chunkQueue, function(err, result){
				 	var tweets = [].concat.apply([], result);
					console.log("Final tweets length", tweets.length);
					tweets = _.sortBy(_.uniq(tweets, _.iteratee('id')), _.iteratee('created_at'));
					console.log("Unique tweet length:", tweets.length);
					console.log("Responded in", (new Date() - startTime)*1000.0, "s")
					console.log("next time is", nextChunkTime)

					var batch = [];

					tweets.forEach(function(tweet, i){
						batch.push(function(done){
							getLocation(tweet, i, done);
						});
					});

					async.parallelLimit(batch, 1400, function(err, success){
						if(err){
							console.log("ERROR", err)
						}
						res.json(tweets)
						console.log("Caching query results")
						db.searches.save({
							query: query,
							tweets: tweets,
							date: new Date()
						});
					});
				});
			});
		});
	});
}
var mongo_url = process.env.NODE_ENV == 'production' ? 'mongodb://IbmCloud_mvf275i9_8rvqjmdj_3gvdbsdm:o1cbHg5jrn2K9jbwmXFvopXK3a_feE-7@ds035760.mongolab.com:35760/IbmCloud_mvf275i9_8rvqjmdj' : 'twittemology';
var express = require('express'),
	request = require('superagent'),
	db = require('mongojs')(mongo_url, ['searches']),
	app = express();



app.set('views', __dirname+'/views');

app.use( express.static(__dirname+'/static') )

require('./search')(app, db);


app.listen(4000)
var express = require('express'),
	request = require('superagent'),
	db = require('mongojs')('twittemology', ['searches']),
	app = express();

app.set('views', __dirname+'/views');

app.use( express.static(__dirname+'/static') )

require('./search')(app, db);


app.listen(4000)
var express = require('express'),
	request = require('superagent'),
	db = require('mongojs')('twittemology', ['searches']),
	app = express();

require('./search')(app, db);

app.get('/', function(req, res){
	res.send("App is running");
})

app.listen(4000)
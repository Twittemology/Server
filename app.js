var express = require('express'),
	request = require('superagent'),
	db = require('mongojs')('twittemology', ['searches']),
	app = express();

require('./search')(app, db);

app.listen(4000)
request = superagent;

var n = function(x) { return x; }

new Dragdealer('draggable', {
  animationCallback: function(x, y) {
    document.querySelector('.trackerCont').innerHTML = n(x);
  }
});

document.querySelector('.infoCont').addEventListener('click', function() {
	document.querySelector('.infoPane').classList.remove('hide');
	document.querySelector('.infoPane').classList.remove('fadeOutUpBig');
	document.querySelector('.infoPane').classList.add('animated', 'fadeInDownBig');
})

document.querySelector('.cancelIcon').addEventListener('click', function() {
	document.querySelector('.infoPane').classList.add('fadeOutUpBig');
})

document.querySelector('.searchField').addEventListener("focus", function() {
	document.getElementById("map").classList.add('blurred');
})

document.querySelector('.buttonCont').addEventListener('click', openMap);
document.querySelector('.searchField').addEventListener('keypress', function(e){
	if(e.keyCode == 13){
		openMap()
	}
});

function openMap(){
	[].forEach.call( // Fade out search dialogue
		document.querySelectorAll(".searchGroup"),
		function(elem) { elem.classList.add('fadeOutT') }
	);

	document.querySelector('.loadingSpinner').classList.remove('hide'); // Throw loading symbol
	map.setView([38.828, -96.557], 5); // Position map
	var term = document.querySelector('.searchField').value; // extract term from field
	loadData(term, function(d) { // Load everything from backend
		document.getElementById("map").classList.remove('blurred'); // On load, undo blur
		document.querySelector('.loadingSpinner').classList.add('hide');
		document.querySelector('.smallSearchField').classList.remove('hide');
		document.querySelector('.smallSearchField').classList.add('fadeInT'); // Fade in small search dialogue
		document.querySelector('.timeline').classList.remove('hide')
		document.querySelector('.timeline').classList.add('fadeInT'); // Fade in timeline search dialogue
		initTimeline(d); // start timeline
		document.querySelector('.smallSearchField').value = term; // Populate small search dialogue with term
	});
}

function loadData(term, callback) {
	socket.emit('query', term)
	var data = [];
	socket.on('tweets', function(tweets){
		console.log("%s tweets recieved!", tweets.length, tweets)
		data = data.concat(tweets);
	});	
	var timeout = false;
	socket.on('progress', function(numLeft){
		if(numLeft == 0 && data.length != 0){
			console.log("Last tweet has arrived.");
			callback(data)
			clearTimeout(timeout)
		}
		else console.log("%s tweets remaining", numLeft)

		if(!timeout) setTimeout(function(){
			callback(data)
		}, 30*1000)
	});
}

function initTimeline(data) {
	// Figure out mins and maxes
	var minPos = 0;
	var maxPos = 1;  // Slider quirk, x is in range of [0,1]

	var minDate = new Date()*1; // now
	var maxDate = 1; // epoch
	for (var i = 0; i < data.length; i++) {
		if (new Date(data[i].created_at)*1 < minDate) { minDate = new Date(data[i].created_at)*1; }
		if (new Date(data[i].created_at)*1 > maxDate) { maxDate = new Date(data[i].created_at)*1; }
	}

	n = normalizeToDate(minPos, maxPos, minDate, maxDate)
}

function normalizeToDate(minPos, maxPos, minDate, maxDate) {
	return function(n) {
		var posRange = maxPos - minPos;
		var dateRange = maxDate - minDate;
		var posRatio = (n + minPos) / maxPos;
		var equivDate = posRatio * maxDate;

		console.log(posRange, dateRange, posRatio, equivDate);

		return new Date(equivDate);
	}
}

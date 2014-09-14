var currData;
var tPInd = 0;

var timelineDeltaT;

request = superagent;
var mapOpen = false;

var dd;
var tP = 0;

var n = function(x) { return x; }

function parseDate(n) {
	return  n == 0 ? "January" : 
				  n == 1 ? "February" :
				  n == 2 ? "March" :
				  n == 3 ? "April" :
				  n == 4 ? "May" :
				  n == 5 ? "June" :
				  n == 6 ? "July" :
				  n == 7 ? "August" :
				  n == 8 ? "September" :
				  n == 9 ? "October" :
				  n == 10 ? "November" :
				  "December";
}

document.querySelector('.infoCont').addEventListener('click', function() {
	document.querySelector('.infoPane').classList.remove('hide');
	document.querySelector('.infoPane').classList.remove('fadeOutUpBig');
	document.querySelector('.infoPane').classList.add('animated', 'fadeInDownBig');
})

document.querySelector('.cancelIcon').addEventListener('click', function() {
	document.querySelector('.infoPane').classList.add('fadeOutUpBig');
})

document.querySelector('.searchField').addEventListener("focus", function() {
	if (!mapOpen) { document.getElementById("map").classList.add('blurred'); }
})

document.querySelector('.buttonCont').addEventListener('click', openMap);
document.querySelector('.searchField').addEventListener('keypress', function(e){
	if(e.keyCode == 13){
		openMap()
	}
});

function openMap(){
	mapOpen = true;

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
		document.querySelector('.timeline').style.display = "block";
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
	currData = data;

	// Figure out mins and maxes
	var minPos = 0;
	var maxPos = 1;  // Slider quirk, x is in range of [0,1]

	var minDate = new Date()*1; // now
	var maxDate = 1; // epoch
	for (var i = 0; i < data.length; i++) {
		if (new Date(data[i].created_at)*1 < minDate) { minDate = new Date(data[i].created_at)*1; }
		if (new Date(data[i].created_at)*1 > maxDate) { maxDate = new Date(data[i].created_at)*1; }
	}

	n = normalizeToDate(minPos, maxPos, minDate, maxDate);

	var d = n(0)
	document.querySelector('.trackerCont').innerHTML = (d ? parseDate(d.getMonth()) : "n") + " " + (d ? d.getFullYear() :  "a");

	dd = new Dragdealer('draggable', {
		horizontal: true,
	  callback: function(x, y) {
	  	var d = n(x);
	    document.querySelector('.trackerCont').innerHTML = (d ? parseDate(d.getMonth()) : "n") + " " + (d ? d.getFullYear() :  "a");

	    if (x == 0 && tP >= 1) {
	    	tP = 0;
	    	tPInd = 0;
	    	timelineDeltaT = Date.now();
				window.requestAnimationFrame(animateTimeline);
	    }
	  }
	});

	timelineDeltaT = Date.now();
	window.requestAnimationFrame(animateTimeline);
}

function animateTimeline() {
	var dt = Date.now() - timelineDeltaT;

	tP += 0.00005*dt;
	dd.setValue(tP, 0, true);

  var d = n(tP);
  document.querySelector('.trackerCont').innerHTML = (d ? parseDate(d.getMonth()) : "n") + " " + (d ? d.getFullYear() :  "a");

  checkBlits();

	if (tP <= 1) {
		timelineDeltaT = Date.now();
		window.requestAnimationFrame(animateTimeline);
	}
}

function checkBlits() {
	 if (currData[tPInd]) {
	 	var d = n(tP);
  	while (new Date(currData[tPInd].created_at) < d) {
    	if (new Date(currData[tPInd].created_at) < d) {
    		if (tPInd % 15 == 0) {
			  	var item = currData[tPInd];
			  	console.log(item.location)
			  	if(typeof item.location == 'string'){
			  		item.location.replace(/\D/g, '')
			  		item.location = item.location.split(',')
			  	}
			  	try{
			  		blit(item.location[0] || null, item.location[1] || null);
					}catch(e){
						console.log("ERROR", e)
					}
				}
				tPInd++;
    	}
    }
  }
  else {
  	console.log(currData[tPInd]);
  }
}

function normalizeToDate(minPos, maxPos, minDate, maxDate) {
	return function(n) {
		var posRange = maxPos - minPos;
		var dateRange = maxDate - minDate;
		var posRatio = (n + minPos) / maxPos;
		var equivDate = (posRatio * dateRange) + minDate;

		//console.log(posRange, maxDate, minDate, posRatio, equivDate);

		return new Date(equivDate);
	}
}

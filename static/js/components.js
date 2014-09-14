var n = function(x) { return x; }

new Dragdealer('draggable', {
  animationCallback: function(x, y) {
    document.querySelector('.trackerCont').innerHTML = Math.round(n(x));
  }
});

request = superagent;

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
		function(elem) { elem.classList.add('fadeOut') }
	);

	document.querySelector('.loadingSpinner').classList.remove('hide'); // Throw loading symbol
	map.setView([38.828, -96.557], 5); // Position map
	var term = document.querySelector('.searchField').value; // extract term from field
	loadData(term, function(d) { // Load everything from backend
		document.getElementById("map").classList.remove('blurred'); // On load, undo blur
		document.querySelector('.smallSearchField').classList.remove('hide').add('fadeIn'); // Fade in small search dialogue
		document.querySelector('.timeline').classList.remove('hide').add('fadeIn'); // Fade in timeline search dialogue
		initTimeline(); // start timeline
		document.querySelector('.smallSearchField').value = term; // Populate small search dialogue with term
	});
}

function loadData(term, callback) {
	request.get('/search').query({ q: term })
	.end(function(error, res){
		if (res.ok) {
			// Load up all the data
			data = JSON.parse(res.text);
			console.log(res.text)
			iterateData(data);
			callback();
		}
		else {
			console.log("Error loading data.", term);
		}
	});
}

function initTimeline() {
	// Figure out mins and maxes
	n = normalizeToDate(minPos, maxPos, minDate, maxDate)
}

function normalizeToDate(minPos, maxPos, minDate, maxDate) {

}

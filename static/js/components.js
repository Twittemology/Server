new Dragdealer('draggable');
request = superagent;

function openMap(){
	[].forEach.call( // Fade out search dialogue
		document.querySelectorAll(".searchGroup"),
		function(elem) { elem.classList.add('fadeOut') }
	);

	document.querySelector('.loadingSpinner').classList.remove('hide'); // Throw loading symbol
	map.setView([38.828, -96.557], 5); // Position map
	var term = document.querySelector('.searchField').value; // extract term from field
	loadData(term, function() { // Load everything from backend
		document.getElementById("map").classList.remove('blurred'); // On load, undo blur
		document.querySelector('.smallSearchField').classList.add('fadeIn'); // Fade in small search dialogue
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

document.querySelector('.searchField').addEventListener("focus", function() {
	document.getElementById("map").classList.add('blurred');
})

document.querySelector('.buttonCont').addEventListener('click', openMap);
document.querySelector('.searchField').addEventListener('keypress', function(e){
	if(e.keyCode == 13){
		openMap()
	}
});

var animating = [];
var animationFrame;

// Set up map
L.mapbox.accessToken = 'pk.eyJ1Ijoiam1vc3MyMCIsImEiOiIzS2pUWmRnIn0.RLf4Yp6THAtrQbRsAvGzsw';
var map = L.mapbox.map('map', 'jmoss20.jg8g4958').setView([38.828, -96.557], 5);
map.zoomControl = false;

var circle_options = {
    color: '#ff0000',      // Stroke color
    opacity: 1,          // Stroke opacity
    weight: 1,             // Stroke weight
    fillColor: '#ffaaaa',  // Fill color
    fillOpacity: 1       // Fill opacity
};


// Helper functions
function iterateData(data) {
  for (var i = 0; i < data.length; i++) {
  	var item = data[i];
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
}

function blit(lat, long, size) {
	if (lat && long) {
	  console.log('lls', lat, long, size)
	  var circle = L.circle([lat, long], (size || 45000), circle_options).addTo(map);
	  circle._path.style.opacity = 1;

	  animating.push(circle);

	  if (!animationFrame) { animationFrame = window.requestAnimationFrame(step); }
	}
}

function step() {
  for (var i = 0; i < animating.length; i++) {
    growCircle(animating[i]);
  }

  window.requestAnimationFrame(step);
}

function growCircle(c) {
  //c.setRadius((c.getRadius() + 100) * 1.12);
  c._path.style.opacity = c._path.style.opacity - (0.028);

  if (c._path.style.opacity < 0) {
    console.log('done');
    animating[0]._path.style.opacity = 0;
    animating.shift();
  } 
}

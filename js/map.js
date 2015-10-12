// List of locations
var locations = [
	{
		lat: 52.374183, 
		lng: 4.898062,
		title: 'Oude Kerk'
	},
	{
		lat: 52.366052, 
		lng: 4.896677,
		title: 'Rembrandtplein'
	},
	{
		lat: 52.357038, 
		lng: 4.881421,
		title: 'Museumplein'
	},
	{
		lat: 52.366828, 
		lng: 4.891097,
		title: 'Bloemenmarkt'
	},
	{
		lat: 52.342849, 
		lng: 4.881001,
		title: 'Beatrixpark'
	}

];

// Load wikipedia data
function loadData(marker) {
	var $wikiElem = $('#wikipedia-links-'+marker.id);
	$wikiElem.text("");
	var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title +'&format=json&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){
        $wikiElem.text("failed to get Wikipedia resources");
    }, 8000);

    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        // jsonp: "callback",
        success: function( response ) {
            var articleList = response[1];

            if (articleList.length == 0) {
            	$wikiElem.append('Sorry, no articles about this location in Wikipedia.');
            } else {

	            for (var i = 0; i < articleList.length; i++) {
	                var articleStr = articleList[i];
	                var url = 'http://en.wikipedia.org/wiki/' + articleStr;
	                $wikiElem.append('<li><a href="' + url + '">' + articleStr + '</a></li>');
	            };
	        }
            clearTimeout(wikiRequestTimeout);
        }
    });
    return false;
}; 


function MapViewModel () {
	
	// Model initialization
	var mapCanvas = document.getElementById('map');
	var mapOptions = {
	  	center: new google.maps.LatLng(52.357038, 4.881421),
	  	zoom: 14,
	  	mapTypeId: google.maps.MapTypeId.HYBRID
	};

	var map = new google.maps.Map(mapCanvas, mapOptions);
	var markers = [];

	// Adding map markers
	locations.forEach(function(point,i) {
		var marker = new google.maps.Marker({
		    position: {lat: point.lat, lng: point.lng},
		    map: map,
		    title: point.title
	  	}); 
	  	marker.id = i;	
	  	marker.active = ko.observable(false);

	  	marker.cssClass = ko.pureComputed(function() {
        	return this.active() ? "active-location" : "not-active-location";
    	}, marker);

	  	markers.push(ko.observable(marker));

	  	// Marker animation and infowindow 	

	  	var contentString = '<div>'+marker.title+'</div>'+'<ul id="wikipedia-links-'+marker.id+'"></ul>';
	  	
	  	marker.infowindow = new google.maps.InfoWindow({
		    content: contentString
		});
	  	marker.toggleBounce = function() {
	  		
	  		markers.forEach(function(otherMarker,j){
	  			if (j != marker.id) {
	  				otherMarker().setAnimation(null);
	  				otherMarker().infowindow.close();
	  				otherMarker().active(false);
	  			}
	  		})

	  		if (marker.getAnimation() ) {
	    		marker.setAnimation(null);
	    		marker.infowindow.close();
	    		marker.active(false);
	  		} else {
	    		marker.setAnimation(google.maps.Animation.BOUNCE);
	    		marker.infowindow.open(map, marker);
	    		loadData(marker);
	    		marker.active(true);
	  		}
  		};
  		marker.addListener('click', marker.toggleBounce);
  	});

	// Model properties
	this.map  = map;
	this.markers = ko.observable(markers);
	
	this.markersToShow = ko.observableArray(markers.slice());

	this.searchRequest = ko.observable('');


	// Filtering
	this.filter = function(){
		var self = this;
		self.markersToShow.removeAll();
		markers.forEach(function(marker,i){
			var searchRequest = self.searchRequest().toLowerCase();
			var n = marker().title.toLowerCase().indexOf(searchRequest);
			if (n == -1) {
				marker().setVisible(false);
			} else {
				marker().setVisible(true);
				self.markersToShow.push(marker);
			}
		});
	};

};

google.maps.event.addDomListener(window, 'load', function(){
	ko.applyBindings(new MapViewModel());
});
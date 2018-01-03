"use strict";
var map, infoWindow;

// Callback error of Google Map API
function googleError() {
	window.alert("Houve algum problema ao tentar carregar o mapa: Consulte o console JavaScript para ver detalhes técnicos");
}

// Callback error of aplication
function errorAlert(pMessage) {
	window.alert("Houve algum problema com a execução do programa: " + pMessage);
}

var initMap = function() {

	// Map´s style
	var styles = [
	{
		featureType: 'water',
		stylers: [
			{ color: '#19a0d8' }
		]
	},{
		featureType: 'administrative',
		elementType: 'labels.text.stroke',
		stylers: [
			{ color: '#ffffff' },
			{ weight: 6 }
		]
	},{
		featureType: 'administrative',
		elementType: 'labels.text.fill',
		stylers: [
			{ color: '#e85113' }
		]
	},{
		featureType: 'road.highway',
		elementType: 'geometry.stroke',
		stylers: [
			{ color: '#efe9e4' },
			{ lightness: -40 }
		]
	},{
		featureType: 'transit.station',
		stylers: [
			{ weight: 9 },
			{ hue: '#e85113' }
		]
	},{
		featureType: 'road.highway',
		elementType: 'labels.icon',
		stylers: [
			{ visibility: 'off' }
		]
	},{
		featureType: 'water',
		elementType: 'labels.text.stroke',
		stylers: [
			{ lightness: 100 }
		]
	},{
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [
			{ lightness: -100 }
		]
	},{
		featureType: 'poi',
		elementType: 'geometry',
		stylers: [
			{ visibility: 'on' },
			{ color: '#f0e4d3' }
		]
	},{
		featureType: 'road.highway',
		elementType: 'geometry.fill',
		stylers: [
			{ color: '#efe9e4' },
			{ lightness: -25 }
		]
	}
	];

	try {
		// Map´s Constructor
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: -27.6078518, lng: -48.5664204},
			zoom: 11,
			styles: styles,
			mapTypeControl: false
		});

		infoWindow = new google.maps.InfoWindow();

		ko.applyBindings(new PlaceViewModel());
	} 
	catch(err) {
		errorAlert(err.message)

	}

};

// Location Object
var Location = function(pLat, pLng){
	var self = this;
	self.lat = pLat;
	self.lng = pLng;

};

// Place Object
var Place = function(pTitle, pVenueId, pLat, pLng, pShow = true) {
	var self = this;
	self.title = pTitle;
	self.location = new Location(pLat, pLng);
	self.venueId = pVenueId;
	self.show = pShow;

};

// The best places in Florianópolis
var placeList = [
	new Place("Lagoa da Conceição", '4c094d1ea1b32d7f5a7097f0', -27.604987406380886, -48.46359533478016), 
	new Place("Joaquina Beach", '4bb79a807421a5938ebbc040', -27.62868056280763, -48.448344602178565), 
	new Place("Campeche Island", '4fef0564e4b0369bc80097c7', -27.695507395680078, -48.46655717899401), 
	new Place("Guarda do Embau", '52bfdd7f498ebf3d1f1e60ab', -27.887270727291334, -48.613335433031736), 
	new Place("Campeche Beach", '4bd319c5462cb713b182dd07', -27.67866362912327, -48.480262756347656), 
	new Place("Pedra Branca", '4d6d1b5068406ea84da07183', -27.627614180770802, -48.683264827345674)

];

// ViewModel object of place, with initial state and selections actions
var PlaceViewModel = function() {
	var self = this;

	self.places = ko.observableArray();
	self.chosenPlaceId = ko.observable();
	self.bounds = new google.maps.LatLngBounds();
	self.currentPlace = null;
	self.errorMessageTitle = ko.observable("");
	self.errorMessage = ko.observable("");
	self.filterCondition = ko.observable("");

	// Initial icon build
	var initialIcon = self.createMarkerIcon('E95C4E');

	// Initial highlighted icon build
	var highlightedIcon = self.createMarkerIcon('FFFF24');

	// For each place is created with your own information and events
    placeList.forEach(function(pPlace){

		var marker = createMarker(pPlace, map, initialIcon);

		marker.addListener('mouseover', function() {
			this.setIcon(highlightedIcon);
		});

		marker.addListener('mouseout', function() {
			this.setIcon(initialIcon);
		});

		marker.addListener('click', function(){
			self.setSelected(this);
		});

		self.bounds.extend(marker.position);
		map.fitBounds(self.bounds);

		self.places.push(marker);
		self.fourSquareApi(pPlace);

	});

	self.setSelected = function(pMarker){
		pMarker.selected(true);
		self.setUnselected();	
		pMarker.setIcon(highlightedIcon);	
		self.populateInfoWindow(pMarker, infoWindow);
		self.currentPlace = pMarker;
		self.setBounce(pMarker);

	};

	self.setUnselected = function() {
		self.currentPlace = null;
		for (var i = 0; i < self.places().length; i++) {
			self.places()[i].selected(false);
			self.places()[i].setIcon(initialIcon);
		}

	};

	dropIcons(self);

};

// Create a merker
function createMarker(pPlace, pMap, pInitialIcon){
	return new google.maps.Marker({
		position: pPlace.location,
		map: pMap,
		title: pPlace.title,
		selected: ko.observable(pPlace.selected),
		show: ko.observable(pPlace.show),
		icon: pInitialIcon

	});	

}

// Create a marker Image
function createMarkerImage(pIconColor) {
	return new google.maps.MarkerImage(
		"http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pIconColor,
		new google.maps.Size(21, 34),
		new google.maps.Point(0,0),
		new google.maps.Point(10, 34),
		new google.maps.Size(21, 34));

};

// Create a custom marker icon
PlaceViewModel.prototype.createMarkerIcon = function(pColor = '') {
	var initialIcon = createMarkerImage(pColor);

	return initialIcon;
};

// This drop all icons with animation
function dropIcons(placeViewModel) {
	for (var i = 0; i < placeViewModel.places().length; i++) {
		addMarkerWithTimeout( i * 500, placeViewModel.places()[i]);
	}

}
// TThis function adds the icon only after the time that your passed
function addMarkerWithTimeout(pTimeout, pPlace) {
	window.setTimeout(function() {
		pPlace.setAnimation(google.maps.Animation.DROP);
		pPlace.setMap(map);
		pPlace.setVisible(true);

	}, pTimeout);

}

// Add marker bounce
PlaceViewModel.prototype.setBounce = function(pMarker) {
	pMarker.setAnimation(google.maps.Animation.BOUNCE);

	setTimeout(function(){ 
		pMarker.setAnimation(null);
	}, 1500);

};

// This function populates the info window when the marker is clicked.
PlaceViewModel.prototype.populateInfoWindow = function(pMarker, pInfowindow){
	var place;
	var content = "";

	// Select the place
	for(var i = 0; i < placeList.length; i++) {
		if (placeList[i].title == pMarker.title){
			place = placeList[i];
		}

	}

	// Creating the info window
	if(pInfowindow.marker != pMarker) {
		pInfowindow.marker = pMarker;
		content += "<article><h3>";

		if (place.shortUrl){
			content += "<a href='" + place.shortUrl + "'>";
		}

		content += pMarker.title;

		if (place.shortUrl){
			content += "</a>";
		}

		content += '</h3><div class="info">';
		
		if (place.photo) {
			content += '<div><img src="' + place.photo + '" alt=""></div>';
		}

		if (place.formattedAddress) {
			content += '<div class="info-description"><h5>' + place.formattedAddress;

			if (place.rating) {
				content += '<sup> ( Rating : ' + place.rating + ' )</sup>';
			}

			content += '</h5>';
		}

		if (place.description) {
			content += '<p>' + place.description + '</p>';
		}

		if (place.formattedAddress) {
			content += '</div>';
		}

		content += '</div></article>';
		pInfowindow.setContent(content);
		pInfowindow.open(map, pMarker);

		// Adding event for close the info window
		pInfowindow.addListener('closeclick', function(){
			pInfowindow.marker = null;
		});
	}
};

// Get info of the place at fourSquareApi
PlaceViewModel.prototype.fourSquareApi = function(pPlace) {
	var self = this;
	self.venueId = pPlace.venueId;
	self.clientId = "45JRF40PHHKJQY5YQ2CUZLVCY5NHPYPEH1JDHLY441FKQS2Z";
	self.clientSecret = "2Y1IT4VGDRDA3P0TZDHQYIVISPIFMW5WIJ4OXRA52PSKZSVF";
	self.v = "20170801";
	self.pictureSize = "100x100";

	$.ajax(
	{
		url: "https://api.foursquare.com/v2/venues/" 
		+ self.venueId 
		+ '?client_id=' + self.clientId 
		+ '&client_secret=' + self.clientSecret 
		+ '&v=' + self.v,
		dataType: "json"

	})
	.done(function(data){
		var photo = data.response.venue.bestPhoto;
		var prefix = photo.hasOwnProperty('prefix') ? photo.prefix : "";
		var suffix = photo.hasOwnProperty('suffix') ? photo.suffix : "";
		var photoUrl = prefix + self.pictureSize + suffix;
		pPlace.photo = photoUrl;
		pPlace.description = data.response.venue.description;
		pPlace.rating = data.response.venue.rating;
		pPlace.shortUrl = data.response.venue.shortUrl;
		pPlace.formattedAddress = data.response.venue.location.formattedAddress[0] ? data.response.venue.location.formattedAddress[0]  : "";
		pPlace.formattedAddress += data.response.venue.location.formattedAddress[1] ? ", " + data.response.venue.location.formattedAddress[1] : ""; 
		pPlace.formattedAddress += data.response.venue.location.formattedAddress[2] ? ", " + data.response.venue.location.formattedAddress[2] : "";

	})
	.fail(function(e) {
		self.errorMessageTitle("Foursqurare api error:");
		self.errorMessage("For some reason it was not possible to load Foursquare data");

	});

};

// Filter function 
PlaceViewModel.prototype.placeFilter = function() {
	for(var i = 0; i < this.places().length; i++) {
		if( this.places()[i].title.toLowerCase().indexOf(this.filterCondition().toLowerCase()) != -1 ) {
			this.places()[i].show(true);
			this.places()[i].setVisible(true);

		} else {
			this.places()[i].show(false);
			this.places()[i].setVisible(false);

		}
	}

};


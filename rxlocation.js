var gpsUtil = require('gps-util'),
  fs = require('fs'),
  Rx = require("rx"),
  RxNode = require("rx-node"),
  Bacon = require('baconjs'),
  GpxStream = require("gpx-stream"),
  locationStream = new GpxStream();

var gpxSource = fs.createReadStream('./gpx/sample.gpx');
var points = [];
gpxSource.pipe(locationStream);
gpxSource.on('readable', function() {
	while(loc = locationStream.read()) {
		points.push(loc);
	}
});

var stream = Bacon.sequentially(2000, points);

stream.onValue(function(loc) {
	console.log(loc);
});




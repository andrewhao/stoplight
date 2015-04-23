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

var historicalStream = stream.slidingWindow(2)

stream.onValue(function(loc) {
	console.log(loc);
});

velocityStream = historicalStream.map(function(history) {
  if(history.length < 2) { return }
  var p1 = history[0]
  var p2 = history[1]

  var dist = gpsUtil.getDistance(p1.lon, p1.lat, p2.lon, p2.lat)
  console.log("distance between points is:" + dist);

  var t1 = Date.parse(p1.time);
  var t2 = Date.parse(p2.time);

  var delta = t2 - t1;
  var seconds = delta / 1000;

  console.log("time elapsed is: %ss", seconds);

  var velocity = dist / seconds;


  return velocity;
});

velocityStream.subscribe(function(velocity) {
  console.log("instantaneous velocity is: %s m/s", velocity)
});


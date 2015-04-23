var gpsUtil = require('gps-util'),
  fs = require('fs'),
  Bacon = require('baconjs'),
  GpxStream = require("gpx-stream"),
  locationStream = new GpxStream();

var gpxSource = fs.createReadStream('./gpx/sample.gpx');
gpxSource.pipe(locationStream);

var points = [];
locationStream.on('readable', function() {
  while(loc = locationStream.read()) {
    points.push(loc);
  }
});

locationStream.on('end', function() {
  var liveStream = Bacon.sequentially(1000, points);
  var pairIntervalStream = liveStream
                             .slidingWindow(2)
                             .filter(function(pairs) {
                               return (pairs.length == 2 &&
                                       pairs[0] !== null &&
                                       pairs[1] !== null)
                             });

  pairIntervalStream.onValue(function(v) {
    console.log("\n\n\n-------------------------------------------------------------------------\n\n\n");
    console.log(v);
  });

  var distanceStream = pairIntervalStream.map(function(pairs) {
    var p1 = pairs[0];
    var p2 = pairs[1];

    var dist = gpsUtil.getDistance(p1.lon, p1.lat, p2.lon, p2.lat);
    console.log("distance between points is:" + dist);
    return dist;
  });

  var elevationDeltaStream = pairIntervalStream.map(function(pairs) {
    var p1 = pairs[0];
    var p2 = pairs[1];
    return p2.elevation - p1.elevation
  });


  var timeDeltaStream = pairIntervalStream.map(function(pairs) {
    var p1 = pairs[0];
    var p2 = pairs[1];

    var t1 = Date.parse(p1.time);
    var t2 = Date.parse(p2.time);

    var delta = t2 - t1;
    var seconds = delta / 1000;

    console.log("time elapsed is: %ss", seconds);
    return seconds;
  });

  var velocityStream = distanceStream
                         .sampledBy(timeDeltaStream,
                                    function(meters, seconds) {
    return meters / seconds;
  });

  var movementChangeStream = velocityStream.map(function(v) {
    return (v > 2.5) ? "moving" : "stopped";
  }).skipDuplicates()
    .onValue(function(status) {
      console.log("STATE CHANGE: %s", status);
    });


  var sampleCountStream = Bacon.repeat(function(i) { return i; })
  var totalDistanceStream = distanceStream
                              .scan(0, function(acc, d) { return acc + d })
  var totalTimeStream = timeDeltaStream
                          .scan(0, function(acc, d) { return acc + d })
  var totalSamplesStream = distanceStream
                             .scan(0, function(a, b) { return a + 1 })
                             .onValue(function(v) { console.log("total samples: %s", v); });

  var totalElevationStream = elevationDeltaStream
        .scan(0, function(a, b) { return a + b })
        .onValue(function(v) { console.log("elevation change from start is: %s", v);} );

  var averageVelocityStream = totalTimeStream
                                .sampledBy(totalDistanceStream,
                                           function(seconds, distance) {
                                             return distance / seconds;
                                           })
                                .onValue(function(v) { console.log("average velocity so far: %s", v) });
  velocityStream.subscribe(function(velocity) {
    console.log("instantaneous velocity is: %s m/s", velocity);
  });

});

import fs from 'fs'
import util from 'util'
import gpxParse from 'gpx-parse'
import Rx from 'rx'
import geo from 'node-geo-distance'

console.log("Starting...")

let parseGpx = Rx.Observable.fromNodeCallback(gpxParse.parseGpxFromFile);
let fileStream = parseGpx('./gpx/sample.gpx');
let pointStream = fileStream
                    .flatMap((res) => res.tracks)
                    .flatMap((trk) => trk.segments)
                    .flatMap((segment) => segment)

let pairIntervalStream = pointStream.pairwise()

let combinedStatStream = pairIntervalStream.map((pairs) => {
  let [p1, p2] = pairs;

  const dist = geo.haversineSync({latitude: p1.lat, longitude: p1.lon},
                               {latitude: p2.lat, longitude: p2.lon});
  const t1 = Date.parse(p1.time);
  const t2 = Date.parse(p2.time);
  const delta = t2 - t1;
  const seconds = delta / 1000;

  return {
    velocity: dist / seconds,
    lat: p2.lat,
    lon: p2.lon,
    elapsedTime: seconds
  };
})

combinedStatStream.filter((d) => d.velocity < 0.5)
.catch((e) => console.log(e))
.subscribe((v) => console.log(v))


//   var movementChangeStream = velocityStream.map(function(v) {
//     return (v > 2.5) ? "moving" : "stopped";
//   }).skipDuplicates()
//     .onValue(function(status) {
//       console.log("STATE CHANGE: %s", status);
//     });
//
//
//   var sampleCountStream = Bacon.repeat(function(i) { return i; })
//   var totalDistanceStream = distanceStream
//                               .scan(0, function(acc, d) { return acc + d })
//   var totalTimeStream = timeDeltaStream
//                           .scan(0, function(acc, d) { return acc + d })
//   var totalSamplesStream = distanceStream
//                              .scan(0, function(a, b) { return a + 1 })
//                              .onValue(function(v) { console.log("total samples: %s", v); });
//
//   var totalElevationStream = elevationDeltaStream
//         .scan(0, function(a, b) { return a + b })
//         .onValue(function(v) { console.log("elevation change from start is: %s", v);} );
//
//   var averageVelocityStream = totalTimeStream
//                                 .sampledBy(totalDistanceStream,
//                                            function(seconds, distance) {
//                                              return distance / seconds;
//                                            })
//                                 .onValue(function(v) { console.log("average velocity so far: %s", v) });
//   velocityStream.subscribe(function(velocity) {
//     console.log("instantaneous velocity is: %s m/s", velocity);
//   });
//
// });

import fs from 'fs';
import util from 'util';
import gpxParse from 'gpx-parse';
import { Observable } from 'rx';
import geo from 'node-geo-distance';
import Promise from 'bluebird';

const VELOCITY_THRESHOLD = 0.5;

class Stoplight {
  stopsFromGpx(path) {
    let parseGpx = Observable.fromNodeCallback(gpxParse.parseGpxFromFile);
    let fileStream = parseGpx(path);
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

    let stopStream = combinedStatStream.filter((d) => d.velocity < VELOCITY_THRESHOLD);
    return stopStream.reduce((acc, evt) => acc.concat(evt), [])
    .toPromise(Promise);
  }

	stopsFromZippedStravaStream(input) {
    const eventsFromStrava = Observable.from(input)
    // Decorate with an index counter
    .scan((acc, point) => {
      const nextIndex = acc.index + 1
      return Object.assign({}, point, {
        index: nextIndex
      });
    }, { index: 0 })
    .filter((d) => d.velocity < VELOCITY_THRESHOLD)
    // Now mark which startingIndex you are a part of
    .scan((acc, current) => {
      let startingIndex;
      // If part of a matching contiguous group.
      if (current.index == acc.lastIndex + 1) {
        startingIndex = acc.startingIndex;
      } else {
        // Start the starting index at the current point
        startingIndex = current.index
      }
      return Object.assign({}, current, {
        startingIndex: startingIndex,
        lastIndex: current.index
      });
    }, { startingIndex: 0, lastIndex: 0 })
    .groupBy(p => p.startingIndex)

    return eventsFromStrava
    .flatMap((group) => {
      return group
        .pairwise()
        .reduce((acc, pairs) => {
          const [e1, e2] = pairs;
          const elapsedTime = e2.time - e1.time;
          return Object.assign({}, e2, {
                                 elapsedTime: acc.elapsedTime + elapsedTime
                               })
        }, { elapsedTime: 0 })
    })
    .map((d) => ({
      velocity: d.velocity,
      lat: d.latlng[0],
      lon: d.latlng[1],
      elapsedTime: d.elapsedTime,
    }))
    .toArray()
    .toPromise(Promise);
	}
}
export default Stoplight;

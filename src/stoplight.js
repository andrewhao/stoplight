import fs from 'fs';
import { inspect } from 'util';
import gpxParse from 'gpx-parse';
import { Observable } from 'rx';
import geo from 'node-geo-distance';
import Promise from 'bluebird';

const VELOCITY_THRESHOLD = 0.5;

const pointDecorationFn = (d) => ({
  lat: d.latlng[0],
  lon: d.latlng[1],
  elapsedTime: d.elapsedTime,
})

class Stoplight {
  stopsFromGpx(path) {
    let parseGpx = Observable.fromNodeCallback(gpxParse.parseGpxFromFile);
    let fileStream = parseGpx(path);
    let pointStream = fileStream
    .flatMap(res => res.tracks)
    .flatMap(trk => trk.segments)
    .flatMap(segment => segment)

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
    return Observable.from(input)
    .pairwise()
    .map(([p1, p2]) => {
      const elapsedTime = p2.time - p1.time;
      const velocity = (p2.distance - p1.distance) / elapsedTime;
      return Object.assign({}, p2, { velocity, elapsedTime })
    })
    // Decorate with an index counter
    .scan((acc, point) => {
      return Object.assign({}, point, {
        index: acc.index + 1
      });
    }, { index: 0 })
    .filter(v => v.velocity < VELOCITY_THRESHOLD)
    // Coalesce points together based on whether you are a part
    // of an increasing series of start indices.
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
    // For some reason, the scan() above emits the default value without any prior values on the stream.
    // Filter only for "real" values.
    .filter(v => !isNaN(v.elapsedTime))
    .groupBy(p => p.startingIndex)
    .flatMap((g) => {
      return g
      .reduce((past, current) => {
        return Object.assign( {}, current, { elapsedTime: past.elapsedTime + current.elapsedTime })
      }, { elapsedTime: 0 })
    })
    .map(pointDecorationFn)
    .toArray()
    .toPromise(Promise)
	}
}
export default Stoplight;

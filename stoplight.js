import fs from 'fs';
import util from 'util';
import gpxParse from 'gpx-parse';
import Rx from 'rx';
import geo from 'node-geo-distance';
import Promise from 'bluebird';

class Stoplight {
  stopsFromGpx(path) {
    let parseGpx = Rx.Observable.fromNodeCallback(gpxParse.parseGpxFromFile);
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

    let stopStream = combinedStatStream.filter((d) => d.velocity < 0.5);
    return stopStream.reduce((acc, evt) => acc.concat(evt), [])
    .toPromise(Promise);
  }

	stopsFromZippedStravaStream(input) {
    return Rx.Observable.from(input)
    .pairwise()
    .map((pairs) => {
      const [p1, p2] = pairs;
      const elapsedTime = p2.time - p1.time
      return {
        velocity: p1.velocity,
        lat: p1.latlng[0],
        lon: p1.latlng[1],
        elapsedTime: elapsedTime,
      }
    })
    .filter((d) => d.velocity < 0.5)
    .scan((acc, evt) => acc.concat(evt), [])
    .toPromise(Promise);
	}
}
export default Stoplight;

import Stoplight from '../src/stoplight';
import { expect } from 'chai';
import fetch from 'node-fetch';
import util from 'util';

describe('Stoplight', () => {
  const subject = new Stoplight();
  describe('#stopsFromGpx', () => {
    it('parses stop locations', (done) => {
      const gpxLocation = './gpx/sample.gpx';
      const expectedResult = [
              { velocity: 0.461,
                lat: 34.073917,
                lon: -118.507057,
                elapsedTime: 3 },
              { velocity: 0.2305,
                lat: 34.081978,
                lon: -118.514771,
                elapsedTime: 6 },
              { velocity: 0.4306086956521739,
                lat: 34.082047,
                lon: -118.514839,
                elapsedTime: 23 },
              { velocity: 0.4836666666666667,
                lat: 34.086243,
                lon: -118.517616,
                elapsedTime: 3 },
              { velocity: 0.4171666666666667,
                lat: 34.086903,
                lon: -118.517891,
                elapsedTime: 6 },
              { velocity: 0.3323421052631579,
                lat: 34.087086,
                lon: -118.51799,
                elapsedTime: 38 },
              { velocity: 0.287,
                lat: 34.088112,
                lon: -118.518639,
                elapsedTime: 3 },
              { velocity: 0.15854022988505748,
                lat: 34.088444,
                lon: -118.5187,
                elapsedTime: 174 },
              { velocity: 0.21525,
                lat: 34.093563,
                lon: -118.519455,
								elapsedTime: 4 },
							{ velocity: 0,
								lat: 34.093578,
								lon: -118.519478,
								elapsedTime: 83 } ];
      let result = subject.stopsFromGpx(gpxLocation);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(e));
    });
  });

	describe('#stopsFromZippedStravaStream', () => {
    it('returns empty array for no valid values', (done) => {
      const input = [
        { "time": 0, "latlng": [ 34.015308, -118.490385 ], "distance": 4 },
        { "time": 2, "latlng": [ 34.015278, -118.490377 ], "distance": 7.4 },
        { "time": 3, "latlng": [ 34.015237, -118.490399 ], "distance": 12.3 },
        { "time": 4, "latlng": [ 34.015237, -118.490399 ], "distance": 19.3 }
      ];
      let result = subject.stopsFromZippedStravaStream(input);
      result.then((stops) => {
        expect(stops).to.deep.equal([]);
      })
      .then(done)
    });

    it('detects points under 0.5m/s', (done) => {
      const input = [
        { "time": 0, "latlng": [ 34.015308, -118.490385 ], "distance": 4 },
        { "time": 2, "latlng": [ 34.015278, -118.490377 ], "distance": 4 },
        { "time": 3, "latlng": [ 34.015237, -118.490399 ], "distance": 12.3 },
        { "time": 4, "latlng": [ 34.015237, -118.490399 ], "distance": 19.3 }
      ];
      const expectedResult = [
        { lat: 34.015278, lon: -118.490377, elapsedTime: 2 }
			];

      let result = subject.stopsFromZippedStravaStream(input);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(`Error: ${e}`));
    });

    it('detects multiple stops with starts in between (with one-sample-stop groups)', (done) => {
      const input = [
		  	{ "time": 660, "latlng": [ 34.007145, -118.476151 ], "distance": 4987.5 },
		  	{ "time": 746, "latlng": [ 34.007092, -118.476303 ], "distance": 4995.8 },
				{ "time": 752, "latlng": [ 34.006878, -118.476685 ], "distance": 5038.7 },
				{ "time": 753, "latlng": [ 34.006836, -118.476761 ], "distance": 5047.2 },
				{ "time": 762, "latlng": [ 34.00666, -118.489319 ], "distance": 5050.6 },
				{ "time": 763, "latlng": [ 34.00666, -118.489319 ], "distance": 5051.7 },
      ];

      const expectedResult = [
        { lat: 34.007092, lon: -118.476303, elapsedTime: 86 },
        { lat: 34.00666, lon: -118.489319, elapsedTime: 9 },
      ];

      let result = subject.stopsFromZippedStravaStream(input);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(`Error: ${e}`));
    });

    it('detects long auto-pauses', (done) => {
      const input = [
        { "time": 758, "latlng": [ 34.026944, -118.448406 ], "distance": 2897.3, "velocity": 1.6 },
        { "time": 908, "latlng": [ 34.026959, -118.448377 ], "distance": 2901.3, "velocity": 0.1 },
        { "time": 909, "latlng": [ 34.026974, -118.448347 ], "distance": 2905.3, "velocity": 0.1 },
      ]
      let result = subject.stopsFromZippedStravaStream(input);
      let expectedResult = [{
        lat: 34.026959,
        lon: -118.448377,
        elapsedTime: 150,
      }];
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
        done();
      })
    });
	});
});

import Stoplight from '../src/stoplight';
import { expect } from 'chai';
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
    it('detects points under 0.5m/s', (done) => {
      const input = [
        { "time": 0, "latlng": [ 34.015308, -118.490385 ], "distance": 4, "velocity": 0 },
        { "time": 2, "latlng": [ 34.015278, -118.490377 ], "distance": 7.4, "velocity": 0.08 },
        { "time": 3, "latlng": [ 34.015237, -118.490399 ], "distance": 12.3, "velocity": 0 },
        { "time": 4, "latlng": [ 34.015237, -118.490399 ], "distance": 19.3, "velocity": 10 }
      ];
      const expectedResult = [
        { velocity: 0, lat: 34.015237, lon: -118.490399, elapsedTime: 3 }
			];

      let result = subject.stopsFromZippedStravaStream(input);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(`Error: ${e}`));
    });

    it('detects starts, stops, starts (multiple sets)', (done) => {
      const input = [
		  	{ "time": 660, "latlng": [ 34.007145, -118.476151 ], "distance": 4987.5, "velocity": 3.4 },
		  	{ "time": 743, "latlng": [ 34.007145, -118.476151 ], "distance": 4987.5, "velocity": 0.2 },
		  	{ "time": 745, "latlng": [ 34.007114, -118.476257 ], "distance": 4991.1, "velocity": 0 },
		  	{ "time": 746, "latlng": [ 34.007092, -118.476303 ], "distance": 4995.8, "velocity": 0.1 },
				{ "time": 752, "latlng": [ 34.006878, -118.476685 ], "distance": 5038.7, "velocity": 7.2 },
				{ "time": 753, "latlng": [ 34.006836, -118.476761 ], "distance": 5047.2, "velocity": 7.6 },
				{ "time": 761, "latlng": [ 34.00666, -118.489319 ], "distance": 6917.5, "velocity": 0.2 },
				{ "time": 762, "latlng": [ 34.00666, -118.489319 ], "distance": 6919.6, "velocity": 0.2 },
				{ "time": 763, "latlng": [ 34.00666, -118.489319 ], "distance": 6923.7, "velocity": 0.3 },
      ];

      const expectedResult = [ { velocity: 0.1,
          lat: 34.007092,
          lon: -118.476303,
          elapsedTime: 3
        }, {
          velocity: 0.3,
          lat: 34.00666,
          lon: -118.489319,
          elapsedTime: 2
        }
      ];

      let result = subject.stopsFromZippedStravaStream(input);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(`Error: ${e}`));
    });
	});
});

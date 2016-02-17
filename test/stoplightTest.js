import Stoplight from '../stoplight';
import { expect } from 'chai';

describe('Stoplight', () => {
  describe('#stopsFromGpx', () => {
    it('parses stop locations', (done) => {
      const gpxLocation = './gpx/sample.gpx';
      const stoplight = new Stoplight();
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
      let result = stoplight.stopsFromGpx(gpxLocation);
      result.then((stops) => {
        expect(stops).to.deep.equal(expectedResult);
      })
      .then(done)
      .catch((e) => console.log(e));
    });
  });
});
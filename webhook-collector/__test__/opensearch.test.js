import { testing } from "../src/opensearch.js";
const { durationCalculate } = testing;
import { expect } from 'chai';

describe('OpenSearch', () => {
  describe('durationCalculate', () => {
    it('should calculate the duration of two dates in seconds', async () => {
      const start = new Date('2021-07-01T00:00:00Z');
      const end = new Date('2021-07-01T00:00:10Z');
      const duration = await durationCalculate({ start, end });
      expect(duration).to.eq(10);
    });
    it('should return a minimum duration of 1 second', async () => {
      const start = new Date('2021-07-01T00:00:00Z');
      const end = new Date('2021-07-01T00:00:00Z');
      const duration = await durationCalculate({ start, end });
      expect(duration).to.eq(1);
    });
    it('should round up the duration to the nearest second', async () => {
      const start = new Date('2021-07-01T00:00:00Z');
      const end = new Date('2021-07-01T00:00:01.1Z');
      const duration = await durationCalculate({ start, end });
      expect(duration).to.eq(2);
    });
  });
});

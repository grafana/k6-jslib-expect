import { describe, wrapper } from '../src/expect.js';

export default wrapper(function(){

  describe('This fails', (t) => {
    t.expect(1).toEqual(2);
  })

  describe('This never runs', (t) => {
    t.expect(1).toEqual(1);
  })

});

// this can't be wrapped AFAIK ;-(
export function someScenario(){

}

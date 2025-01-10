# k6-jslib-expect
Expect library for k6

# DEPRECATED. Please use https://github.com/grafana/k6-jslib-k6chaijs

Docs: http://k6.io/docs/javascript-api/jslib/expect

Download from: https://jslib.k6.io/

## Example

```javascript
import { describe } from 'https://jslib.k6.io/expect/0.0.4/index.js';
import http from 'k6/http';

export default function testSuite() {

  describe('Fetch a list of public crocodiles', (t) => {
    let response = http.get("https://test-api.k6.io/public/crocodiles")

    t.expect(response.status).as("response status").toEqual(200)
      .and(response).toHaveValidJson()
      .and(response.json().length).as("number of crocs").toBeGreaterThan(5);
  })

} 
```

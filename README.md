# k6-jslib-functional
Functional library for k6

Docs: http://k6.io/docs/javascript-api/jslib/functional

Download from: https://jslib.k6.io/

## Example

```javascript
import { test } from 'https://jslib.k6.io/functional/0.0.3/index.js';
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
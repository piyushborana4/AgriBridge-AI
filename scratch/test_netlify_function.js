import { handler } from '../netlify/functions/api.js';

async function testNetlifyFunction() {
  console.log('Testing Netlify Function API wrapper...\n');

  // Test 1: GET /api/health
  const healthEvent = {
    httpMethod: 'GET',
    path: '/api/health',
    headers: { 'content-type': 'application/json' }
  };
  const healthRes = await handler(healthEvent, {});
  console.log('1. GET /api/health:', healthRes.statusCode);
  const healthBody = JSON.parse(healthRes.body);
  console.log('   Body status:', healthBody.status, '| aiMode:', healthBody.aiMode);

  // Test 2: GET /api/health/live
  const liveEvent = {
    httpMethod: 'GET',
    path: '/api/health/live',
    headers: {}
  };
  const liveRes = await handler(liveEvent, {});
  console.log('2. GET /api/health/live:', liveRes.statusCode);
  const liveBody = JSON.parse(liveRes.body);
  console.log('   Liveness:', liveBody.liveness, '| Status:', liveBody.status);

  // Test 3: GET /api/health/ready
  const readyEvent = {
    httpMethod: 'GET',
    path: '/api/health/ready',
    headers: {}
  };
  const readyRes = await handler(readyEvent, {});
  console.log('3. GET /api/health/ready:', readyRes.statusCode);
  const readyBody = JSON.parse(readyRes.body);
  console.log('   Traffic safe:', readyBody.trafficSafe, '| Status:', readyBody.status);

  // Test 4: Netlify redirected path /.netlify/functions/api/health
  const netlifyPathEvent = {
    httpMethod: 'GET',
    path: '/.netlify/functions/api/health',
    headers: {}
  };
  const netlifyPathRes = await handler(netlifyPathEvent, {});
  console.log('4. GET /.netlify/functions/api/health (Redirect normalizer test):', netlifyPathRes.statusCode);
  console.log('   Body status:', JSON.parse(netlifyPathRes.body).status);

  // Test 5: POST /api/ai/advisory with empty body (anti-fabrication check)
  const emptyAdvEvent = {
    httpMethod: 'POST',
    path: '/api/ai/advisory',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  };
  const emptyAdvRes = await handler(emptyAdvEvent, {});
  console.log('5. POST /api/ai/advisory (Empty Context):', emptyAdvRes.statusCode);
  const emptyAdvBody = JSON.parse(emptyAdvRes.body);
  console.log('   Status:', emptyAdvBody.status, '| Uncertainty:', emptyAdvBody.uncertainty);

  // Test 6: POST /api/ai/advisory with valid farm context
  const validAdvEvent = {
    httpMethod: 'POST',
    path: '/api/ai/advisory',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      farmContext: {
        id: 'farm-1',
        name: 'Nashik Experimental Farm',
        crops: ['Wheat'],
        weather: { current: { temp: 28, et0: 4.1, humidity: 60 } },
        satellite: { ndvi: 0.77 },
        soil: { ph: 6.8, organicMatterPercent: 3.0 }
      }
    })
  };
  const validAdvRes = await handler(validAdvEvent, {});
  console.log('6. POST /api/ai/advisory (Valid Context):', validAdvRes.statusCode);
  const validAdvBody = JSON.parse(validAdvRes.body);
  console.log('   Summary:', validAdvBody.summary?.slice(0, 70) + '...');
  console.log('   Actions count:', validAdvBody.actions?.length);

  // Test 7: POST /api/ai/assistant
  const assistEvent = {
    httpMethod: 'POST',
    path: '/api/ai/assistant',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: 'What changed on my farm?',
      farmContext: {
        farm: { id: 'farm-1', name: 'Nashik Farm', crop: 'Wheat' },
        intelligence: { evidenceIds: ['SIG-WEATHER-001'] }
      }
    })
  };
  const assistRes = await handler(assistEvent, {});
  console.log('7. POST /api/ai/assistant:', assistRes.statusCode);

  console.log('\nAll Netlify Function API tests executed successfully!');
}

testNetlifyFunction().catch(console.error);

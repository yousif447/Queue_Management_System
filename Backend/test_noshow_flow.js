
const API_URL = 'http://localhost:5000/api/v1';

async function testNoShowFlow() {
  try {
    console.log('--- Starting No-Show Flow Test ---');

    // Helper to generate unique suffix
    const suffix = Date.now();

    // 1. Register Business
    console.log('\n1. Registering Business...');
    const businessData = {
      name: `Test Business ${suffix}`,
      email: `biz${suffix}@test.com`,
      password: 'Password123!',
      phone: `12345678${suffix.toString().slice(-3)}`, // Ensure unique phone
      category: 'Health',
      address: '123 Test St',
      workingHours: '9-5'
    };
    
    // Note: Adjust endpoint if /register is different for business
    // Assuming /auth/register creates user, then create business profile?
    // Or distinct endpoints. Checking authRoutes would describe this, but let's assume standard flow.
    // If separate business registration exists, we should use it.
    // Based on conversations, there might be separate endpoints.
    // Let's try to register as user first, then create business? 
    // Or maybe register directly as business?
    
    // Let's assume standard detailed registration flow might be complex.
    // Alternative: validation of existing business?
    // User registration:
    const bizUserRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...businessData,
            role: 'business'
        })
    });
    
    if (!bizUserRes.ok) {
        const err = await bizUserRes.json();
        throw new Error(`Business Registration Failed: ${JSON.stringify(err)}`);
    }
    const bizUser = await bizUserRes.json();
    const bizToken = bizUser.token; // Or cookies
    // Extract token from response or cookie? Assuming response for now.
    
    if (!bizToken) throw new Error('No token returned for business');
    console.log('Business Registered. Token:', bizToken.substring(0, 20) + '...');
    
    // We need the Business Profile ID.
    // Usually fetching /business/me or similar.
    // Or maybe the register response contains it?
    // Let's assume we need to create a business profile if it's separate.
    // Assuming the user IS the business owner and has a businessId.
    
    // Let's fetch "me" or similar to get business details
    const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${bizToken}` }
    });
    const meData = await meRes.json();
    // Assuming meData.data.businessId or similar exists if auto-created, 
    // or we need to create it.
    
    let businessId = meData.data?.businessId;
    if (!businessId) {
        // Create business profile
        console.log('Creating Business Profile...');
        const createBizRes = await fetch(`${API_URL}/business`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bizToken}`
            },
            body: JSON.stringify(businessData)
        });
        const createBizData = await createBizRes.json();
        businessId = createBizData.data?._id || createBizData.data?.id;
    }
    
    if (!businessId) {
         // Fallback: try search to find it
         const searchRes = await fetch(`${API_URL}/search/businesses?query=${businessData.name}`);
         const searchData = await searchRes.json();
         businessId = searchData.data?.[0]?._id;
    }
    
    if (!businessId) throw new Error('Could not obtain Business ID');
    console.log('Business ID:', businessId);


    // 2. Register User (Client)
    console.log('\n2. Registering Client...');
    const userData = {
      name: `Test Client ${suffix}`,
      email: `client${suffix}@test.com`,
      password: 'Password123!',
      phone: `98765432${suffix.toString().slice(-3)}`
    };
    
    const userRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (!userRes.ok) {
         const err = await userRes.json();
         throw new Error(`Client Registration Failed: ${JSON.stringify(err)}`);
    }
    const clientUser = await userRes.json();
    const clientToken = clientUser.token;
    console.log('Client Registered. Token:', clientToken.substring(0, 20) + '...');


    // 3. Create Ticket
    console.log('\n3. Creating Ticket...');
    // Enable queue first just in case?
    // await fetch(`${API_URL}/queue/${queueId}/resume`, ...)
    
    const ticketRes = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`
        },
        body: JSON.stringify({ 
            businessId: businessId,
            service: 'General' // Assuming a default service or generic
        })
    });
    
    if (!ticketRes.ok) {
        const err = await ticketRes.json();
        throw new Error(`Create Ticket Failed: ${JSON.stringify(err)}`);
    }
    const ticketData = await ticketRes.json();
    const ticketId = ticketData.data?._id || ticketData.ticket?._id;
    console.log('Ticket Created. ID:', ticketId);


    // 4. Mark No Show
    console.log('\n4. Marking No-Show...');
    const noShowRes = await fetch(`${API_URL}/tickets/tickets/${ticketId}/no-show`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${bizToken}` }
    });
    
    if (!noShowRes.ok) {
         const err = await noShowRes.json();
         throw new Error(`Mark No-Show Failed: ${JSON.stringify(err)}`);
    }
    console.log('Marked as No-Show.');
    
    // Verify status
    const verifyRes1 = await fetch(`${API_URL}/tickets/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${bizToken}` }
    });
    const verifyData1 = await verifyRes1.json();
    console.log('Ticket Status (should be missed):', verifyData1.data?.status || verifyData1.ticket?.status);
    
    if ((verifyData1.data?.status || verifyData1.ticket?.status) !== 'missed') {
        throw new Error('Status verification failed: Expected missed');
    }


    // 5. Reactivate Ticket
    console.log('\n5. Reactivating Ticket...');
    const reactivateRes = await fetch(`${API_URL}/tickets/tickets/${ticketId}/reactivate`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${bizToken}` }
    });
    
    if (!reactivateRes.ok) {
         const err = await reactivateRes.json();
         throw new Error(`Reactivate Failed: ${JSON.stringify(err)}`);
    }
    console.log('Reactivated.');
    
    // Verify status
    const verifyRes2 = await fetch(`${API_URL}/tickets/tickets/${ticketId}`, {
         headers: { 'Authorization': `Bearer ${bizToken}` }
    });
    const verifyData2 = await verifyRes2.json();
    const finalStatus = verifyData2.data?.status || verifyData2.ticket?.status;
    console.log('Ticket Status (should be waiting):', finalStatus);

    if (finalStatus !== 'waiting') {
         throw new Error('Status verification failed: Expected waiting');
    }

    console.log('\n--- SUCCESS: No-Show Flow Test Passed ---');

  } catch (error) {
    console.error('\n!!! FAILURE !!!');
    console.error(error);
  }
}

testNoShowFlow();

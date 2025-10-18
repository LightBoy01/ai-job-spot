
import { Impit } from 'impit';

const API_URL = 'https://hiring.cafe/api/search-jobs';

async function testImpit() {
    console.log('[test_impit] Testing hiring.cafe API with impit (Firefox emulation)...');

    try {
        // Set up the Impit instance
        const impit = new Impit({
            browser: "firefox",
        });

        const payload = { size: 1, page: 0, searchState: { sortBy: 'date' } };

        // Use the `fetch` method as you would with the built-in `fetch` function
        const response = await impit.fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`[test_impit] Received response with status: ${response.status}`);

        const responseText = await response.text();

        try {
            // Try to parse as JSON, assuming success
            const jsonData = JSON.parse(responseText);
            console.log('[test_impit] Successfully received and parsed JSON response:');
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            // If JSON parsing fails, it's likely the HTML block page
            console.log('[test_impit] Response was not valid JSON. It is likely the security checkpoint. Response body:');
            console.log(responseText);
        }

    } catch (error) {
        console.error('[test_impit] An error occurred during the impit fetch:', error);
    }
}

testImpit();

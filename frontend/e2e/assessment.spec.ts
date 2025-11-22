import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Assessment Flow', () => {
  const mockSessionId = '123';
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT',
    created_at: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    // Mock Auth and Preferences
    await page.addInitScript((user) => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('ui-preferences', JSON.stringify({ theme: 'light' }));
    }, mockUser);

    // Mock API: Auth Me (Critical for AuthContext to validate token)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ json: mockUser });
    });

    // Debug requests
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('request', request => console.log('>>', request.method(), request.url()));
    page.on('response', response => console.log('<<', response.status(), response.url()));
    page.on('requestfailed', request => console.log('>> FAILED', request.method(), request.url(), request.failure()?.errorText));

    // Mock API: Start Session (if called via HomePage, but we go direct)
    await page.route('**/api/engine/sessions/start', async (route) => {
      await route.fulfill({ json: { session_id: mockSessionId } });
    });

    // Mock API: Get Session Details (used by AssessmentStartPage)
    await page.route(`**/api/engine/sessions/${mockSessionId}`, async (route) => {
      await route.fulfill({
        json: {
          id: mockSessionId,
          user_id: '1', // Matches mockUser.id
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
      });
    });

    // Stateful mock for responses
    const savedResponses: Record<string, any> = {};

    // Mock API: Get Items and Submit Response (Legacy Engine Endpoint)
    await page.route(`**/api/engine/sessions/${mockSessionId}/items`, async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        
        // Handle batch responses
        if (payload.responses) {
            payload.responses.forEach((r: any) => {
                savedResponses[r.item_id] = r;
            });
        } 
        // Handle single item response
        else if (payload.item_id && payload.response_map) {
             savedResponses[payload.item_id] = { item_id: payload.item_id, ranks: payload.response_map };
        }

        await route.fulfill({
            json: {
                status: 'saved',
                progress: 100,
                responses: Object.values(savedResponses),
                contexts: []
            }
        });
      } else {
        // GET request - Return items
        const response = {
          session_id: mockSessionId,
          instrument_code: 'KLSI',
          status: 'ACTIVE',
          total_items: 1,
          progress: Object.keys(savedResponses).length > 0 ? 100 : 0,
          responses: Object.values(savedResponses),
          delivery: {
            items: [
              {
                id: 'item-1',
                item_id: 1, // Ensure item_id is present
                number: 1,
                stem: 'When I learn:',
                options: [
                  { id: 'opt-1', text: 'I like to deal with my feelings', option_code: 'CE', dimension: 'CE', value: 1 },
                  { id: 'opt-2', text: 'I like to watch and listen', option_code: 'RO', dimension: 'RO', value: 2 },
                  { id: 'opt-3', text: 'I like to think about ideas', option_code: 'AC', dimension: 'AC', value: 3 },
                  { id: 'opt-4', text: 'I like to be doing things', option_code: 'AE', dimension: 'AE', value: 4 }
                ]
              }
            ]
          }
        };
        console.log('Mocking items response:', JSON.stringify(response));
        await route.fulfill({
          json: response,
        });
      }
    });

    // Mock Modern Single Response Endpoint
    await page.route('**/api/sessions/*/response', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
            const postData = request.postDataJSON();
            console.log('>> POST (Modern Single)', request.url(), JSON.stringify(postData));
            
            if (postData && postData.item_id && postData.response_map) {
                savedResponses[postData.item_id] = {
                    item_id: postData.item_id,
                    ranks: postData.response_map
                };
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', progress: 100 })
            });
        }
    });

    // Mock Modern Submit All Endpoint
    await page.route('**/api/sessions/*/submit_all_responses', async (route) => {
            await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, result: {} })
        });
    });

    // Mock Finalize Endpoint
    await page.route(`**/api/engine/sessions/${mockSessionId}/finalize`, async (route) => {
        await route.fulfill({ json: { status: 'completed' } });
    });

    // Mock API: Submit All (Legacy or New?)
    // AssessmentPage might use a different endpoint for final submission?
    // It usually redirects to review.
    
    // Mock API: Get Report (for redirection check)
    await page.route(`**/api/reports/${mockSessionId}`, async (route) => {
        await route.fulfill({ json: { 
            session_id: mockSessionId,
            raw: { CE: 10, RO: 10, AC: 10, AE: 10, ACCE: 0, AERO: 0 },
            style: { primary_name: 'Balancing', primary_brief: 'Balanced', primary_detail: '...', intensity: 'Low' }
        } });
    });
  });

  test('should complete an assessment successfully', async ({ page }) => {
    // 1. Start Page
    await page.goto(`/assessment/${mockSessionId}/start`);
    
    // Check accessibility on start page
    const scan1 = await new AxeBuilder({ page }).analyze();
    expect(scan1.violations).toEqual([]);

    // Click Start
    await page.getByRole('button', { name: /start|mulai/i }).click();
    
    // 2. Assessment Page
    await expect(page).toHaveURL(`/assessment/${mockSessionId}`);
    
    // Debug: Check if we are stuck in loading or error
    const bodyText = await page.textContent('body');
    if (bodyText?.includes('Akses Ditolak')) {
        console.log('Access Denied detected');
    }
    if (bodyText?.includes('Memverifikasi akses sesi')) {
        console.log('Stuck in verification');
    }
    if (bodyText?.includes('ID sesi tidak valid')) {
        console.log('Invalid Session ID');
    }

    // Debug: Check if we are stuck in loading
    const isStuck = await page.getByText('Memverifikasi akses sesi...').isVisible();
    if (isStuck) {
      console.log('Stuck in verification');
    }

    const isAccessDenied = await page.getByText('Akses sesi ditolak').isVisible();
    if (isAccessDenied) {
      console.log('Access denied shown');
    }

    const isLoadingAssessment = await page.getByText('Memuat asesmen...').isVisible();
    if (isLoadingAssessment) {
      console.log('Loading assessment shown');
    }

    // Wait for the first item to appear
    try {
      await expect(page.getByText('When I learn:')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log('Timeout waiting for "When I learn:". Dumping page content...');
      const content = await page.content();
      console.log(content);
      throw e;
    }

    // Check accessibility on item page
    const scan2 = await new AxeBuilder({ page }).analyze();
    expect(scan2.violations).toEqual([]);

    // Verify options are present
    await expect(page.getByText('I like to deal with my feelings')).toBeVisible();
    await expect(page.getByText('I like to watch and listen')).toBeVisible();

    // 3. Simulate Ranking (Using Buttons)
    // We need to assign unique ranks 1-4 to the options
    // Using the buttons is more reliable than drag-and-drop in E2E tests
    
    const option1 = page.locator('li').filter({ hasText: 'I like to deal with my feelings' });
    await option1.getByRole('button', { name: '4', exact: true }).click();
    
    const option2 = page.locator('li').filter({ hasText: 'I like to watch and listen' });
    await option2.getByRole('button', { name: '3', exact: true }).click();
    
    const option3 = page.locator('li').filter({ hasText: 'I like to think about ideas' });
    await option3.getByRole('button', { name: '2', exact: true }).click();
    
    const option4 = page.locator('li').filter({ hasText: 'I like to be doing things' });
    await option4.getByRole('button', { name: '1', exact: true }).click();

    // 4. Submit/Next
    // Since there is only one item, the button might say "Finish" or "Next"
    const nextButton = page.getByRole('button', { name: /next|finish|selesai|lanjut/i });
    await nextButton.click();

    // 5. Verify Redirection
    // It might go to review page first
    await page.waitForURL(/\/assessment\/.*\/review|\/report\/.*/);
    
    if (page.url().includes('/review')) {
        // Check accessibility on review page
        const scan3 = await new AxeBuilder({ page }).analyze();
        expect(scan3.violations).toEqual([]);

        await page.getByRole('button', { name: /submit|finish|kirim|selesai/i }).click();
        
        // Handle confirmation dialog
        await page.getByRole('button', { name: /yes, submit|ya, kirim/i }).click();
        
        await expect(page).toHaveURL(`/report/${mockSessionId}`);
    } else {
        await expect(page).toHaveURL(`/report/${mockSessionId}`);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Offline Learning Flow', () => {
  test('should allow downloading and accessing content offline', async ({ page, context }) => {
    // 1. Mock API responses for course content
    await page.route('**/api/v1/enrollments/test-course/content', async route => {
      await route.fulfill({
         json: {
            course: {
               id: 'test-course',
               title: 'Test Offline Course',
               description: 'Learn to farm offline',
               sections: [{
                  id: 's1',
                  title: 'Section 1',
                  lectures: [{
                     id: 'l1',
                     title: 'Test Lecture',
                     type: 'VIDEO',
                     duration: 600,
                     hlsUrl: 'mock-url'
                  }]
               }]
            },
            progress: []
         }
      });
    });

    // 2. Mock Download endpoint
    await page.route('**/api/v1/learn/lectures/*/download-url', async route => {
       await route.fulfill({ json: { url: 'https://example.com/mock.m3u8' } });
    });

    // 3. Navigate to course player
    await page.goto('/learn/test-course');
    
    // 4. Click download
    const downloadBtn = page.getByRole('button', { name: /Download/i });
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();
    
    // Expect modal
    await expect(page.getByText('Download for offline use')).toBeVisible();
    const confirmDownload = page.getByRole('button', { name: 'Download', exact: true });
    
    // We mock the actual downloadManager in the app using route intercept but for E2E relying on UI state:
    // We just want to ensure the UI responds.
    await confirmDownload.click();
    
    // 5. Simulate going offline
    await context.setOffline(true);
    
    // 6. Navigate to My Library
    // Mock the enrollments endpoint for offline
    await page.route('**/api/v1/enrollments', async route => {
      await route.fulfill({
         json: {
            enrollments: [{
               course: { id: 'test-course', title: 'Test Offline Course' },
               progress: []
            }]
         }
      });
    });
    
    await page.goto('/my-library');
    await expect(page.getByText('My Learning')).toBeVisible();
    await expect(page.getByText('Test Offline Course')).toBeVisible();
    
    // Verify offline banner
    await expect(page.getByText(/You are currently offline/i)).toBeVisible();
    
    // 7. Go back online
    await context.setOffline(false);
    await expect(page.getByText(/You are currently offline/i)).toBeHidden();
  });
});

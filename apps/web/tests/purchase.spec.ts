import { test, expect } from '@playwright/test';

// In a real environment, we would seed a user and a free course for E2E tests.
// Here we mock the setup by intercepting the checkout API response.

test.describe('Purchase and Enrollment Flow', () => {
  test('Fast-tracks free course enrollment', async ({ page }) => {
    // 1. Mock DB state by intercepting the catalog request to show a free course
    await page.route('**/api/v1/courses*', async route => {
      const json = {
        data: [{
          id: 'course-123',
          slug: 'free-farming-basics',
          title: 'Free Farming Basics',
          price: '0',
          category: { name: 'Basics' },
          instructor: { profile: { displayName: 'John Doe' } },
          _count: { sections: 1, enrollments: 0 }
        }]
      };
      await route.fulfill({ json });
    });

    // 2. Mock course details request
    await page.route('**/api/v1/courses/free-farming-basics', async route => {
      const json = {
        course: {
          id: 'course-123',
          slug: 'free-farming-basics',
          title: 'Free Farming Basics',
          price: '0',
          description: 'A free course.',
          instructor: { profile: { displayName: 'John Doe', headline: '', bio: '' } },
          sections: [],
          _count: { enrollments: 0, reviews: 0 }
        }
      };
      await route.fulfill({ json });
    });

    // 3. Mock checkout endpoint to return success fast-track
    await page.route('**/api/v1/payments/checkout', async route => {
      await route.fulfill({
        json: { enrolled: true, courseSlug: 'free-farming-basics' }
      });
    });

    // Login (mocked state for testing)
    // We navigate directly to catalog and pretend we're logged in for this test
    // In actual Playwright runs, we'd use a shared auth state fixture
    
    // Step 1: Initialize local storage on the domain before navigating to a protected route
    await page.goto('/');
    
    await page.evaluate(() => {
      window.localStorage.setItem('farmwise-cart', JSON.stringify([{
        id: 'course-123',
        title: 'Free Farming Basics',
        price: '0',
        instructorName: 'John Doe'
      }]));
      window.localStorage.setItem('farmwise-auth-storage', JSON.stringify({
        state: { token: 'mock-token', user: { id: 'u1', role: 'FARMER' } }
      }));
    });

    // Step 2: Now navigate to cart (auth is ready)
    await page.goto('/cart');

    // Step 3: Verify item is there by waiting for at least the cart title
    await page.waitForSelector('text=Shopping Cart', { state: 'visible' });
    await expect(page.locator('text=Free Farming Basics')).toBeVisible();
    await expect(page.locator('text=Original Price:')).toBeVisible();

    // Step 4: Click Checkout
    const checkoutBtn = page.locator('button:has-text("Secure Checkout")');
    await expect(checkoutBtn).toBeVisible();
    
    // Simulate clicking checkout (will trigger the mocked API)
    await checkoutBtn.click();

    // Step 5: Verify fast-track redirect to /learn page (since it's a mock we just wait for URL change)
    await page.waitForURL('**/learn/free-farming-basics');
    expect(page.url()).toContain('/learn/free-farming-basics');
  });
});

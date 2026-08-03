import { expect, test, type Page } from '@playwright/test';
import { TestStepHelper } from './helpers/test-step-helper';

async function openLauncher(page: Page) {
  await page.goto('/');
  const surface = page.locator('[data-e2e-layout]');
  await expect(surface).toHaveAttribute('data-status', 'current');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  return surface;
}

async function dragTileBy(page: Page, accessibleName: string, degrees: number) {
  const tileBox = await page.getByRole('button', { name: accessibleName }).boundingBox();
  const surfaceBox = await page.locator('[data-e2e-layout]').boundingBox();
  expect(tileBox).not.toBeNull();
  expect(surfaceBox).not.toBeNull();

  const centerX = surfaceBox!.x + surfaceBox!.width / 2;
  const centerY = surfaceBox!.y + surfaceBox!.height / 2;
  const startX = tileBox!.x + tileBox!.width / 2;
  const startY = tileBox!.y + tileBox!.height / 2;
  const radius = Math.hypot(startX - centerX, startY - centerY);
  const startAngle = Math.atan2(startY - centerY, startX - centerX);
  const endAngle = startAngle + (degrees * Math.PI) / 180;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(
    centerX + Math.cos(endAngle) * radius,
    centerY + Math.sin(endAngle) * radius,
    { steps: 8 }
  );
  await page.mouse.up();
}

test('renders one fixed omnidirectional surface with safe geometry', async ({ page }, testInfo) => {
  const surface = await openLauncher(page);
  const steps = new TestStepHelper(page, testInfo);
  await steps.step('page-one-ready', {
    screenshot: 'page-one.png',
    verifications: [
      () => expect(page.locator('[data-game-id]')).toHaveCount(8),
      () => expect(page.locator('[data-handle]')).toHaveCount(4),
      () => expect(page.locator('[data-catalogue-gate]')).toHaveCount(1),
      () => expect(page.getByRole('button', { name: /Show next games, page 2 of 3/ })).toBeVisible()
    ]
  });

  const geometry = await page.locator('[data-game-id]').evaluateAll((tiles) =>
    tiles.map((tile) => {
      const rectangle = tile.getBoundingClientRect();
      return {
        edge: tile.getAttribute('data-edge'),
        left: rectangle.left,
        top: rectangle.top,
        right: rectangle.right,
        bottom: rectangle.bottom,
        width: rectangle.width,
        height: rectangle.height
      };
    })
  );
  expect(new Set(geometry.map(({ edge }) => edge))).toEqual(
    new Set(['north', 'east', 'south', 'west'])
  );
  for (const tile of geometry) {
    expect(tile.width).toBeGreaterThanOrEqual(120);
    expect(tile.height).toBeGreaterThanOrEqual(120);
    expect(tile.left).toBeGreaterThanOrEqual(0);
    expect(tile.top).toBeGreaterThanOrEqual(0);
    expect(tile.right).toBeLessThanOrEqual(1920);
    expect(tile.bottom).toBeLessThanOrEqual(1080);
  }
  await expect(surface).toHaveAttribute('data-status', 'current');
});

test('center logo spins to eight-game boundaries and wraps without launching', async ({ page }, testInfo) => {
  await openLauncher(page);
  const steps = new TestStepHelper(page, testInfo);
  let popupCount = 0;
  page.on('popup', () => popupCount++);

  const center = page.getByRole('button', { name: /Show next games/ });
  await center.click();
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-sequence-start', '8');
  await expect(page.locator('[data-game-id]')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Launch Hearthland' })).toBeVisible();
  await expect(center).toHaveAccessibleName('Show next games, page 3 of 3');

  await center.click();
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-sequence-start', '16');
  await expect(page.locator('[data-game-id]')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Launch Tidelines' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Launch Aurora Lines' })).toBeVisible();
  await expect(center).toHaveAccessibleName('Show next games, page 1 of 3');

  await center.click();
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-sequence-start', '18');
  await expect(page.getByRole('button', { name: 'Launch Aurora Lines' })).toBeVisible();
  expect(popupCount).toBe(0);
  await steps.step('paging-wrapped', { verifications: [() => expect(popupCount).toBe(0)] });
});

test('launches directly from north, east, south, west, and a corner', async ({ page, context }, testInfo) => {
  await context.route('https://games.example.test/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Fixture game</title>' })
  );
  await openLauncher(page);
  const steps = new TestStepHelper(page, testInfo);

  const candidates = await page.locator('[data-game-id]').evaluateAll((tiles) =>
    tiles.map((tile) => ({
      id: tile.getAttribute('data-game-id')!,
      edge: tile.getAttribute('data-edge')!,
      angle: Number(tile.getAttribute('data-angle'))
    }))
  );
  const selected = [
    candidates.find(({ angle }) => angle === 292.5)!,
    candidates.find(({ angle }) => angle === 22.5)!,
    candidates.find(({ angle }) => angle === 112.5)!,
    candidates.find(({ angle }) => angle === 202.5)!,
    candidates.find(({ angle }) => angle === 337.5)!
  ];
  let popupCount = 0;
  page.on('popup', () => popupCount++);

  for (const candidate of selected) {
    const popupPromise = page.waitForEvent('popup');
    await page.locator(`[data-game-id="${candidate.id}"]`).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(`https://games.example.test/${candidate.id}`);
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
  }
  expect(popupCount).toBe(5);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await steps.step('five-approaches-launched', {
    verifications: [() => expect(popupCount).toBe(5)]
  });
});

test('a game crosses the tunnel and center paging completes its boundary', async ({ page }, testInfo) => {
  await openLauncher(page);
  const steps = new TestStepHelper(page, testInfo);
  let popupCount = 0;
  page.on('popup', () => popupCount++);

  await dragTileBy(page, 'Launch Aurora Lines', 60);

  await expect(page.getByRole('button', { name: 'Launch Aurora Lines' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Launch Hearthland' })).toBeVisible();
  await expect(page.locator('[data-game-id]')).toHaveCount(8);
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-sequence-start', '1');
  await expect(page.locator('[data-gate-transition="forward"]')).toHaveCount(1);
  await expect(page.locator('[data-gate-transition="forward"] .tile-title'))
    .toHaveText('Lantern Market');
  await expect(page.locator('.gate-outgoing-forward')).toHaveCount(1);
  expect(await page.locator('.gate-outgoing-forward').evaluate((element) =>
    getComputedStyle(element).clipPath
  )).not.toBe('none');
  expect(await page.locator('.gate-incoming-forward').evaluate((element) =>
    getComputedStyle(element).clipPath
  )).not.toBe('none');
  await expect(page.getByRole('button', { name: /Show next games/ }))
    .toHaveAccessibleName('Show next games, page 2 of 3');
  expect(popupCount).toBe(0);

  const movedBox = await page.getByRole('button', { name: 'Launch Hearthland' }).boundingBox();
  expect(movedBox).not.toBeNull();
  await page.mouse.move(movedBox!.x + 2, movedBox!.y + movedBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(movedBox!.x - 8, movedBox!.y + movedBox!.height / 2);
  await page.mouse.up();
  expect(popupCount).toBe(0);

  await steps.step('ring-browsed', {
    screenshot: 'rotated-page.png',
    verifications: [() => expect(popupCount).toBe(0)]
  });

  await page.getByRole('button', { name: /Show next games/ }).click();
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-sequence-start', '8');
  await expect(page.locator('[data-e2e-layout]')).toHaveAttribute('data-ring-angle', '0.00');
  await expect(page.getByRole('button', { name: 'Launch Hearthland' }))
    .toHaveAttribute('data-angle', '337.50');
  await expect(page.locator('[data-game-id]')).toHaveCount(8);
  await expect(page.getByRole('button', { name: /Show next games/ }))
    .toHaveAccessibleName('Show next games, page 3 of 3');
  expect(popupCount).toBe(0);
});

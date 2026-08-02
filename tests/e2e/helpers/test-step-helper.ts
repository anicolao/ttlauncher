import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

interface StepOptions {
  verifications: Array<() => Promise<void> | void>;
  screenshot?: string;
}

export class TestStepHelper {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo
  ) {}

  async step(name: string, options: StepOptions) {
    for (const verify of options.verifications) await verify();
    await expect(this.page.locator('[data-e2e-layout]')).toHaveAttribute('data-status', 'current');
    await this.page.mouse.move(1, 1);
    await this.stabilizeAssets();
    await this.assertFixedTable();
    if (options.screenshot) {
      await expect(this.page.locator('[data-e2e-layout]')).toHaveScreenshot(options.screenshot);
    }
    await this.testInfo.attach(`${name}.json`, {
      body: Buffer.from(JSON.stringify({ step: name, viewport: '1920x1080', status: 'current' })),
      contentType: 'application/json'
    });
  }

  private async stabilizeAssets() {
    await this.page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
  }

  private async assertFixedTable() {
    expect(this.page.viewportSize()).toEqual({ width: 1920, height: 1080 });
    expect(await this.page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }))).toEqual({ width: 1920, height: 1080 });

    const tiles = this.page.locator('[data-game-id]');
    for (let index = 0; index < await tiles.count(); index++) {
      const rectangle = await requiredBox(tiles.nth(index));
      expect(rectangle.width).toBeGreaterThanOrEqual(120);
      expect(rectangle.height).toBeGreaterThanOrEqual(120);
      expect(rectangle.x).toBeGreaterThanOrEqual(0);
      expect(rectangle.y).toBeGreaterThanOrEqual(0);
      expect(rectangle.x + rectangle.width).toBeLessThanOrEqual(1920);
      expect(rectangle.y + rectangle.height).toBeLessThanOrEqual(1080);
    }

    const obstacles = this.page.locator('.center-shell, [data-handle]');
    for (let tileIndex = 0; tileIndex < await tiles.count(); tileIndex++) {
      const tile = await requiredBox(tiles.nth(tileIndex));
      for (let obstacleIndex = 0; obstacleIndex < await obstacles.count(); obstacleIndex++) {
        const obstacle = await requiredBox(obstacles.nth(obstacleIndex));
        expect(overlaps(tile, obstacle)).toBe(false);
      }
    }
  }
}

async function requiredBox(locator: Locator) {
  const rectangle = await locator.boundingBox();
  expect(rectangle).not.toBeNull();
  return rectangle!;
}

function overlaps(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

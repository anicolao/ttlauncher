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

    const renderedCollisions = await tiles.evaluateAll((tileElements) => {
      const obstacles = [...document.querySelectorAll<HTMLElement>('.center-shell, [data-handle]')];
      const labels = (element: Element) =>
        element.getAttribute('data-game-id') ??
        element.getAttribute('data-handle') ??
        element.className.toString();

      return tileElements.flatMap((tile) => {
        const tileRectangle = tile.getBoundingClientRect();
        return obstacles.flatMap((obstacle) => {
          const obstacleRectangle = obstacle.getBoundingClientRect();
          const left = Math.max(tileRectangle.left, obstacleRectangle.left);
          const right = Math.min(tileRectangle.right, obstacleRectangle.right);
          const top = Math.max(tileRectangle.top, obstacleRectangle.top);
          const bottom = Math.min(tileRectangle.bottom, obstacleRectangle.bottom);
          if (left >= right || top >= bottom) return [];

          // Rotated, clipped wedges have large transparent corners in their
          // axis-aligned bounding boxes. Sample the intersection through the
          // browser's hit-testing so only the rendered/tappable trapezoid counts.
          const xCoordinates = [left + 1, (left + right) / 2, right - 1];
          const yCoordinates = [top + 1, (top + bottom) / 2, bottom - 1];
          for (let x = left + 6; x < right; x += 12) xCoordinates.push(x);
          for (let y = top + 6; y < bottom; y += 12) yCoordinates.push(y);

          for (const x of xCoordinates) {
            for (const y of yCoordinates) {
              const stack = document.elementsFromPoint(x, y);
              const hitsTile = stack.some((element) => element === tile || tile.contains(element));
              const hitsObstacle = stack.some(
                (element) => element === obstacle || obstacle.contains(element)
              );
              if (hitsTile && hitsObstacle) return [`${labels(tile)} overlaps ${labels(obstacle)}`];
            }
          }
          return [];
        });
      });
    });
    expect(renderedCollisions).toEqual([]);
  }
}

async function requiredBox(locator: Locator) {
  const rectangle = await locator.boundingBox();
  expect(rectangle).not.toBeNull();
  return rectangle!;
}

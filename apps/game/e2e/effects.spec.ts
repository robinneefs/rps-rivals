import { expect, test } from '@playwright/test';

test('effects studio tunes, previews, persists and presents above the pixel framebuffer', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as unknown as { __rps?: { scenes: () => string[] } }).__rps?.scenes() ?? [],
        ),
      { timeout: 20000 },
    )
    .toContain('Home');
  await expect(page.getByRole('heading', { name: 'Effects studio' })).toBeVisible();
  await expect.poll(() => page.locator('#game canvas').count()).toBe(2);
  const dimensions = await page.locator('#game canvas').evaluateAll((canvases) =>
    canvases.map((canvas) => ({
      width: (canvas as HTMLCanvasElement).width,
      height: (canvas as HTMLCanvasElement).height,
    })),
  );
  expect(dimensions[1]!.width).toBeGreaterThan(dimensions[0]!.width);
  await page.getByRole('button', { name: 'Worn arcade', exact: true }).click();
  const glow = page.getByRole('spinbutton', { name: 'Phosphor glow', exact: true });
  await expect(glow).toHaveValue('1.4');
  await glow.fill('1.8');
  await page.reload();
  await expect(glow).toHaveValue('1.8');
  await page.getByRole('button', { name: 'One-shot effects', exact: true }).click();
  await page.getByRole('button', { name: 'glitch', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Row distortion · game pixels' })).toHaveValue('5');
  await page.getByRole('button', { name: '▶ Replay effect', exact: true }).click();
  await page.getByRole('button', { name: 'Stop effects', exact: true }).click();
  await page.getByRole('button', { name: 'Hide effects studio' }).click();
  await expect(page.getByRole('button', { name: 'Effects studio · F4' })).toBeVisible();
  await page.keyboard.press('F4');
  await expect(page.getByRole('heading', { name: 'Effects studio' })).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/effects-studio.png' });
});

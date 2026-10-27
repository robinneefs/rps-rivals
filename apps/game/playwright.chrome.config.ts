// Optional local runner using installed Chrome instead of downloading Playwright's Chromium.
import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({ ...config, use: { ...config.use, channel: 'chrome' } });

import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to the map page using the local web server
        await page.goto("http://localhost:8000/#map", wait_until="domcontentloaded")

        # The router injects the map view, which contains the #map div.
        map_container = page.locator("#routerView #map")
        await expect(map_container).to_be_visible(timeout=10000)

        # Wait for the map tiles to load to ensure the map is rendering.
        await expect(page.locator(".leaflet-tile-loaded").first).to_be_visible(timeout=15000)

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
import subprocess, time, os, sys, urllib.request

BACKEND_VENV = "/home/marathon15/scriptforge-ai/backend/venv/bin/activate"
PLAYWRIGHT_SITE = "/home/marathon15/venv/lib/python3.13/site-packages"

def wait_for(url, label, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=3)
            print(f"{label} OK", flush=True)
            return True
        except Exception:
            time.sleep(1)
    print(f"{label} FAILED (timeout after {timeout}s)", flush=True)
    return False

# Start backend
backend = subprocess.Popen(
    ["bash", "-c", f"source {BACKEND_VENV} && cd /home/marathon15/scriptforge-ai/backend && python -m uvicorn app:app --port 8000 --host 0.0.0.0"],
    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE
)

# Start frontend
frontend = subprocess.Popen(
    ["bash", "-c", "cd /home/marathon15/scriptforge-ai/frontend && npm run dev -- --port 5173 --host"],
    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE
)

print("Polling for servers...", flush=True)

if not wait_for("http://127.0.0.1:8000/docs", "Backend", timeout=20):
    print(backend.stderr.read(2000).decode(errors="replace"))
    backend.terminate(); frontend.terminate()
    sys.exit(1)

if not wait_for("http://127.0.0.1:5173", "Frontend", timeout=30):
    print(frontend.stderr.read(2000).decode(errors="replace"))
    backend.terminate(); frontend.terminate()
    sys.exit(1)

sys.path.insert(0, PLAYWRIGHT_SITE)
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:5173")
        await page.wait_for_load_state("networkidle")
        print("App loaded", flush=True)

        # --- CheatSheets tab ---
        await page.click('text=Cheat Sheets')
        await page.wait_for_timeout(600)
        print("On CheatSheets tab", flush=True)

        await page.click('button:has-text("Build Command")')
        print("Clicked Build Command", flush=True)

        try:
            await page.wait_for_selector('text=Building…', timeout=8000)
            print("PASS: CheatSheets streaming panel appeared", flush=True)
        except:
            print("FAIL: CheatSheets streaming panel did not appear", flush=True)

        try:
            await page.wait_for_selector('text=Command', timeout=35000)
            print("PASS: CheatSheets result appeared", flush=True)
        except Exception as e:
            print(f"FAIL: CheatSheets result timed out: {e}", flush=True)

        await page.screenshot(path="/home/marathon15/scriptforge-ai/test_cheatsheets.png")
        print("Screenshot: test_cheatsheets.png", flush=True)

        # --- Tutor tab ---
        await page.click('text=AI Tutor')
        await page.wait_for_timeout(800)
        await page.screenshot(path="/home/marathon15/scriptforge-ai/test_tutor_tab.png")
        print("On Tutor tab (screenshot saved)", flush=True)

        editor = page.locator('textarea').first
        await editor.click()
        await editor.fill('for i in range(10):\n    print(i)')
        await page.wait_for_timeout(400)

        await page.click('button:has-text("Explain This")')
        print("Clicked Explain This", flush=True)

        try:
            await page.wait_for_selector('text=Analyzing…', timeout=8000)
            print("PASS: Tutor loading indicator appeared", flush=True)
        except:
            print("FAIL: Tutor loading indicator did not appear", flush=True)

        try:
            await page.wait_for_selector('text=Line-by-Line Breakdown', timeout=45000)
            print("PASS: Tutor result appeared", flush=True)
        except Exception as e:
            print(f"FAIL: Tutor result timed out: {e}", flush=True)

        await page.screenshot(path="/home/marathon15/scriptforge-ai/test_tutor_new.png")
        print("Screenshot: test_tutor_new.png", flush=True)

        # --- Simulate tab ---
        await page.click('text=Simulate')
        await page.wait_for_timeout(600)
        print("On Simulate tab", flush=True)

        editor2 = page.locator('textarea').first
        await editor2.click()
        await editor2.fill('#!/bin/bash\nrm -rf /tmp/test_dir\nmkdir /tmp/test_dir\necho "hello" > /tmp/test_dir/file.txt')
        await page.wait_for_timeout(300)

        await page.click('button:has-text("Dry Run")')
        print("Clicked Dry Run", flush=True)

        try:
            await page.wait_for_selector('text=Simulating…', timeout=8000)
            print("PASS: Simulate streaming panel appeared", flush=True)
        except:
            print("FAIL: Simulate streaming panel did not appear", flush=True)

        try:
            await page.wait_for_selector('text=Step-by-Step Execution', timeout=35000)
            print("PASS: Simulate result appeared", flush=True)
        except Exception as e:
            print(f"FAIL: Simulate result timed out: {e}", flush=True)

        await page.screenshot(path="/home/marathon15/scriptforge-ai/test_simulate.png")
        print("Screenshot: test_simulate.png", flush=True)

        # --- Sandbox tab ---
        await page.click('text=Sandbox')
        await page.wait_for_timeout(600)
        print("On Sandbox tab", flush=True)

        await page.click('button:has-text("Run in Sandbox")')
        print("Clicked Run in Sandbox", flush=True)

        try:
            await page.wait_for_selector('text=Live Output', timeout=12000)
            print("PASS: Sandbox live output panel appeared", flush=True)
        except:
            print("FAIL: Sandbox live output panel did not appear", flush=True)

        try:
            await page.wait_for_selector('text=Output', timeout=30000)
            print("PASS: Sandbox final result appeared", flush=True)
        except Exception as e:
            print(f"FAIL: Sandbox result timed out: {e}", flush=True)

        await page.screenshot(path="/home/marathon15/scriptforge-ai/test_sandbox_new.png")
        print("Screenshot: test_sandbox_new.png", flush=True)

        await browser.close()
        print("All tests done.", flush=True)

asyncio.run(main())
backend.terminate()
frontend.terminate()

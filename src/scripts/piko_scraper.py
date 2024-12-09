# scripts/piko_scraper.py
from playwright.sync_api import sync_playwright
import json
import sys
import time

def convert_german_number(value_str):
    """Convert German formatted number (1.234,56) to float"""
    return float(value_str.replace('.', '').replace(',', '.').replace('W', '').strip())

# Start persistent browser at script initialization
browser = None

def init_browser():
    global browser
    if browser is None:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

def get_solar_data():
    global browser
    if browser is None:
        init_browser()

    page = browser.new_page()
    url = "http://192.168.178.135"

    try:
        page.goto(url)
        page.wait_for_selector(".value")

        dc_input = convert_german_number(
            page.locator("xpath=//label[contains(text(), 'DC-Eingang')]/../div").inner_text()
        )
        output = convert_german_number(
            page.locator("xpath=//label[contains(text(), 'Ausgangsleistung')]/../div").inner_text()
        )

        data = {
            'currentPower': output / 1000,  # Convert W to kW
            'dailyEnergy': 0,  # You can add this if available from the website
            'totalEnergy': 0   # You can add this if available from the website
        }

        browser.close()
        return data

    except Exception as e:
        print(f"Error accessing solar data: {e}")  # Add debugging
        browser.close()
        raise e

if __name__ == "__main__":
    if "--once" in sys.argv:
        try:
            data = get_solar_data()
            print(json.dumps(data))
        except Exception as e:
            print(json.dumps({
                'currentPower': 0,
                'dailyEnergy': 0,
                'totalEnergy': 0,
                'error': str(e)
            }))
    else:
        while True:
            try:
                data = get_solar_data()
                print(data)
                time.sleep(60)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(60)
from playwright.sync_api import sync_playwright
import json
import sys
import time
import traceback

def convert_german_number(value_str):
    """Convert German formatted number (1.234,56) to float"""
    try:
        return float(value_str.replace('.', '').replace(',', '.').replace('W', '').strip())
    except (ValueError, AttributeError) as e:
        print(f"Error converting number '{value_str}': {e}", file=sys.stderr)
        return 0

def format_power(watts):
    """Format power value to appropriate unit"""
    try:
        if watts >= 1000:
            return {
                'value': round(watts / 1000, 2),
                'unit': 'kW'
            }
        return {
            'value': round(watts),
            'unit': 'W'
        }
    except Exception as e:
        print(f"Error formatting power value: {e}", file=sys.stderr)
        return {'value': 0, 'unit': 'W'}

def get_solar_data():
    """Get solar data from the inverter web interface"""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            url = "http://192.168.178.135"

            try:
                page.goto(url)
                page.wait_for_selector(".value", timeout=10000)  # 10 second timeout

                dc_input = convert_german_number(
                    page.locator("xpath=//label[contains(text(), 'DC-Eingang')]/../div").inner_text()
                )
                output = convert_german_number(
                    page.locator("xpath=//label[contains(text(), 'Ausgangsleistung')]/../div").inner_text()
                )

                power_formatted = format_power(output)

                data = {
                    'currentPower': power_formatted['value'],
                    'currentPowerUnit': power_formatted['unit'],
                    'dailyEnergy': 0,
                    'totalEnergy': 0
                }

                return data

            except Exception as e:
                print(f"Error accessing solar data: {e}\n{traceback.format_exc()}", file=sys.stderr)
                raise
            finally:
                browser.close()
    except Exception as e:
        print(f"Critical error in get_solar_data: {e}\n{traceback.format_exc()}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if "--once" in sys.argv:
        try:
            data = get_solar_data()
            print(json.dumps(data), flush=True)  # Ensure output is flushed
        except Exception as e:
            error_data = {
                'currentPower': 0,
                'currentPowerUnit': 'W',
                'dailyEnergy': 0,
                'totalEnergy': 0,
                'error': str(e)
            }
            print(json.dumps(error_data), flush=True)  # Ensure output is flushed
            sys.exit(1)  # Exit with error code
    else:
        while True:
            try:
                data = get_solar_data()
                print(json.dumps(data), flush=True)
                time.sleep(60)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}", file=sys.stderr)
                time.sleep(60)
# src/scripts/heater_control_api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio
from typing import List, Optional
from playwright.sync_api import sync_playwright
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HeaterUpdate(BaseModel):
    id: int
    state: bool

class AutoModeUpdate(BaseModel):
    enabled: bool

class HeaterState(BaseModel):
    id: int
    name: str
    state: bool

class SystemState(BaseModel):
    auto_mode: bool
    heaters: List[HeaterState]

# Global state
system_state = {
    'auto_mode': False,
    'heaters': [
        {"id": 1, "name": "Heizstab 1 - Phase 1", "state": False},
        {"id": 2, "name": "Heizstab 1 - Phase 2", "state": False},
        {"id": 3, "name": "Heizstab 1 - Phase 3", "state": False},
        {"id": 4, "name": "Heizstab 2 - Phase 1", "state": False},
        {"id": 5, "name": "Heizstab 2 - Phase 2", "state": False},
        {"id": 6, "name": "Heizstab 2 - Phase 3", "state": False},
    ]
}

def convert_german_number(value_str: str) -> float:
    """Convert German formatted number (1.234,56) to float"""
    return float(value_str.replace('.', '').replace(',', '.').replace('W', '').strip())

def get_solar_data():
    """Get solar data from the inverter"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
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

            return {'currentPower': output }  # Convert W to kW
        except Exception as e:
            logger.error(f"Error accessing solar data: {e}")
            return {'currentPower': 0}
        finally:
            browser.close()

async def auto_control_loop():
    """Background task for automatic heater control"""
    while True:
        if system_state['auto_mode']:
            try:
                solar_data = get_solar_data()
                current_power = solar_data['currentPower']
                logger.info(f"Current solar power: {current_power}kW")

                # Basic control logic based on available solar power
                if current_power >= 6:  # If we have enough power for two phases
                    # Enable first two phases of first heating rod
                    system_state['heaters'][0]['state'] = True
                    system_state['heaters'][1]['state'] = True
                    system_state['heaters'][2]['state'] = False
                elif current_power >= 3:  # If we have enough power for one phase
                    system_state['heaters'][0]['state'] = True
                    system_state['heaters'][1]['state'] = False
                    system_state['heaters'][2]['state'] = False
                else:  # Not enough power
                    for heater in system_state['heaters']:
                        heater['state'] = False

            except Exception as e:
                logger.error(f"Error in auto control loop: {e}")

        await asyncio.sleep(60)  # Check every minute

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(auto_control_loop())
    yield
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

@app.get("/api/heaters")
async def get_heaters():
    return system_state

@app.patch("/api/heaters")
async def update_heater(update: HeaterUpdate):
    if system_state['auto_mode']:
        raise HTTPException(status_code=400, detail="Cannot update heaters while in auto mode")

    for heater in system_state['heaters']:
        if heater['id'] == update.id:
            heater['state'] = update.state
            return system_state

    raise HTTPException(status_code=404, detail="Heater not found")

@app.patch("/api/auto-mode")
async def update_auto_mode(update: AutoModeUpdate):
    system_state['auto_mode'] = update.enabled
    if not update.enabled:  # Turn off all heaters when disabling auto mode
        for heater in system_state['heaters']:
            heater['state'] = False
    return system_state

@app.get("/api/solar")
async def get_solar():
    return get_solar_data()

if __name__ == "__main__":
    import uvicorn
    port = 8001  # Changed from 8000 to 8001
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
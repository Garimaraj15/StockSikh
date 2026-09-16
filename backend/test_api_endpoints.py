import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all():
    print("--- 1. Testing Root Endpoint ---")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("Root API OK:", res.json()["message"])

    print("\n--- 2. Testing Market Indices ---")
    res = client.get("/stocks/indices")
    assert res.status_code == 200, f"Indices failed: {res.text}"
    indices = res.json().get("indices", [])
    assert len(indices) > 0, "No indices returned"
    for idx in indices:
        print(f"  Index: {idx['display']} | Price: {idx['price']} | Change: {idx['change_percent']}%")

    print("\n--- 3. Testing Preset Stocks ---")
    res = client.get("/stocks/preset")
    assert res.status_code == 200, f"Presets failed: {res.text}"
    stocks = res.json().get("stocks", [])
    assert len(stocks) > 0, "No preset stocks returned"
    print(f"Preset stocks loaded: {len(stocks)} stocks")
    print(f"Sample: {stocks[0]['name']} ({stocks[0]['symbol']}) - Rs. {stocks[0]['price']} - Signal: {stocks[0]['signal']}")

    print("\n--- 4. Testing Stock Search ---")
    res = client.get("/stocks/search?q=tcs")
    assert res.status_code == 200, f"Search failed: {res.text}"
    results = res.json().get("results", [])
    assert len(results) > 0, "No results for TCS"
    print(f"Search 'tcs' returned {len(results)} matches: {results[0]['name']}")

    print("\n--- 5. Testing Stock Details ---")
    res = client.get("/stocks/RELIANCE.NS")
    assert res.status_code == 200, f"Stock details failed: {res.text}"
    data = res.json()
    assert "price" in data, "No price in stock details"
    print(f"Reliance details: Price Rs. {data['price']}, RSI: {data.get('rsi')}, MA20: Rs. {data.get('ma20')}, Signal: {data.get('signal')}")
    print(f"Chart points: {len(data.get('chart', []))}")

    print("\n--- 6. Testing Vidya AI Chatbot ---")
    res = client.post("/chat/", json={"message": "What is RSI in simple words?"})
    assert res.status_code == 200, f"Chat failed: {res.text}"
    reply = res.json().get("reply", "")
    assert len(reply) > 0, "Empty chat reply"
    print("Vidya AI Reply preview:\n" + reply[:150] + "...")

    print("\n--- 7. Testing Auth Flow (Signup & Login) ---")
    import time
    test_email = f"trader_{int(time.time())}@example.com"
    signup_res = client.post("/auth/signup", json={"name": "Groww Trader", "email": test_email, "password": "password123"})
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"

    login_res = client.post("/auth/login", json={"email": test_email, "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    user_id = login_res.json()["user"]["id"]
    print(f"User authenticated successfully: ID {user_id}, Name {login_res.json()['user']['name']}")

    print("\n--- 8. Testing Watchlist Endpoints ---")
    add_res = client.post(f"/watchlist/add?user_id={user_id}&symbol=TCS.NS")
    assert add_res.status_code == 200, f"Watchlist add failed: {add_res.text}"
    print("Added to watchlist:", add_res.json()["message"])

    details_res = client.get(f"/watchlist/details?user_id={user_id}")
    assert details_res.status_code == 200, f"Watchlist details failed: {details_res.text}"
    items = details_res.json()
    assert len(items) >= 1, "Watchlist item missing"
    print(f"Watchlist items: {len(items)}, first item: {items[0]['symbol']} at Rs. {items[0]['price']}")

    del_res = client.delete(f"/watchlist/remove?user_id={user_id}&symbol=TCS.NS")
    assert del_res.status_code == 200, f"Watchlist delete failed: {del_res.text}"
    print("Deleted from watchlist:", del_res.json()["message"])

    print("\n==========================================")
    print(" ALL 8 BACKEND & API TESTS PASSED 100%! ")
    print("==========================================")

if __name__ == "__main__":
    test_all()

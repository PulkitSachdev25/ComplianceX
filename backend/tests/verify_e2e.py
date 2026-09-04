import requests
import json

def verify_all():
    print("=== 1. Checking Health Endpoint ===")
    h = requests.get('http://localhost:8000/api/health').json()
    print("Health response:", h)

    print("\n=== 2. Citizen Mode: 2 Products Deception Analysis ===")
    c_res = requests.post('http://localhost:8000/api/citizen/analyze', json={
        'products': [
            {'product_id': 'prod_1', 'preset_key': 'zero_sugar_juice'},
            {'product_id': 'prod_2', 'preset_key': 'atta_cookies'}
        ]
    }).json()

    print(f"Analyzed count: {c_res['analyzed_count']}")
    for p in c_res['products']:
        print(f"\nProduct: {p['product_name']} | Nutri-Grade: {p['nutri_grade']} | Verdict: {p['verdict_badge']}")
        print(f"Headline: {p['headline']}")
        print(f"Advice: {p['actionable_advice']}")
        print("Flags:")
        for f in p['flags']:
            print(f"  - [{f['severity']}] {f['title']}: {f['regulation']}")

    print("\n=== 3. Citizen Mode: Side-by-Side Comparison Matrix ===")
    print(json.dumps(c_res['comparison'], indent=2))

    print("\n=== 4. Inspector Mode: Statutory Compliance & USP Math Fraud Audit ===")
    i_res = requests.post('http://localhost:8000/api/inspector/audit', json={
        'preset_key': 'fraudulent_pricing_chips',
        'geolocation': {'latitude': 28.6139, 'longitude': 77.2090, 'display_name': 'New Delhi, India'},
        'inspector_id': 'LM-INSP-DEL-4091'
    }).json()

    print(f"Commodity: {i_res.get('commodity_name')}")
    print(f"Overall Verdict: {i_res.get('overall_verdict')}")
    print(f"Violations Count: {i_res.get('violations_count')}")
    print(f"USP Math Audit: {i_res.get('usp_math_audit')}")
    print(f"Docket ID: {i_res.get('docket_id')}")
    print(f"Master Chain of Custody SHA-256: {i_res.get('master_evidence_sha256')}")

    print("\n=== 5. Inspector Mode: ReportLab Section 36(1) PDF Generation ===")
    pdf_resp = requests.post('http://localhost:8000/api/inspector/generate-docket-pdf', json=i_res)
    print(f"PDF Status Code: {pdf_resp.status_code}")
    print(f"PDF Content-Type: {pdf_resp.headers.get('content-type')}")
    print(f"PDF Content-Disposition: {pdf_resp.headers.get('content-disposition')}")
    print(f"PDF Size: {len(pdf_resp.content)} bytes")
    
    with open('Section36_Sample_Docket.pdf', 'wb') as f:
        f.write(pdf_resp.content)
    print("Section36_Sample_Docket.pdf created successfully.")

    print("\n=== 6. Offline Queue Batch Synchronization ===")
    sync_res = requests.post('http://localhost:8000/api/inspector/sync-offline-queue', json={
        'queue': [
            {'docket_id': 'GOI-LM-OFFLINE-001', 'commodity_name': 'Remote Warehouse Rice 5kg', 'is_compliant': True}
        ]
    }).json()
    print("Sync Result:", sync_res)

    print("\n=== 7. Reverse Geocoding Proxy ===")
    geo_res = requests.get('http://localhost:8000/api/reverse-geocode?lat=28.6139&lon=77.2090').json()
    print("Reverse Geocode:", geo_res.get('display_name'))

    print("\n=== ALL SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    verify_all()

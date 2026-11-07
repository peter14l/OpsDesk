import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_e2e_backend():
    print("--- 1. Testing Ticket Listing & Filtering ---")
    resp = client.get("/api/v1/tickets")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    items = data["items"]
    print(f"Total tickets returned: {data['total']}, items in page: {len(items)}")
    assert len(items) >= 10, "Expected at least 10 tickets seeded"

    # Find Ticket 1 (TBOH-7849102-M)
    t1 = next((t for t in items if t["tboh_hash"] == "TBOH-7849102-M"), None)
    assert t1 is not None, "TBOH-7849102-M should exist"
    print(f"Found Ticket: {t1['ticket_number']} | Hash: {t1['tboh_hash']} | SLA: {t1['sla_status']}")

    print("--- 2. Testing Context Linkage Service ---")
    link_resp = client.get(f"/api/v1/tickets/{t1['id']}/context-links")
    assert link_resp.status_code == 200
    links = link_resp.json()
    print(f"Context Links for {t1['ticket_number']}:")
    print(f"  - Same booking ({t1['tboh_hash']}): {len(links['same_booking_tickets'])} linked tickets")
    print(f"  - Same agency: {len(links['same_agency_tickets'])} linked tickets")
    assert len(links["same_booking_tickets"]) >= 1, "Expected at least 1 linked ticket sharing same booking hash"

    print("--- 3. Testing Transferred Ticket & Supplier Side-Conversation Recipient Retention ---")
    t_transferred = next((t for t in items if t["tboh_hash"] == "TBOH-3301928-E"), None)
    assert t_transferred is not None
    side_resp = client.get(f"/api/v1/tickets/{t_transferred['id']}/side-conversations")
    assert side_resp.status_code == 200
    side_convos = side_resp.json()
    print(f"Side-conversations found: {len(side_convos)}")
    assert len(side_convos) >= 1
    sc = side_convos[0]
    print(f"  - Supplier Name: {sc['supplier_name']}")
    print(f"  - Preserved Recipient Array: {sc['recipient_emails']}")
    print(f"  - Messages in thread: {len(sc['messages'])}")
    assert len(sc["recipient_emails"]) >= 3, "Expected explicit recipient list preserved"

    print("--- 4. Testing First-Class Escalation Matrix ---")
    esc_resp = client.post(
        f"/api/v1/tickets/{t1['id']}/escalate",
        json={
            "reason": "Supplier CRS unresponsive after 30 minutes. Guest at check-in counter.",
            "escalation_notes": "Authorize direct payment or alternative booking.",
            "actor_name": "Sarah Jenkins",
            "actor_role": "AGENT",
        },
    )
    assert esc_resp.status_code == 200
    esc_data = esc_resp.json()
    print(f"Escalation result: Status={esc_data['ticket']['status']} | Assigned={esc_data['escalated_to']}")
    assert esc_data["ticket"]["status"] == "ESCALATED"

    print("--- 5. Testing Multi-Dimensional Routing Engine ---")
    route_resp = client.post(f"/api/v1/routing/evaluate/{t1['id']}?apply=false")
    assert route_resp.status_code == 200
    route_data = route_resp.json()
    print(f"Routing evaluation: Evaluated Agent={route_data['evaluated_agent_name']} | Score={route_data['routing_score']}")
    print(f"Reason: {route_data['routing_reason']}")
    assert route_data["routing_score"] > 0

    print("--- 6. Testing Ops Insights Clustering Engine ---")
    insights_resp = client.get("/api/v1/insights/clusters")
    assert insights_resp.status_code == 200
    insights = insights_resp.json()
    print(f"Total active tickets: {insights['total_active_tickets']}")
    print(f"Total SLA at risk / breached: {insights['total_sla_at_risk_or_breached']}")
    print(f"Theme clusters count: {len(insights['theme_clusters'])}")
    for c in insights["theme_clusters"][:3]:
        print(f"  - Cluster [{c['tag']}]: {c['ticket_count']} tickets | Breached: {c['sla_breached_count']}")

    print("--- 7. Testing Export Stream (CSV & JSON) ---")
    csv_resp = client.get("/api/v1/export/tickets?format=csv")
    assert csv_resp.status_code == 200
    assert "TBOH Booking Hash" in csv_resp.text
    json_resp = client.get("/api/v1/export/tickets?format=json")
    assert json_resp.status_code == 200
    assert len(json_resp.json()) >= 10

    print("\n>>> ALL BACKEND & WORKFLOW TESTS PASSED PERFECTLY! <<<")


if __name__ == "__main__":
    test_e2e_backend()

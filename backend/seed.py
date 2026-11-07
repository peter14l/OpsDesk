"""
OpsDesk Database Seeder
Populates realistic B2B travel operations data:
- 4 Distinct B2B travel agencies across EMEA, APAC, AMER
- System users (Agents, Escalation Manager, Lead, Agency Requesters)
- 12+ Interlinked Tickets with shared TBOH booking hashes ("same refund / booking, multiple contacts" scenario)
- Critical SLA at-risk/breached tickets based on imminent check-in (<6 hours) and LCD
- Transferred ticket with active supplier side-conversation demonstrating explicit recipient retention
- Preset theme tags for Ops Insights clustering engine
"""

import sys
import os
from datetime import datetime, timedelta

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.agency import Agency
from app.models.user import User
from app.models.ticket import Ticket, TicketMessage
from app.models.side_convo import SideConversation, SideConversationMessage
from app.models.audit_log import AuditLog
from app.services.sla_service import calculate_travel_aware_sla


def seed_database():
    print("Initializing database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.utcnow()

    try:
        print("Seeding B2B Travel Agencies...")
        agencies = [
            Agency(
                code="AGY-DXB-902",
                name="Emirates Horizon Holidays",
                tier="PLATINUM",
                region="EMEA",
                country_code="AE",
                account_manager="Tariq Mansour",
            ),
            Agency(
                code="AGY-BOM-441",
                name="Bharat Gateway Travels",
                tier="GOLD",
                region="APAC",
                country_code="IN",
                account_manager="Sunita Rao",
            ),
            Agency(
                code="AGY-OSL-112",
                name="Nordic Explorer Desk",
                tier="SILVER",
                region="EMEA",
                country_code="NO",
                account_manager="Lars Lindqvist",
            ),
            Agency(
                code="AGY-LHR-305",
                name="Silverline Corporate Travel UK",
                tier="GOLD",
                region="EMEA",
                country_code="GB",
                account_manager="Oliver Sterling",
            ),
        ]
        for agy in agencies:
            db.add(agy)
        db.flush()

        agy_dxb = agencies[0]
        agy_bom = agencies[1]
        agy_osl = agencies[2]
        agy_lhr = agencies[3]

        print("Seeding Operational Users & Roles...")
        users = [
            User(
                email="sarah.jenkins@tbo.com",
                full_name="Sarah Jenkins",
                role="AGENT",
                region="EMEA",
                skills=["HOTEL", "REFUND", "CANCELLATION"],
                availability_status="AVAILABLE",
                active_ticket_count=0,
                max_concurrency=6,
            ),
            User(
                email="rajesh.sharma@tbo.com",
                full_name="Rajesh Sharma",
                role="AGENT",
                region="APAC",
                skills=["HOTEL", "AMENDMENT", "SPECIAL_REQUEST"],
                availability_status="AVAILABLE",
                active_ticket_count=0,
                max_concurrency=6,
            ),
            User(
                email="marcus.vance@tbo.com",
                full_name="Marcus Vance",
                role="AGENT",
                region="AMER",
                skills=["FLIGHT", "OVERBOOKING", "RATE_DISCREPANCY"],
                availability_status="BUSY",
                active_ticket_count=0,
                max_concurrency=5,
            ),
            User(
                email="priya.nair@tbo.com",
                full_name="Priya Nair",
                role="ESCALATION_MANAGER",
                region="GLOBAL",
                skills=["ESCALATION", "VIP", "LEGAL", "HOTEL"],
                availability_status="AVAILABLE",
                active_ticket_count=0,
                max_concurrency=8,
            ),
            User(
                email="alex.mercer@tbo.com",
                full_name="Alex Mercer",
                role="LEAD",
                region="GLOBAL",
                skills=["ALL", "TRIAGE", "AUDIT"],
                availability_status="AVAILABLE",
                active_ticket_count=0,
                max_concurrency=10,
            ),
            User(
                email="requester.dxb@emirateshorizon.com",
                full_name="Ahmed Al-Khatib",
                role="REQUESTER",
                region="EMEA",
                skills=[],
                availability_status="AVAILABLE",
            ),
            User(
                email="ops.delhi@bharatgateway.com",
                full_name="Rohan Varma",
                role="REQUESTER",
                region="APAC",
                skills=[],
                availability_status="AVAILABLE",
            ),
        ]
        for u in users:
            db.add(u)
        db.flush()

        agent_sarah = users[0]
        agent_rajesh = users[1]
        agent_marcus = users[2]
        manager_priya = users[3]
        lead_alex = users[4]

        print("Seeding Interlinked Travel Tickets & Complex Scenarios...")

        # =========================================================================
        # SCENARIO 1: Shared Booking TBOH-7849102-M (Hotel CRS Outage / Check-in Urgent)
        # Multiple contacts for the same reservation: Front desk emergency + Finance refund
        # =========================================================================
        checkin_t1 = now + timedelta(hours=3, minutes=15)  # Imminent (<4 hours!) -> SLA AT-RISK
        lcd_t1 = now - timedelta(hours=12)  # LCD already passed
        sla_dl_1, sla_st_1 = calculate_travel_aware_sla(now - timedelta(hours=1), checkin_t1, lcd_t1, "URGENT")

        ticket_1 = Ticket(
            ticket_number="TBO-2026-1001",
            tboh_hash="TBOH-7849102-M",
            agency_id=agy_dxb.id,
            requester_email="frontdesk@emirateshorizon.com",
            subject="CRITICAL: Guest stranded at Hilton Dubai Al Habtoor, reservation not in CRS",
            description="Guest Mr. David Foster arrived at Hilton Dubai Al Habtoor (Booking Ref: TBOH-7849102-M, 4 Nights). Front desk receptionist states reservation does not exist in Hilton CRS despite confirmed TBO voucher. Guest is waiting in the lobby with family.",
            category="OVERBOOKING",
            priority="URGENT",
            status="OPEN",
            check_in_date=checkin_t1,
            last_cancellation_date=lcd_t1,
            region="EMEA",
            assigned_agent_id=agent_sarah.id,
            routing_score=94.5,
            routing_reason="Assigned to Sarah Jenkins (Score: 94.5/100). Exact region match (EMEA), HOTEL skill match, Critical travel urgency (<4h to check-in).",
            sla_status=sla_st_1,
            sla_deadline=sla_dl_1,
            theme_tags=["supplier-crs-outage", "overbooking-walk-relocation"],
            created_at=now - timedelta(hours=1),
        )
        agent_sarah.active_ticket_count += 1
        db.add(ticket_1)
        db.flush()

        # Audit & Messages for Ticket 1
        db.add(AuditLog(
            ticket_id=ticket_1.id,
            actor_name="OpsDesk Engine",
            actor_role="SYSTEM",
            action_type="CREATED",
            new_state="OPEN",
            reason=ticket_1.routing_reason,
            created_at=now - timedelta(hours=1),
        ))
        db.add(TicketMessage(
            ticket_id=ticket_1.id,
            sender_email="frontdesk@emirateshorizon.com",
            sender_role="REQUESTER",
            message_type="PUBLIC",
            body="Guest Mr. David Foster arrived at Hilton Dubai Al Habtoor. Reception says voucher is invalid or dropped out of CRS. Please help immediately!",
            created_at=now - timedelta(hours=1),
        ))
        db.add(TicketMessage(
            ticket_id=ticket_1.id,
            sender_id=agent_sarah.id,
            sender_email="sarah.jenkins@tbo.com",
            sender_role="AGENT",
            message_type="INTERNAL_NOTE",
            body="Contacting Hilton Dubai duty manager via supplier side-convo. Hilton CRS had an XML sync error earlier today.",
            created_at=now - timedelta(minutes=45),
        ))

        # Ticket 1B: Same Booking TBOH-7849102-M submitted by Finance Desk
        ticket_1b = Ticket(
            ticket_number="TBO-2026-1002",
            tboh_hash="TBOH-7849102-M",
            agency_id=agy_dxb.id,
            requester_email="accounts@emirateshorizon.com",
            subject="Pre-authorization billing discrepancy on TBOH-7849102-M",
            description="Our client card was charged twice for Hilton Dubai Al Habtoor booking TBOH-7849102-M. Requesting credit note or clarification.",
            category="REFUND",
            priority="HIGH",
            status="OPEN",
            check_in_date=checkin_t1,
            last_cancellation_date=lcd_t1,
            region="EMEA",
            assigned_agent_id=agent_sarah.id,
            routing_score=91.0,
            routing_reason="Context linked to TBOH-7849102-M. Routed to active investigator Sarah Jenkins.",
            sla_status="ON_TRACK",
            sla_deadline=now + timedelta(hours=3),
            theme_tags=["supplier-crs-outage", "voucher-rate-mismatch"],
            created_at=now - timedelta(minutes=30),
        )
        agent_sarah.active_ticket_count += 1
        db.add(ticket_1b)
        db.flush()

        db.add(AuditLog(
            ticket_id=ticket_1b.id,
            actor_name="Context Linkage Service",
            actor_role="SYSTEM",
            action_type="CREATED",
            new_state="OPEN",
            reason="Automatically linked to existing active booking incident TBOH-7849102-M (TBO-2026-1001).",
            created_at=now - timedelta(minutes=30),
        ))

        # =========================================================================
        # SCENARIO 2: Transferred Ticket with Active Supplier Thread (TBOH-3301928-E)
        # Demonstrates explicit recipient retention surviving reassignment
        # =========================================================================
        checkin_t2 = now + timedelta(days=2)
        ticket_2 = Ticket(
            ticket_number="TBO-2026-1003",
            tboh_hash="TBOH-3301928-E",
            agency_id=agy_dxb.id,
            requester_email="tariq@emirateshorizon.com",
            subject="Atlantis The Palm - Royal Suite Renovation Relocation Dispute",
            description="VIP traveler arrived; Royal Suite is closed due to urgent ceiling plumbing maintenance. Hotel offered Imperial Club room downgrade without compensating the $1,400/night rate differential.",
            category="OVERBOOKING",
            priority="URGENT",
            status="PENDING_SUPPLIER",
            check_in_date=checkin_t2,
            last_cancellation_date=now - timedelta(days=1),
            region="EMEA",
            assigned_agent_id=agent_rajesh.id,  # Transferred to Rajesh!
            routing_score=87.0,
            routing_reason="Originally routed to Sarah Jenkins; transferred to Rajesh Sharma during EMEA shift rotation.",
            sla_status="ON_TRACK",
            sla_deadline=now + timedelta(hours=2),
            theme_tags=["overbooking-walk-relocation", "voucher-rate-mismatch"],
            created_at=now - timedelta(hours=4),
        )
        agent_rajesh.active_ticket_count += 1
        db.add(ticket_2)
        db.flush()

        # Side conversation on Ticket 2 with explicit recipient list
        recipients_2 = [
            "duty.manager@atlantisdubai.com",
            "reservations@atlantisdubai.com",
            "tbo-contracts-dubai@tbo.com",
            "vip-desk@tbo.com",
        ]
        side_convo_2 = SideConversation(
            ticket_id=ticket_2.id,
            subject="URGENT: Rate differential & compensation waiver - TBOH-3301928-E Atlantis",
            supplier_name="Atlantis The Palm Reservations & Duty Desk",
            supplier_email="duty.manager@atlantisdubai.com",
            recipient_emails=recipients_2,
            status="WAITING_ON_SUPPLIER",
            created_by_agent_id=agent_sarah.id,  # Created by Sarah before transfer!
            created_at=now - timedelta(hours=3, minutes=30),
            updated_at=now - timedelta(hours=1),
        )
        db.add(side_convo_2)
        db.flush()

        db.add(SideConversationMessage(
            side_conversation_id=side_convo_2.id,
            sender_email="sarah.jenkins@tbo.com",
            is_supplier_incoming=False,
            body="Dear Atlantis Duty Team, regarding booking TBOH-3301928-E: Guest was downgraded due to unexpected suite maintenance. Please issue official credit note for the differential of $1,400/night or confirm club lounge complimentary dining waiver.",
            created_at=now - timedelta(hours=3, minutes=25),
        ))
        db.add(SideConversationMessage(
            side_conversation_id=side_convo_2.id,
            sender_email="duty.manager@atlantisdubai.com",
            is_supplier_incoming=True,
            body="Hello TBO team, we acknowledge the issue. We have upgraded the guest to complimentary full-board and offered 2 free spa vouchers. Our GM is reviewing the rate adjustment ledger.",
            created_at=now - timedelta(hours=1, minutes=10),
        ))

        # Transfer Audit Log showing Sarah transferred to Rajesh while retaining thread
        db.add(AuditLog(
            ticket_id=ticket_2.id,
            actor_id=agent_sarah.id,
            actor_name="Sarah Jenkins",
            actor_role="AGENT",
            action_type="TRANSFERRED",
            previous_state="Assigned to Sarah Jenkins",
            new_state="Assigned to Rajesh Sharma",
            reason="Shift handover: Transferring to Rajesh Sharma. Supplier side-convo with Atlantis duty desk active and recipient list intact.",
            created_at=now - timedelta(hours=1),
        ))

        # =========================================================================
        # SCENARIO 3: SLA Breached Ticket (Check-in Passed / LCD Breached)
        # =========================================================================
        checkin_t3 = now - timedelta(hours=1)  # Traveler already at hotel!
        ticket_3 = Ticket(
            ticket_number="TBO-2026-1004",
            tboh_hash="TBOH-1102934-P",
            agency_id=agy_bom.id,
            requester_email="pilgrim.desk@bharatgateway.com",
            subject="SLA BREACHED: JW Marriott Mumbai Sahar - Voucher breakfast rejected at counter",
            description="Group of 14 corporate delegates from Bharat Gateway at JW Marriott Mumbai. Reception refusing buffet breakfast claiming rate code is EP (European Plan / Room Only), whereas TBO voucher explicitly states CP (Continental Plan).",
            category="SPECIAL_REQUEST",
            priority="URGENT",
            status="ESCALATED",
            check_in_date=checkin_t3,
            last_cancellation_date=now - timedelta(days=2),
            region="APAC",
            assigned_agent_id=manager_priya.id,
            routing_score=96.0,
            routing_reason="Escalated directly to Escalation Manager Priya Nair due to SLA breach and multi-passenger corporate dispute.",
            sla_status="BREACHED",
            sla_deadline=now - timedelta(minutes=45),  # 45 minutes overdue!
            theme_tags=["breakfast-inclusion-dispute", "voucher-rate-mismatch"],
            created_at=now - timedelta(hours=2),
        )
        manager_priya.active_ticket_count += 1
        db.add(ticket_3)
        db.flush()

        db.add(AuditLog(
            ticket_id=ticket_3.id,
            actor_id=agent_rajesh.id,
            actor_name="Rajesh Sharma",
            actor_role="AGENT",
            action_type="ESCALATED",
            previous_state="OPEN (Assigned: Rajesh Sharma)",
            new_state="ESCALATED (Assigned: Priya Nair)",
            reason="Group breakfast voucher disputed at check-in counter. Escalated to Manager Priya for emergency direct hotel payout authorization.",
            created_at=now - timedelta(minutes=50),
        ))

        # =========================================================================
        # SCENARIO 4: Interlinked Booking TBOH-9923810-K (Nordic Ski Group)
        # Multiple tickets sharing same TBOH
        # =========================================================================
        checkin_t4 = now + timedelta(days=5)
        ticket_4a = Ticket(
            ticket_number="TBO-2026-1005",
            tboh_hash="TBOH-9923810-K",
            agency_id=agy_osl.id,
            requester_email="booking@nordicexplorer.no",
            subject="Radisson Blu Tromso - Request early check-in for Aurora Borealis tour group",
            description="20 travelers arriving on early morning SAS flight SK4414 at 08:30 AM. Requesting hotel front desk block 10 twin rooms for early check-in.",
            category="SPECIAL_REQUEST",
            priority="MEDIUM",
            status="OPEN",
            check_in_date=checkin_t4,
            last_cancellation_date=now + timedelta(days=2),
            region="EMEA",
            assigned_agent_id=agent_sarah.id,
            routing_score=82.0,
            routing_reason="Assigned to Sarah Jenkins. Regional match EMEA, Special Request skill.",
            sla_status="ON_TRACK",
            sla_deadline=now + timedelta(hours=6),
            theme_tags=["non-refundable-waiver-request"],
            created_at=now - timedelta(hours=3),
        )
        agent_sarah.active_ticket_count += 1
        db.add(ticket_4a)
        db.flush()

        ticket_4b = Ticket(
            ticket_number="TBO-2026-1006",
            tboh_hash="TBOH-9923810-K",
            agency_id=agy_osl.id,
            requester_email="guide@nordicexplorer.no",
            subject="TBOH-9923810-K: Dietary preferences (Gluten-Free & Halal) for breakfast buffet",
            description="Providing dietary requirements for 6 guests in the same group booking TBOH-9923810-K at Radisson Blu Tromso.",
            category="SPECIAL_REQUEST",
            priority="LOW",
            status="OPEN",
            check_in_date=checkin_t4,
            last_cancellation_date=now + timedelta(days=2),
            region="EMEA",
            assigned_agent_id=agent_sarah.id,
            routing_score=78.0,
            routing_reason="Linked by TBOH-9923810-K to existing ticket TBO-2026-1005.",
            sla_status="ON_TRACK",
            sla_deadline=now + timedelta(hours=8),
            theme_tags=["breakfast-inclusion-dispute"],
            created_at=now - timedelta(hours=2),
        )
        agent_sarah.active_ticket_count += 1
        db.add(ticket_4b)
        db.flush()

        # =========================================================================
        # ADDITIONAL SCENARIOS: Populate 12+ tickets with diverse regions & themes
        # =========================================================================
        tickets_pool = [
            {
                "num": "TBO-2026-1007",
                "hash": "TBOH-4491023-F",
                "agency": agy_lhr,
                "email": "ops@silverlinecorp.co.uk",
                "subject": "The Langham London - Name amendment for C-suite executive",
                "desc": "Primary passenger surname misspelled on voucher ('Smith' vs 'Smythe-Davies'). Airline and hotel mismatch preventing VIP airport transfer check-in.",
                "category": "AMENDMENT",
                "priority": "HIGH",
                "status": "OPEN",
                "checkin": now + timedelta(hours=18),
                "lcd": now + timedelta(hours=6),
                "region": "EMEA",
                "agent": agent_sarah,
                "score": 89.0,
                "reason": "High urgency (<18h checkin), EMEA region match, amendment specialist.",
                "sla_st": "ON_TRACK",
                "sla_dl": now + timedelta(hours=2),
                "tags": ["amendment-refusal"],
            },
            {
                "num": "TBO-2026-1008",
                "hash": "TBOH-5582910-B",
                "agency": agy_bom,
                "email": "weddings@bharatgateway.com",
                "subject": "Taj Lake Palace Udaipur - Medical cancellation refund waiver request",
                "desc": "Bride's father hospitalized with acute cardiac illness. Attaching medical hospital discharge certificate. Seeking non-refundable penalty waiver from Taj sales desk.",
                "category": "CANCELLATION",
                "priority": "HIGH",
                "status": "PENDING_SUPPLIER",
                "checkin": now + timedelta(days=3),
                "lcd": now - timedelta(hours=10),
                "region": "APAC",
                "agent": agent_rajesh,
                "score": 93.0,
                "reason": "APAC specialist Rajesh Sharma. Cancellation waiver workflow initiated.",
                "sla_st": "ON_TRACK",
                "sla_dl": now + timedelta(hours=3),
                "tags": ["non-refundable-waiver-request"],
            },
            {
                "num": "TBO-2026-1009",
                "hash": "TBOH-6619283-Z",
                "agency": agy_dxb,
                "email": "vip@emirateshorizon.com",
                "subject": "Burj Al Arab - Overbooking notification received from Dnata supplier",
                "desc": "DMC notified us that Burj Al Arab cannot honor Deluxe One Bedroom Marina Suite due to private royal delegation takeover. Need alternative 5-star suite on Palm Jumeirah.",
                "category": "OVERBOOKING",
                "priority": "URGENT",
                "status": "ESCALATED",
                "checkin": now + timedelta(hours=5),
                "lcd": now - timedelta(hours=2),
                "region": "EMEA",
                "agent": manager_priya,
                "score": 98.0,
                "reason": "Platinum tier VIP dispute. Immediate escalation to Priya Nair.",
                "sla_st": "AT_RISK",
                "sla_dl": now + timedelta(minutes=35),
                "tags": ["overbooking-walk-relocation", "supplier-crs-outage"],
            },
            {
                "num": "TBO-2026-1010",
                "hash": "TBOH-8829102-X",
                "agency": agy_lhr,
                "email": "finance@silverlinecorp.co.uk",
                "subject": "Mandarin Oriental New York - City Tax double debit inquiry",
                "desc": "Client was charged $82 Manhattan occupancy tax at checkout after TBO voucher confirmed all taxes included.",
                "category": "REFUND",
                "priority": "MEDIUM",
                "status": "OPEN",
                "checkin": now + timedelta(days=10),
                "lcd": now + timedelta(days=7),
                "region": "AMER",
                "agent": agent_marcus,
                "score": 85.0,
                "reason": "AMER region match, Marcus Vance assigned.",
                "sla_st": "ON_TRACK",
                "sla_dl": now + timedelta(hours=4),
                "tags": ["voucher-rate-mismatch"],
            },
            {
                "num": "TBO-2026-1011",
                "hash": "TBOH-9938102-L",
                "agency": agy_bom,
                "email": "support@bharatgateway.com",
                "subject": "Oberoi Amarvilas Agra - Taj view room category guaranteed on voucher",
                "desc": "Hotel assigned Premier garden view room instead of Premier Taj Mahal view room. Agency demanding instant compensation or room upgrade.",
                "category": "VOUCHER_ISSUE",
                "priority": "HIGH",
                "status": "OPEN",
                "checkin": now + timedelta(hours=14),
                "lcd": now + timedelta(hours=4),
                "region": "APAC",
                "agent": agent_rajesh,
                "score": 90.0,
                "reason": "APAC region match, category specialist.",
                "sla_st": "ON_TRACK",
                "sla_dl": now + timedelta(hours=2),
                "tags": ["voucher-rate-mismatch"],
            },
            {
                "num": "TBO-2026-1012",
                "hash": "TBOH-1029384-M",
                "agency": agy_dxb,
                "email": "concierge@emirateshorizon.com",
                "subject": "W Dubai The Palm - Early departure refund authorization",
                "desc": "Guest had to cut stay short by 2 nights due to urgent family bereavement. Hotel duty manager agreed verbally, need written confirmation for refund.",
                "category": "REFUND",
                "priority": "MEDIUM",
                "status": "RESOLVED",
                "checkin": now - timedelta(days=4),
                "lcd": now - timedelta(days=6),
                "region": "EMEA",
                "agent": agent_sarah,
                "score": 88.0,
                "reason": "Resolved by Sarah Jenkins after supplier confirmation.",
                "sla_st": "ON_TRACK",
                "sla_dl": now - timedelta(days=3),
                "tags": ["non-refundable-waiver-request"],
            },
        ]

        for item in tickets_pool:
            t = Ticket(
                ticket_number=item["num"],
                tboh_hash=item["hash"],
                agency_id=item["agency"].id,
                requester_email=item["email"],
                subject=item["subject"],
                description=item["desc"],
                category=item["category"],
                priority=item["priority"],
                status=item["status"],
                check_in_date=item["checkin"],
                last_cancellation_date=item["lcd"],
                region=item["region"],
                assigned_agent_id=item["agent"].id,
                routing_score=item["score"],
                routing_reason=item["reason"],
                sla_status=item["sla_st"],
                sla_deadline=item["sla_dl"],
                theme_tags=item["tags"],
                created_at=now - timedelta(hours=3),
            )
            item["agent"].active_ticket_count += 1
            db.add(t)
            db.flush()

            db.add(AuditLog(
                ticket_id=t.id,
                actor_name="OpsDesk Engine",
                actor_role="SYSTEM",
                action_type="CREATED",
                new_state=t.status,
                reason=item["reason"],
                created_at=t.created_at,
            ))
            db.add(TicketMessage(
                ticket_id=t.id,
                sender_email=item["email"],
                sender_role="REQUESTER",
                message_type="PUBLIC",
                body=item["desc"],
                created_at=t.created_at,
            ))

        db.commit()
        print("Database seeding completed successfully!")
        print(f"Generated {len(agencies)} Agencies.")
        print(f"Generated {len(users)} Operational Users & Requesters.")
        print(f"Generated {db.query(Ticket).count()} Interlinked Tickets.")
        print(f"Generated {db.query(SideConversation).count()} Supplier Side-Conversations.")
        print(f"Generated {db.query(AuditLog).count()} Audit Timeline Entries.")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

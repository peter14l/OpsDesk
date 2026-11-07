from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ticket import Ticket
from app.models.agency import Agency


def evaluate_ticket_routing(
    db: Session,
    ticket: Ticket,
    agency: Optional[Agency] = None,
) -> Tuple[Optional[User], float, str]:
    """
    Multi-dimensional routing engine that scores and assigns incoming tickets.
    Evaluates:
      1. Region/Country ID alignment
      2. Travel urgency / Check-in proximity (<24h / <6h)
      3. Category & skill match
      4. Agent availability & concurrency load factor
      5. Agency tier weighting
    Returns: (Selected Agent, Calculated Score, Routing Reason Audit String)
    """
    if not agency and ticket.agency_id:
        agency = db.query(Agency).filter(Agency.id == ticket.agency_id).first()

    # Query active candidate agents
    agents = db.query(User).filter(
        User.role.in_(["AGENT", "ESCALATION_MANAGER", "LEAD"]),
        User.availability_status.in_(["AVAILABLE", "BUSY"]),
    ).all()

    if not agents:
        return None, 0.0, "No active agents available in the pool. Routed to Operations Queue."

    now = datetime.utcnow()
    hours_to_checkin = (ticket.check_in_date - now).total_seconds() / 3600.0 if ticket.check_in_date else 999.0

    # Calculate Urgency Score (0 - 1.0)
    if hours_to_checkin <= 6:
        urgency_score = 1.0
        urgency_desc = f"Critical urgency (<6h to check-in: {hours_to_checkin:.1f}h)"
    elif hours_to_checkin <= 24:
        urgency_score = 0.85
        urgency_desc = f"High travel urgency (<24h to check-in: {hours_to_checkin:.1f}h)"
    elif hours_to_checkin <= 72:
        urgency_score = 0.6
        urgency_desc = f"Moderate urgency (<72h to check-in: {hours_to_checkin:.1f}h)"
    else:
        urgency_score = 0.3
        urgency_desc = f"Standard lead time ({hours_to_checkin:.1f}h to check-in)"

    # Agency Tier Weight
    agency_tier = agency.tier.upper() if agency else "STANDARD"
    tier_boost = 1.15 if agency_tier == "PLATINUM" else (1.05 if agency_tier == "GOLD" else 1.0)

    best_agent = None
    best_score = -1.0
    best_reason = ""

    for agent in agents:
        # Offline filter
        if agent.availability_status == "OFFLINE":
            continue

        # Region score (Weight: 30%)
        # Check ticket region vs agent region
        ticket_reg = (ticket.region or (agency.region if agency else "GLOBAL")).upper()
        agent_reg = agent.region.upper()

        if agent_reg == ticket_reg:
            region_score = 1.0
            region_match_desc = f"Exact region match ({agent_reg})"
        elif agent_reg == "GLOBAL":
            region_score = 0.7
            region_match_desc = "Global jurisdiction"
        else:
            region_score = 0.2
            region_match_desc = f"Cross-region ({agent_reg} vs {ticket_reg})"

        # Skill / Category score (Weight: 25%)
        agent_skills = [s.upper() for s in agent.skills]
        category_upper = ticket.category.upper()
        if category_upper in agent_skills or "ALL" in agent_skills or "HOTEL" in agent_skills:
            skill_score = 1.0
            skill_match_desc = f"Skill matched ({category_upper})"
        elif any(k in category_upper for k in ["REFUND", "CANCEL", "AMEND"]) and any(k in s for s in agent_skills for k in ["REFUND", "AMEND"]):
            skill_score = 0.85
            skill_match_desc = "Related skill match"
        else:
            skill_score = 0.4
            skill_match_desc = "Generalist profile"

        # Concurrency & Availability score (Weight: 20%)
        avail_mult = 1.0 if agent.availability_status == "AVAILABLE" else 0.5
        max_load = max(agent.max_concurrency, 1)
        load_ratio = agent.active_ticket_count / float(max_load)
        load_score = max(0.0, 1.0 - load_ratio) * avail_mult

        # Escalation Manager routing check: if urgency <= 6h and Platinum agency, Escalation Managers get high preference
        role_pref = 1.0
        if hours_to_checkin <= 6 and agency_tier == "PLATINUM":
            if agent.role == "ESCALATION_MANAGER":
                role_pref = 1.3
        elif agent.role == "ESCALATION_MANAGER":
            # Keep escalation managers reserved unless needed
            role_pref = 0.7

        # Composite score (out of 100)
        # Weights: Region 30%, Urgency 25%, Skill 25%, Load 20%
        raw_score = (
            (region_score * 0.30)
            + (urgency_score * 0.25)
            + (skill_score * 0.25)
            + (load_score * 0.20)
        ) * 100.0 * tier_boost * role_pref

        if raw_score > best_score:
            best_score = raw_score
            best_agent = agent
            best_reason = (
                f"Assigned to {agent.full_name} (Score: {raw_score:.1f}/100). "
                f"Criteria: {region_match_desc}, {skill_match_desc}, "
                f"Load: {agent.active_ticket_count}/{agent.max_concurrency} active, {urgency_desc}."
            )

    if not best_agent and agents:
        best_agent = agents[0]
        best_score = 50.0
        best_reason = f"Default round-robin assignment to {best_agent.full_name}."

    return best_agent, round(best_score, 1), best_reason

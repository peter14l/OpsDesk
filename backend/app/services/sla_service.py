from datetime import datetime, timedelta
from typing import Tuple, Optional


def calculate_travel_aware_sla(
    created_at: datetime,
    check_in_date: datetime,
    last_cancellation_date: Optional[datetime],
    priority: str,
) -> Tuple[datetime, str]:
    """
    Computes dynamic travel-aware SLA deadline and current SLA status.
    Prioritizes check-in proximity and LCD over standard static hourly SLAs.
    """
    now = datetime.utcnow()

    # 1. Base SLA by priority
    priority_hours = {
        "URGENT": 1,
        "HIGH": 2,
        "MEDIUM": 4,
        "LOW": 8,
    }
    base_hours = priority_hours.get(priority.upper(), 4)
    base_deadline = created_at + timedelta(hours=base_hours)

    candidate_deadlines = [base_deadline]

    # 2. Check-in Date proximity
    # If check-in is imminent, SLA must be before check-in so traveler isn't stranded
    time_to_checkin = check_in_date - now
    if time_to_checkin.total_seconds() > 0:
        if time_to_checkin < timedelta(hours=6):
            # Check-in in less than 6 hours -> deadline is 15 minutes before checkin or now + 30m
            checkin_deadline = check_in_date - timedelta(minutes=15)
            candidate_deadlines.append(checkin_deadline)
        elif time_to_checkin < timedelta(hours=24):
            # Check-in in less than 24 hours -> deadline is 45 minutes before checkin or now + 1h
            checkin_deadline = check_in_date - timedelta(minutes=45)
            candidate_deadlines.append(checkin_deadline)
        else:
            checkin_deadline = check_in_date - timedelta(hours=2)
            candidate_deadlines.append(checkin_deadline)
    else:
        # Check-in already passed or is right now! Critical urgency
        candidate_deadlines.append(created_at + timedelta(minutes=30))

    # 3. Last Cancellation Date (LCD) proximity
    if last_cancellation_date:
        time_to_lcd = last_cancellation_date - now
        if time_to_lcd.total_seconds() > 0:
            # Must resolve before LCD penalty kicks in
            lcd_deadline = last_cancellation_date - timedelta(minutes=30)
            candidate_deadlines.append(lcd_deadline)
        else:
            # LCD already breached
            candidate_deadlines.append(last_cancellation_date)

    # Effective deadline is the earliest of candidates
    effective_deadline = min(candidate_deadlines)

    # Determine status
    remaining_seconds = (effective_deadline - now).total_seconds()
    if remaining_seconds <= 0:
        status = "BREACHED"
    elif remaining_seconds <= 3600:  # <= 1 hour
        status = "AT_RISK"
    else:
        status = "ON_TRACK"

    return effective_deadline, status

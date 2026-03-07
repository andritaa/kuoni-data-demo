#!/usr/bin/env python3
"""
Kuoni Data Intelligence Platform — Dummy Data Generator
Generates realistic UK premium travel data for demo/development

Usage:
    python generate_data.py [--customers N] [--bookings N] [--interactions N]
    python generate_data.py --all     # Generate all datasets with defaults
    
Output: CSV files in ./output/ directory
"""

import os
import csv
import random
import argparse
import hashlib
from datetime import datetime, date, timedelta
from pathlib import Path

try:
    from faker import Faker
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Note: pandas not installed, using built-in csv module")

# Seed for reproducibility
random.seed(42)
fake = Faker('en_GB')
fake.seed_instance(42)

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Reference data
LUXURY_DESTINATIONS = [
    # (name, country, region, continent, tier, avg_days, peak_start, peak_end, flight_hrs)
    ("Maldives",           "Maldives",      "Indian Ocean",   "Asia",        "Ultra-Luxury", 10, "November",  "April",     10),
    ("Seychelles",         "Seychelles",    "Indian Ocean",   "Africa",      "Ultra-Luxury", 12, "April",     "May",       10),
    ("Bora Bora",          "French Polynesia", "South Pacific","Oceania",    "Ultra-Luxury", 14, "May",       "October",   22),
    ("Amalfi Coast",       "Italy",         "Southern Europe","Europe",      "Luxury",       10, "May",       "September", 3),
    ("Santorini",          "Greece",        "Southern Europe","Europe",      "Luxury",       8,  "May",       "October",   4),
    ("Tuscany",            "Italy",         "Southern Europe","Europe",      "Luxury",       10, "April",     "October",   3),
    ("Cinque Terre",       "Italy",         "Southern Europe","Europe",      "Premium",      7,  "June",      "September", 3),
    ("Safari Kenya",       "Kenya",         "East Africa",    "Africa",      "Luxury",       12, "July",      "October",   9),
    ("Safari Tanzania",    "Tanzania",      "East Africa",    "Africa",      "Luxury",       14, "June",      "October",   10),
    ("Botswana Safari",    "Botswana",      "Southern Africa","Africa",      "Ultra-Luxury", 10, "May",       "October",   11),
    ("Japan",              "Japan",         "East Asia",      "Asia",        "Luxury",       14, "March",     "May",       12),
    ("Japan Winter",       "Japan",         "East Asia",      "Asia",        "Luxury",       12, "December",  "February",  12),
    ("Rajasthan",          "India",         "South Asia",     "Asia",        "Luxury",       14, "October",   "March",     9),
    ("Kerala",             "India",         "South Asia",     "Asia",        "Premium",      12, "September", "March",     9),
    ("Sri Lanka",          "Sri Lanka",     "South Asia",     "Asia",        "Premium",      14, "November",  "April",     11),
    ("Bali",               "Indonesia",     "Southeast Asia", "Asia",        "Luxury",       14, "April",     "October",   15),
    ("Phuket",             "Thailand",      "Southeast Asia", "Asia",        "Premium",      12, "November",  "April",     12),
    ("Vietnam",            "Vietnam",       "Southeast Asia", "Asia",        "Premium",      16, "November",  "April",     12),
    ("Cambodia",           "Cambodia",      "Southeast Asia", "Asia",        "Premium",      10, "November",  "April",     13),
    ("Peru",               "Peru",          "South America",  "Americas",    "Luxury",       16, "May",       "October",   14),
    ("Patagonia",          "Argentina",     "South America",  "Americas",    "Luxury",       18, "November",  "March",     14),
    ("Galápagos",          "Ecuador",       "South America",  "Americas",    "Ultra-Luxury", 12, "June",      "November",  14),
    ("Machu Picchu",       "Peru",          "South America",  "Americas",    "Luxury",       14, "May",       "October",   14),
    ("New Zealand",        "New Zealand",   "Oceania",        "Oceania",     "Luxury",       21, "November",  "March",     24),
    ("Australia",          "Australia",     "Oceania",        "Oceania",     "Premium",      21, "October",   "April",     22),
    ("Canada Rockies",     "Canada",        "North America",  "Americas",    "Luxury",       14, "June",      "September", 9),
    ("Alaska Cruise",      "USA",           "North America",  "Americas",    "Luxury",       14, "May",       "September", 10),
    ("Iceland",            "Iceland",       "Northern Europe","Europe",      "Premium",      7,  "June",      "August",    3),
    ("Norway Fjords",      "Norway",        "Northern Europe","Europe",      "Luxury",       10, "May",       "September", 3),
    ("Svalbard",           "Norway",        "Northern Europe","Europe",      "Ultra-Luxury", 8,  "February",  "March",     4),
    ("Morocco",            "Morocco",       "North Africa",   "Africa",      "Premium",      10, "March",     "May",       4),
    ("Egypt",              "Egypt",         "North Africa",   "Africa",      "Premium",      10, "October",   "April",     5),
    ("Jordan",             "Jordan",        "Middle East",    "Asia",        "Premium",      8,  "March",     "May",       5),
    ("Oman",               "Oman",          "Middle East",    "Asia",        "Luxury",       10, "October",   "April",     7),
    ("Dubai",              "UAE",           "Middle East",    "Asia",        "Luxury",       7,  "October",   "April",     7),
    ("Cuba",               "Cuba",          "Caribbean",      "Americas",    "Premium",      12, "November",  "April",     10),
    ("Barbados",           "Barbados",      "Caribbean",      "Americas",    "Luxury",       12, "December",  "April",     9),
    ("St Lucia",           "St Lucia",      "Caribbean",      "Americas",    "Luxury",       12, "December",  "April",     9),
    ("Mauritius",          "Mauritius",     "Indian Ocean",   "Africa",      "Luxury",       12, "May",       "December",  12),
    ("Zanzibar",           "Tanzania",      "East Africa",    "Africa",      "Premium",      10, "June",      "October",   10),
    ("Costa Rica",         "Costa Rica",    "Central America","Americas",    "Premium",      14, "December",  "April",     12),
    ("Bhutan",             "Bhutan",        "South Asia",     "Asia",        "Ultra-Luxury", 10, "March",     "May",       9),
    ("Myanmar",            "Myanmar",       "Southeast Asia", "Asia",        "Luxury",       14, "October",   "March",     12),
    ("Trans-Siberian",     "Russia",        "Eastern Europe", "Europe",      "Luxury",       16, "June",      "September", 10),
    ("Antarctica",         "Antarctica",    "Antarctica",     "Antarctica",  "Ultra-Luxury", 14, "November",  "March",     24),
    ("French Riviera",     "France",        "Southern Europe","Europe",      "Luxury",       8,  "May",       "September", 2),
    ("Azores",             "Portugal",      "Atlantic Islands","Europe",     "Premium",      8,  "April",     "October",   3),
    ("Madeira",            "Portugal",      "Atlantic Islands","Europe",     "Premium",      7,  "March",     "November",  3),
    ("Malta",              "Malta",         "Southern Europe","Europe",      "Premium",      7,  "May",       "October",   3),
    ("Cyprus",             "Cyprus",        "Southern Europe","Europe",      "Premium",      10, "April",     "October",   5),
]

PRODUCT_TYPES = ["Tailor-Made", "Group", "Honeymoon", "Adventure", "Cultural"]

AGENT_NAMES = [
    "Sophie Williams", "James Hartley", "Emma Thompson", "Oliver Davies",
    "Charlotte Baker", "Harry Wilson", "Isabella Moore", "George Taylor",
    "Amelia Johnson", "William Anderson", "Lucy Brown", "Jack Robinson",
    "Poppy Martin", "Thomas Lee", "Grace Walker", "Benjamin Hall",
    "Lily Allen", "Charlie Wright", "Mia Scott", "Daniel Lewis",
]

BRANCHES = [
    ("LON001", "London Mayfair"),
    ("LON002", "London Kensington"),
    ("LON003", "London City"),
    ("LON004", "London Canary Wharf"),
    ("MCH001", "Manchester Spinningfields"),
    ("EDB001", "Edinburgh Royal Mile"),
    ("BRS001", "Bristol Clifton"),
    ("OXF001", "Oxford Street"),
    ("CAM001", "Cambridge"),
    ("LEE001", "Leeds Victoria Quarter"),
]

UK_CITIES = [
    ("London",       ["SW1A", "W1A",  "EC1A", "SE1",  "NW1",  "E1",   "N1",   "SW7"]),
    ("Surrey",       ["KT2",  "GU1",  "RH1",  "SM2",  "TW1"]),
    ("Hertfordshire",["AL1",  "SG1",  "HP1",  "EN1",  "WD1"]),
    ("Kent",         ["TN1",  "ME1",  "CT1",  "DA1",  "BR1"]),
    ("Manchester",   ["M1",   "M2",   "M3",   "SK1",  "WA1"]),
    ("Edinburgh",    ["EH1",  "EH2",  "EH3",  "EH4",  "EH10"]),
    ("Bristol",      ["BS1",  "BS6",  "BS8",  "BS9",  "BS20"]),
    ("Oxford",       ["OX1",  "OX2",  "OX3",  "OX4"]),
    ("Cambridge",    ["CB1",  "CB2",  "CB3",  "CB4"]),
    ("Bath",         ["BA1",  "BA2"]),
    ("York",         ["YO1",  "YO10", "YO31"]),
    ("Winchester",   ["SO22", "SO23"]),
    ("Guildford",    ["GU1",  "GU2",  "GU3"]),
    ("Cheltenham",   ["GL50", "GL51", "GL52"]),
    ("Harrogate",    ["HG1",  "HG2",  "HG3"]),
]

CHANNELS = ["Online", "Phone", "Agent", "Referral"]
CHANNEL_WEIGHTS = [0.35, 0.30, 0.25, 0.10]

SEGMENTS = ["Luxury", "Premium", "Explorer"]
SEGMENT_WEIGHTS = [0.25, 0.45, 0.30]

INTERACTION_TYPES = ["Enquiry", "Quote", "Booking", "Post-trip", "Complaint"]
INTERACTION_CHANNELS = ["Web", "Phone", "Email", "In-Store", "WhatsApp"]
OUTCOMES = ["Converted", "Follow-up", "No-action", "Resolved"]

ACCOMMODATION_TIERS = ["5-star Deluxe", "5-star", "4-star Boutique", "Villa", "Safari Lodge"]


# ─────────────────────────────────────────────
# GENERATORS
# ─────────────────────────────────────────────

def generate_destinations():
    """Generate 50 luxury destination records"""
    rows = []
    for i, dest in enumerate(LUXURY_DESTINATIONS):
        name, country, region, continent, tier, avg_days, peak_start, peak_end, flight_hrs = dest
        dest_id = f"DEST{str(i+1).zfill(3)}"
        rows.append({
            "destination_id":      dest_id,
            "destination_name":    name,
            "country":             country,
            "region":              region,
            "continent":           continent,
            "tier":                tier,
            "avg_duration_days":   avg_days,
            "peak_season_start":   peak_start,
            "peak_season_end":     peak_end,
            "flight_hrs_from_lhr": flight_hrs,
            "visa_required":       "Y" if country not in ["Maldives","Seychelles","Italy","Greece","France","Norway","Iceland","Portugal","Malta","Cyprus"] else "N",
            "currency":            "USD" if country in ["USA","Ecuador","El Salvador","Cambodia"] else "EUR" if country in ["Italy","Greece","France","Germany","Spain","Portugal","Malta","Cyprus"] else "GBP" if country in ["UK"] else "LOCAL",
            "climate_type":        "Tropical" if tier == "Ultra-Luxury" else "Mediterranean" if region == "Southern Europe" else "Varied",
            "is_active":           "Y",
        })
    return rows


def generate_products(destinations):
    """Generate 200 holiday package records"""
    rows = []
    dest_ids = [d["destination_id"] for d in destinations]
    
    product_names_by_type = {
        "Tailor-Made":  ["Bespoke Explorer", "Private Journey", "Tailor-Made Discovery", "Exclusive Escape", "Personal Journey"],
        "Group":        ["Small Group Adventure", "Guided Discovery", "Escorted Journey", "Group Explorer", "Classic Tour"],
        "Honeymoon":    ["Honeymoon Paradise", "Romantic Escape", "Love & Luxury", "Honeymoon Dream", "Romantic Discovery"],
        "Adventure":    ["Wildlife Safari", "Trekking Adventure", "Active Explorer", "Wilderness Journey", "Expedition"],
        "Cultural":     ["Cultural Immersion", "Heritage Journey", "Art & Culture", "Historical Discovery", "Culinary Tour"],
    }
    
    for i in range(200):
        product_id = f"PKG{str(i+1).zfill(4)}"
        dest = random.choice(destinations)
        p_type = random.choices(PRODUCT_TYPES, weights=[0.40, 0.20, 0.15, 0.15, 0.10])[0]
        prefix = random.choice(product_names_by_type[p_type])
        product_name = f"{dest['destination_name']} {prefix}"
        
        # Price influenced by destination tier
        if dest["tier"] == "Ultra-Luxury":
            base_price = random.randint(12000, 25000)
            duration = random.choice([10, 12, 14, 16])
        elif dest["tier"] == "Luxury":
            base_price = random.randint(6000, 15000)
            duration = random.choice([7, 10, 12, 14])
        else:
            base_price = random.randint(2500, 8000)
            duration = random.choice([7, 8, 10, 12])
        
        # Honeymooners pay more
        if p_type == "Honeymoon":
            base_price = int(base_price * 1.3)
        
        if base_price < 5000:
            price_band = "Budget"
        elif base_price < 10000:
            price_band = "Mid"
        elif base_price < 20000:
            price_band = "Premium"
        else:
            price_band = "Ultra"
        
        launch_date = fake.date_between(start_date=date(2020, 1, 1), end_date=date(2022, 6, 30))
        
        rows.append({
            "product_id":         product_id,
            "product_name":       product_name,
            "destination_id":     dest["destination_id"],
            "product_type":       p_type,
            "duration_days":      duration,
            "base_price_gbp":     base_price,
            "price_band":         price_band,
            "included_flights":   random.choice(["Y", "Y", "Y", "N"]),
            "all_inclusive":      "Y" if dest["tier"] == "Ultra-Luxury" else random.choice(["Y", "N", "N"]),
            "max_group_size":     12 if p_type == "Group" else 2 if p_type == "Honeymoon" else 6,
            "min_passengers":     2,
            "accommodation_tier": random.choice(ACCOMMODATION_TIERS),
            "is_active":          "Y",
            "launch_date":        launch_date.isoformat(),
        })
    return rows


def generate_customers(n=2000):
    """Generate n UK premium customer records"""
    rows = []
    for i in range(n):
        customer_id = f"CUS{str(i+1).zfill(5)}"
        city_data = random.choices(UK_CITIES, weights=[20,8,8,6,8,5,4,3,3,2,2,2,2,2,2])[0]
        city, postcodes = city_data
        postcode_district = random.choice(postcodes)
        postcode = f"{postcode_district} {random.randint(1,9)}{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}"
        
        age = random.randint(35, 70)
        dob = date.today() - timedelta(days=age*365 + random.randint(0, 364))
        join_date = fake.date_between(start_date=date(2015, 1, 1), end_date=date(2023, 12, 31))
        
        segment = random.choices(SEGMENTS, weights=SEGMENT_WEIGHTS)[0]
        
        if age < 45:
            loyalty_tier = random.choices(["Bronze", "Silver", "Gold", "Platinum"], weights=[0.5, 0.3, 0.15, 0.05])[0]
        elif age < 55:
            loyalty_tier = random.choices(["Bronze", "Silver", "Gold", "Platinum"], weights=[0.3, 0.35, 0.25, 0.10])[0]
        else:
            loyalty_tier = random.choices(["Bronze", "Silver", "Gold", "Platinum"], weights=[0.2, 0.3, 0.3, 0.20])[0]
        
        travel_count = random.randint(1, 15)
        
        rows.append({
            "customer_id":          customer_id,
            "first_name":           fake.first_name(),
            "last_name":            fake.last_name(),
            "email":                fake.email(),
            "phone":                fake.phone_number(),
            "date_of_birth":        dob.isoformat(),
            "address_line1":        fake.street_address(),
            "address_line2":        "",
            "city":                 city,
            "postcode":             postcode,
            "country":              "United Kingdom",
            "join_date":            join_date.isoformat(),
            "segment":              segment,
            "preferred_contact":    random.choice(["Email", "Phone", "Email", "WhatsApp"]),
            "travel_history_count": travel_count,
            "loyalty_tier":         loyalty_tier,
            "gdpr_consent":         random.choice(["Y", "Y", "Y", "N"]),
            "source_system":        "Salesforce",
        })
    return rows


def generate_agents():
    """Generate agent reference data"""
    rows = []
    for i, name in enumerate(AGENT_NAMES):
        agent_id = f"AGT{str(i+1).zfill(3)}"
        branch = random.choice(BRANCHES)
        specialisations = [
            "Indian Ocean & Maldives", "Safari & Wildlife Africa",
            "Far East & Asia", "Americas & Caribbean",
            "Europe & Mediterranean", "World Cruises",
            "Adventure & Expedition", "Tailor-Made Journeys",
        ]
        hire_date = fake.date_between(start_date=date(2015, 1, 1), end_date=date(2022, 6, 30))
        rows.append({
            "agent_id":       agent_id,
            "agent_name":     name,
            "branch_code":    branch[0],
            "branch_name":    branch[1],
            "specialisation": random.choice(specialisations),
            "hire_date":      hire_date.isoformat(),
            "is_active":      "Y",
        })
    return rows


def get_seasonal_weight(month: int) -> float:
    """Kuoni booking seasonality: peaks Jan, March, Oct"""
    weights = {
        1: 2.2,   # January: new year booking surge
        2: 1.2,
        3: 1.8,   # March: spring booking season
        4: 1.0,
        5: 1.1,
        6: 0.9,
        7: 0.8,
        8: 0.7,   # August: travel season, less booking
        9: 1.0,
        10: 1.9,  # October: winter booking surge
        11: 1.3,
        12: 0.9,
    }
    return weights.get(month, 1.0)


def generate_bookings(customers, products, agents, n=8000):
    """Generate n booking records spanning 2022-2024"""
    rows = []
    customer_ids = [c["customer_id"] for c in customers]
    agent_ids = [a["agent_id"] for a in agents]
    
    start_date = date(2022, 1, 1)
    end_date = date(2024, 12, 31)
    date_range = (end_date - start_date).days
    
    # Weight bookings by season
    date_pool = []
    d = start_date
    while d <= end_date:
        w = get_seasonal_weight(d.month)
        # Add date proportional to weight (×10 for granularity)
        date_pool.extend([d] * int(w * 10))
        d += timedelta(days=1)
    
    for i in range(n):
        booking_id = f"BKG{str(i+1).zfill(6)}"
        booking_date = random.choice(date_pool)
        
        # Travel date: typically 2-8 months after booking
        lead_months = random.randint(2, 8)
        travel_date = booking_date + timedelta(days=lead_months * 30 + random.randint(-15, 15))
        duration = random.randint(7, 21)
        return_date = travel_date + timedelta(days=duration)
        
        product = random.choice(products)
        customer_id = random.choice(customer_ids)
        agent_id = random.choice(agent_ids) if random.random() > 0.2 else None
        
        num_passengers = random.choices([1, 2, 3, 4, 5, 6], weights=[0.05, 0.55, 0.10, 0.20, 0.05, 0.05])[0]
        
        # Total value: base price × passengers × duration modifier × randomness
        base = float(product["base_price_gbp"])
        duration_mod = 1.0 + (duration - 10) * 0.02
        pax_discount = 1.0 - (max(num_passengers - 2, 0) * 0.05)
        value = base * num_passengers * duration_mod * pax_discount * random.uniform(0.85, 1.25)
        value = max(3000, min(45000, round(value, -2)))  # Clamp to £3k-£45k, round to £100
        
        # Booking status
        today = date.today()
        if travel_date < today:
            status = random.choices(
                ["Completed", "Cancelled"],
                weights=[0.88, 0.12]
            )[0]
        elif booking_date < today:
            status = random.choices(
                ["Confirmed", "Pending", "Cancelled"],
                weights=[0.75, 0.15, 0.10]
            )[0]
        else:
            status = "Pending"
        
        channel = random.choices(CHANNELS, weights=CHANNEL_WEIGHTS)[0]
        margin_pct = round(random.uniform(0.12, 0.28), 4)
        
        # Record hash for change detection
        hash_input = f"{booking_id}{customer_id}{product['product_id']}{booking_date}"
        record_hash = hashlib.md5(hash_input.encode()).hexdigest()
        
        rows.append({
            "booking_id":          booking_id,
            "customer_id":         customer_id,
            "product_id":          product["product_id"],
            "booking_date":        booking_date.isoformat(),
            "travel_date":         travel_date.isoformat(),
            "return_date":         return_date.isoformat(),
            "num_passengers":      num_passengers,
            "total_value_gbp":     value,
            "deposit_amount_gbp":  round(value * 0.2, 2),
            "balance_due_date":    (travel_date - timedelta(days=90)).isoformat(),
            "status":              status,
            "channel":             channel,
            "agent_id":            agent_id or "",
            "branch_code":         "",
            "margin_pct":          margin_pct,
            "currency":            "GBP",
            "exchange_rate":       1.0,
            "special_requests":    random.choice(["", "", "", "Sea view room", "Dietary requirements", "Anniversary surprise", "Wheelchair accessible"]),
            "insurance_included":  random.choice(["Y", "Y", "N"]),
            "cancellation_date":   (booking_date + timedelta(days=random.randint(1, 30))).isoformat() if status == "Cancelled" else "",
            "cancellation_reason": random.choice(["Change of plans", "Medical", "Work commitments", "Financial"]) if status == "Cancelled" else "",
            "_record_hash":        record_hash,
        })
    return rows


def generate_interactions(customers, agents, n=20000):
    """Generate n customer interaction records"""
    rows = []
    customer_ids = [c["customer_id"] for c in customers]
    agent_ids = [a["agent_id"] for a in agents]
    
    start_date = date(2022, 1, 1)
    end_date = date(2024, 12, 31)
    
    budget_ranges = [
        ("£3,000 - £5,000",   3000,  5000),
        ("£5,000 - £10,000",  5000,  10000),
        ("£10,000 - £20,000", 10000, 20000),
        ("£20,000+",          20000, 50000),
    ]
    
    for i in range(n):
        interaction_id = f"INT{str(i+1).zfill(7)}"
        interaction_date = fake.date_between(start_date=start_date, end_date=end_date)
        
        customer_id = random.choice(customer_ids)
        agent_id = random.choice(agent_ids) if random.random() > 0.4 else None
        
        channel = random.choices(INTERACTION_CHANNELS, weights=[0.30, 0.25, 0.25, 0.12, 0.08])[0]
        i_type = random.choices(
            INTERACTION_TYPES,
            weights=[0.40, 0.30, 0.15, 0.12, 0.03]
        )[0]
        
        if i_type == "Post-trip":
            outcome = random.choices(["Resolved", "Follow-up", "No-action"], weights=[0.7, 0.2, 0.1])[0]
            is_converted = False
        elif i_type == "Booking":
            outcome = "Converted"
            is_converted = True
        elif i_type == "Quote":
            outcome = random.choices(["Converted", "Follow-up", "No-action"], weights=[0.35, 0.45, 0.20])[0]
            is_converted = outcome == "Converted"
        else:
            outcome = random.choices(OUTCOMES[:3], weights=[0.20, 0.50, 0.30])[0]
            is_converted = outcome == "Converted"
        
        duration = random.randint(5, 60) if channel in ["Phone", "In-Store"] else random.randint(2, 20)
        budget = random.choice(budget_ranges)
        
        dest_interest = random.choice([d[0] for d in LUXURY_DESTINATIONS[:30]])
        
        rows.append({
            "interaction_id":       interaction_id,
            "customer_id":          customer_id,
            "interaction_date":     interaction_date.isoformat(),
            "interaction_time":     f"{random.randint(9,17):02d}:{random.choice(['00','15','30','45'])}",
            "channel":              channel,
            "interaction_type":     i_type,
            "duration_mins":        duration,
            "outcome":              outcome,
            "agent_id":             agent_id or "",
            "destination_interest": dest_interest,
            "budget_range":         budget[0],
            "travel_party_size":    random.randint(1, 6),
            "referral_source":      random.choice(["Google", "Word of mouth", "Repeat customer", "Travel agent", "Social media", ""]),
            "is_converted":         "Y" if is_converted else "N",
        })
    return rows


# ─────────────────────────────────────────────
# CSV WRITERS
# ─────────────────────────────────────────────

def write_csv(rows: list, filename: str) -> None:
    if not rows:
        print(f"  No rows to write for {filename}")
        return
    path = OUTPUT_DIR / filename
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"  ✅ {filename}: {len(rows):,} rows → {path}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Kuoni dummy data")
    parser.add_argument("--customers",    type=int, default=2000)
    parser.add_argument("--bookings",     type=int, default=8000)
    parser.add_argument("--interactions", type=int, default=20000)
    parser.add_argument("--all",          action="store_true")
    args = parser.parse_args()

    print("\n🏖️  Kuoni Data Generator — Premium UK Travel Data\n")
    print("Generating reference data...")
    
    destinations = generate_destinations()
    write_csv(destinations, "destinations.csv")
    
    products = generate_products(destinations)
    write_csv(products, "products.csv")
    
    agents = generate_agents()
    write_csv(agents, "agents.csv")
    
    print(f"\nGenerating {args.customers:,} customers...")
    customers = generate_customers(args.customers)
    write_csv(customers, "customers.csv")
    
    print(f"\nGenerating {args.bookings:,} bookings...")
    bookings = generate_bookings(customers, products, agents, args.bookings)
    write_csv(bookings, "bookings.csv")
    
    print(f"\nGenerating {args.interactions:,} interactions...")
    interactions = generate_interactions(customers, agents, args.interactions)
    write_csv(interactions, "interactions.csv")
    
    print(f"\n✨ Done! All files written to {OUTPUT_DIR}/")
    print("\nNext steps:")
    print("  1. pip install snowflake-connector-python pandas")
    print("  2. Set SNOWFLAKE_* environment variables")
    print("  3. python load_data.py")


if __name__ == "__main__":
    main()

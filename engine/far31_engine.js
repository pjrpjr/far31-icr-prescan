/**
 * FAR Part 31 / NCM / FCCM Anonymous Trial Balance CSV Pre-Scan Engine (JS)
 * =========================================================================
 * Zero-dependency UMD module (Node.js + 100% browser-local execution) with
 * deterministic 1:1 parity to `far31_scrubber.py`.
 *
 * NON-AUDIT / NON-ATTESTATION NOTICE:
 * Produces accounting preparation pre-scans and line-by-line adjustment
 * workpapers only. Does NOT provide an audit report, CPA attestation,
 * CPA opinion, or independent certification.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FAR31Engine = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULT_CONSTANTS = {
  "verified_date": "2026-11-24",
  "schema_version": "1.0.0",
  "fhwa_safe_harbor": {
    "rate": 1.1,
    "rate_pct": 110.0,
    "statute": "23 U.S.C. \u00a7 112(b)(2)",
    "regulation": "23 CFR 172.11",
    "notes": "Voluntary federal-aid Safe Harbor baseline for eligible emerging/small A&E firms lacking an established FAR Part 31 indirect cost rate; state DOTs administer program eligibility.",
    "source_urls": [
      "https://www.ecfr.gov/current/title-23/chapter-I/subchapter-B/part-172/section-172.11",
      "https://highways.dot.gov/laws-regulations/directives/orders/44701a"
    ]
  },
  "fdot_under_1m_self_cert": {
    "jurisdiction_code": "FL_FDOT_UNDER_1M",
    "form_number": "375-030-51",
    "form_title": "Self-Certification of Accounting System and Reimbursement Rates",
    "contract_threshold_usd": 1000000,
    "effective_date": "2026-06-26",
    "status": "ACTIVE",
    "statewide_average_caps": {
      "home_office_icr": 1.7336,
      "home_office_icr_pct": 173.36,
      "field_office_icr": 1.292,
      "field_office_icr_pct": 129.2,
      "fccm": 0.0081,
      "fccm_pct": 0.81,
      "home_office_direct_expense": 0.0635,
      "home_office_direct_expense_pct": 6.35,
      "field_office_direct_expense": 0.1079,
      "field_office_direct_expense_pct": 10.79
    },
    "disclosure": "Florida DOT caps unaudited, interim, and Form 375-030-51 self-certified rates (<$1,000,000 per contract) at the FDOT Statewide Averages effective June 26, 2026 (Home Office 173.36%, Field Office 129.20%, FCCM 0.81%, Home Direct Expense 6.35%, Field Direct Expense 10.79%). Unlimited status (>=$1,000,000 per contract) requires an independent CPA FAR Part 31 overhead audit.",
    "source_urls": [
      "https://www.fdot.gov/procurement/news.shtm",
      "https://www.fdot.gov/procurement/auditinfo.shtm",
      "https://www.fdot.gov/procurement/formmenu.shtm"
    ]
  },
  "ncdot_under_500k_self_cert": {
    "jurisdiction_code": "NC_NCDOT_UNDER_500K",
    "contract_threshold_usd": 500000,
    "status": "ACTIVE",
    "statewide_cap_applied": false,
    "audit_right_notice": "NCDOT permits A&E firms with under $500,000 in applicable annual contract fees to submit a principal-certified FAR-compliant overhead schedule and accounting system statement; however, NCDOT explicitly reserves the right to require an independent CPA or governmental agency audit at any time if deemed necessary by risk assessment. Firms at or above $500,000 must submit an independent CPA audit within six months of fiscal year-end.",
    "source_urls": [
      "https://connect.ncdot.gov/business/consultants/Roadway/NCDOT%20Audit%20Requirements.pdf"
    ]
  },
  "track_b_pre_audit": {
    "jurisdiction_code": "TRACK_B_PRE_AUDIT",
    "status": "ACTIVE",
    "statewide_cap_applied": false,
    "disclosure": "Track B Pre-Cleanup Mode for firms subject to mandatory independent CPA FAR Part 31 overhead audits (e.g., >=$1,000,000 FL FDOT, >=$500,000 NC NCDOT, or multi-state DOT thresholds). This workpaper preparation does NOT replace the mandatory independent CPA engagement; it organizes GL cost pools and unallowable schedules prior to external CPA review.",
    "source_urls": [
      "https://www.ecfr.gov/current/title-23/chapter-I/subchapter-B/part-172/section-172.11",
      "https://www.fdot.gov/procurement/auditinfo.shtm",
      "https://connect.ncdot.gov/business/consultants/Roadway/NCDOT%20Audit%20Requirements.pdf"
    ]
  },
  "executive_compensation": {
    "far_citation": "FAR 31.205-6(p)",
    "statute": "Section 702 of the Bipartisan Budget Act of 2013",
    "cy_2025_statutory_cap_usd": 671000,
    "cy_2026_statutory_cap_usd": 695000,
    "active_statutory_cap_usd": 695000,
    "active_tax_year": 2026,
    "cap_note": "CY 2025 OFPP benchmark is $671,000; CY 2026 BLS ECI-adjusted statutory cap is $695,000. Applies to total compensation (salary, bonus, deferred comp, employer DC pension) per employee; excess is expressly unallowable.",
    "ncm_reasonableness": {
      "default_review_threshold_usd": 250000,
      "configurable": true,
      "note": "FAR 31.205-6(b) requires compensation reasonableness independent of the statutory cap. Because the AASHTO National Compensation Matrix (NCM) is copyrighted and revenue-tier/role-specific, this pre-scan never fabricates NCM table figures; it flags anonymous executive compensation above the configurable screening threshold for formal NCM / market-survey benchmarking."
    },
    "source_urls": [
      "https://www.acquisition.gov/far/31.205-6",
      "https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/11/ContractorCompensationCapContractsAwardedafterJune24-UPDATE-NOV-2024.pdf"
    ]
  },
  "treasury_prompt_payment_fccm": {
    "far_citation": "FAR 31.205-10",
    "cas_citation": "48 CFR 9904.414 (CAS 414)",
    "h1_2026_rate": 0.04125,
    "h1_2026_rate_pct": 4.125,
    "h1_2026_period": "2026-01-01 to 2026-06-30",
    "h2_2026_rate": 0.0475,
    "h2_2026_rate_pct": 4.75,
    "h2_2026_period": "2026-07-01 to 2026-12-31",
    "cy_2026_cas414_average_rate": 0.044375,
    "cy_2026_cas414_average_rate_pct": 4.4375,
    "default_rate": 0.044375,
    "rate_note": "CAS 414-40(b) uses the arithmetic mean of the semi-annual Treasury Prompt Payment Act rates applicable to the cost accounting period (CY 2026 average: (4.125% + 4.75%) / 2 = 4.4375%; active H2 2026 rate: 4.75%).",
    "source_urls": [
      "https://fiscal.treasury.gov/payments-from-government/prompt-payment",
      "https://www.federalregister.gov/documents/2026/07/09/2026-13903/prompt-payment-interest-rate-contract-disputes-act",
      "https://www.federalregister.gov/documents/2026/02/03/2026-02176/prompt-payment-interest-rate-contract-disputes-act",
      "https://www.acquisition.gov/far/31.205-10"
    ]
  },
  "pricing_and_compliance": {
    "fixed_fee_usd": 1695,
    "fee_type": "FIXED_NON_CONTINGENT",
    "allowability_citation": "FAR 31.205-33",
    "allowability_note": "Under FAR 31.205-33, professional and consultant service costs are generally allowable indirect costs when reasonable, properly allocable, and billed on a fixed non-contingent basis (never percentage-of-uplift or contingent upon rate approval).",
    "criminal_liability_statute": "18 U.S.C. \u00a7 1020",
    "criminal_liability_warning": "WARNING (18 U.S.C. \u00a7 1020 & False Claims Act, 31 U.S.C. \u00a7 3729): Knowingly making a false statement, false representation, or false claim in connection with a federal-aid highway project\u2014including signing an indirect cost rate self-certification without documented FAR Part 31 adjustments\u2014carries federal criminal felony penalties and treble civil damages.",
    "non_audit_disclaimer": "NON-AUDIT / NON-ATTESTATION NOTICE: This pre-scan and any accompanying fixed-fee workpaper compilation are accounting preparation tools only. They do NOT constitute an audit report, CPA attestation, CPA opinion, or independent certification. Where state DOT rules require an independent CPA examination (e.g., FDOT >=$1M, NCDOT >=$500k, or upon agency risk-assessment request), the firm must engage an independent licensed CPA.",
    "source_urls": [
      "https://www.acquisition.gov/far/31.205-33"
    ]
  }
};

  const DEFAULT_RULES = {
  "schema_version": "1.0.0",
  "engine_family": "far31_anonymous_ledger_scrubber",
  "categories": [
    "DIRECT_LABOR_BASE",
    "DIRECT_PROJECT_COST",
    "ALLOWABLE_INDIRECT",
    "EXPRESSLY_UNALLOWABLE",
    "REVIEW_REQUIRED_PARTIAL",
    "EXCLUDED_NON_OPERATING"
  ],
  "classification_precedence": [
    "EXPRESSLY_UNALLOWABLE",
    "REVIEW_REQUIRED_PARTIAL",
    "DIRECT_LABOR_BASE",
    "DIRECT_PROJECT_COST",
    "EXCLUDED_NON_OPERATING",
    "ALLOWABLE_INDIRECT"
  ],
  "rules": [
    {
      "id": "FAR_31_205_51_ALCOHOL",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-51",
      "title": "Alcoholic Beverages",
      "disallow_ratio": 1.0,
      "keywords": [
        "alcohol",
        "liquor",
        "wine",
        "beer",
        "bar tab",
        "spirits",
        "cocktail",
        "happy hour"
      ],
      "rationale": "Costs of alcoholic beverages are expressly unallowable."
    },
    {
      "id": "FAR_31_205_14_ENTERTAINMENT",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-14",
      "title": "Entertainment & Social Activities",
      "disallow_ratio": 1.0,
      "keywords": [
        "entertainment",
        "golf",
        "country club",
        "social club",
        "sporting event",
        "tickets",
        "suite",
        "amusement",
        "recreation",
        "holiday party",
        "christmas party",
        "client outing",
        "fishing charter",
        "concert"
      ],
      "rationale": "Costs of amusement, diversions, social activities, and associated meals/lodging/tickets are expressly unallowable."
    },
    {
      "id": "FAR_31_205_20_INTEREST",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-20",
      "title": "Interest & Other Financial Costs",
      "disallow_ratio": 1.0,
      "keywords": [
        "interest expense",
        "loan interest",
        "line of credit interest",
        "loc interest",
        "finance charge",
        "credit card interest",
        "note interest",
        "mortgage interest",
        "bank interest paid",
        "debt service interest"
      ],
      "rationale": "Interest on borrowings, bond discounts, and financing costs are expressly unallowable (capital cost is recovered solely via FCCM under FAR 31.205-10)."
    },
    {
      "id": "FAR_31_205_3_BAD_DEBTS",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-3",
      "title": "Bad Debts & Collection Costs",
      "disallow_ratio": 1.0,
      "keywords": [
        "bad debt",
        "uncollectible",
        "write-off",
        "write off",
        "allowance for doubtful",
        "collection agency"
      ],
      "rationale": "Bad debts (actual or estimated losses from uncollectible customer accounts) and related collection/legal costs are expressly unallowable."
    },
    {
      "id": "FAR_31_205_22_LOBBYING",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-22",
      "title": "Lobbying & Political Activity Costs",
      "disallow_ratio": 1.0,
      "keywords": [
        "lobbying",
        "political",
        "pac ",
        "pac-",
        "campaign contribution",
        "legislative advocacy",
        "election",
        "fundraiser"
      ],
      "rationale": "Costs associated with lobbying, political campaigns, PAC contributions, and attempting to influence legislation are expressly unallowable."
    },
    {
      "id": "FAR_31_205_8_CONTRIBUTIONS",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-8",
      "title": "Contributions & Donations",
      "disallow_ratio": 1.0,
      "keywords": [
        "charitable",
        "charity",
        "donation",
        "donations",
        "contribution",
        "contributions",
        "sponsorship",
        "philanthrop",
        "nonprofit gift"
      ],
      "exclude_keywords": [
        "401k",
        "401(k)",
        "retirement",
        "pension",
        "hsa",
        "employer match",
        "profit sharing",
        "benefit",
        "lobbying",
        "political",
        "pac"
      ],
      "rationale": "Contributions or donations, including cash, property, and services, regardless of recipient, are expressly unallowable."
    },
    {
      "id": "FAR_31_205_15_FINES_PENALTIES",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-15",
      "title": "Fines, Penalties & Mischarging Costs",
      "disallow_ratio": 1.0,
      "keywords": [
        "fine",
        "fines",
        "penalt",
        "late fee",
        "irs penalty",
        "tax penalty",
        "parking ticket",
        "traffic citation",
        "settlement penalty"
      ],
      "exclude_keywords": [
        "defined benefit",
        "defined contribution"
      ],
      "rationale": "Costs of fines and penalties resulting from violations of federal, state, local, or foreign laws and regulations are expressly unallowable."
    },
    {
      "id": "FAR_31_205_1_ADVERTISING_PR",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-1",
      "title": "Public Relations & Promotional Advertising",
      "disallow_ratio": 1.0,
      "keywords": [
        "advertising",
        "marketing",
        "promotional",
        "branding",
        "public relations",
        "swag",
        "giveaway",
        "trade show",
        "brochure",
        "billboard",
        "seo ",
        "google ads",
        "social media ads",
        "website marketing",
        "client gift",
        "gifts"
      ],
      "exclude_keywords": [
        "recruiting",
        "recruitment",
        "help wanted",
        "job posting",
        "procurement notice",
        "indirect labor",
        "salary",
        "salaries",
        "wages"
      ],
      "rationale": "Promotional advertising, brand-building marketing, trade-show swag, and public relations intended to promote sales or firm image are expressly unallowable (only recruiting and specific statutory notices are allowable)."
    },
    {
      "id": "FAR_31_205_27_ORGANIZATION",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-27",
      "title": "Organization & Reorganization Costs",
      "disallow_ratio": 1.0,
      "keywords": [
        "organization cost",
        "reorganization",
        "merger",
        "acquisition",
        "m&a",
        "incorporation",
        "capital raising",
        "stock issuance",
        "equity financing",
        "buy-sell"
      ],
      "rationale": "Expenditures in connection with planning or executing organization, reorganization, mergers, acquisitions, or raising capital are expressly unallowable."
    },
    {
      "id": "FAR_31_205_19_KEY_MAN_INSURANCE",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-19",
      "title": "Key-Person Life Insurance (Firm Beneficiary)",
      "disallow_ratio": 1.0,
      "keywords": [
        "key man",
        "key-man",
        "key person",
        "key-person",
        "officer life insurance",
        "corporate owned life",
        "coli",
        "owner life insurance"
      ],
      "rationale": "Costs of insurance on the lives of officers, partners, or proprietors where the firm is the beneficiary are expressly unallowable."
    },
    {
      "id": "FAR_31_205_46_EXCESS_TRAVEL",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-46",
      "title": "Unallowable Travel (First-Class Airfare / Excess Per Diem)",
      "disallow_ratio": 1.0,
      "keywords": [
        "first class",
        "first-class",
        "business class",
        "airfare upgrade",
        "excess per diem",
        "luxury hotel",
        "non-business travel",
        "personal travel",
        "spousal travel"
      ],
      "rationale": "Airfare costs in excess of the lowest priced airfare available and lodging/meals exceeding GSA/FTR per diem limits are expressly unallowable."
    },
    {
      "id": "FAR_31_205_6P_EXEC_COMP_EXCESS",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-6(p)",
      "title": "Excess Executive / Officer Compensation Above Statutory Cap",
      "disallow_ratio": 1.0,
      "keywords": [
        "excess officer comp",
        "excess executive comp",
        "unallowable officer",
        "excess compensation",
        "golden parachute",
        "owner distribution",
        "shareholder distribution",
        "partner draw",
        "dividend"
      ],
      "rationale": "Compensation exceeding the OFPP statutory cap (FAR 31.205-6(p)) and profit distributions/draws are expressly unallowable."
    },
    {
      "id": "FAR_31_205_41_INCOME_TAX",
      "category": "EXPRESSLY_UNALLOWABLE",
      "far_citation": "FAR 31.205-41",
      "title": "Federal Income Taxes",
      "disallow_ratio": 1.0,
      "keywords": [
        "federal income tax",
        "income tax expense",
        "corporate income tax",
        "provision for income tax"
      ],
      "exclude_keywords": [
        "payroll tax",
        "fica",
        "futa",
        "suta",
        "property tax",
        "sales tax",
        "franchise tax",
        "business license"
      ],
      "rationale": "Federal income and excess profits taxes are expressly unallowable under FAR 31.205-41."
    },
    {
      "id": "FAR_31_205_46_MEALS_REVIEW",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-46 / 31.205-14",
      "title": "Meals & Business Dining (Requires Per Diem / Entertainment Scrub)",
      "disallow_ratio": 0.5,
      "keywords": [
        "meals",
        "meal ",
        "dining",
        "business lunch",
        "client lunch",
        "business dinner",
        "restaurant",
        "catering",
        "food & beverage",
        "food and beverage"
      ],
      "rationale": "Business meals must be separated between allowable GSA per-diem travel/working meals and unallowable entertainment, alcohol, or local non-travel dining. Conservative 50% pre-scan exclusion applied pending receipt-level review."
    },
    {
      "id": "FAR_31_205_6M_AUTO_PERSONAL_REVIEW",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-6(m)(2)",
      "title": "Company Vehicles & Auto Expense (Personal Use Disallowance)",
      "disallow_ratio": 0.25,
      "keywords": [
        "auto expense",
        "automobile",
        "vehicle expense",
        "vehicle lease",
        "company car",
        "fleet",
        "fuel",
        "mileage",
        "auto lease",
        "truck expense"
      ],
      "rationale": "Portion of company-furnished automobile costs attributable to personal use (including commuting) is unallowable under FAR 31.205-6(m)(2). Conservative 25% pre-scan adjustment applied pending mileage log verification."
    },
    {
      "id": "FAR_31_205_6F_BONUS_REVIEW",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-6(f) / 31.205-6(p)",
      "title": "Bonuses & Incentive Compensation (Plan & NCM Reasonableness Check)",
      "disallow_ratio": 0.2,
      "keywords": [
        "bonus",
        "bonuses",
        "incentive comp",
        "profit sharing bonus",
        "discretionary bonus",
        "officer bonus",
        "executive bonus"
      ],
      "rationale": "Bonuses are allowable only if based on a documented pre-existing plan/policy and reasonable under FAR 31.205-6(b)/(f) (profit distributions to owners are unallowable). Conservative 20% pre-scan reserve applied pending bonus plan & NCM check."
    },
    {
      "id": "FAR_31_205_36_RELATED_PARTY_RENT",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-36(b)(3)",
      "title": "Related-Party / Common-Control Rent (Limited to Cost of Ownership)",
      "disallow_ratio": 0.3,
      "keywords": [
        "related party rent",
        "related-party rent",
        "affiliate rent",
        "owner rent",
        "common control rent",
        "building lease - related",
        "rent - related",
        "rent to llc",
        "holding llc rent"
      ],
      "rationale": "Rent paid between organizations under common control is limited to normal costs of ownership (depreciation, taxes, insurance, maintenance\u2014excluding mortgage interest) under FAR 31.205-36(b)(3). Conservative 30% pre-scan adjustment applied pending ownership-cost schedule."
    },
    {
      "id": "FAR_31_205_33_47_PROF_LEGAL_REVIEW",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-33 / 31.205-47",
      "title": "Legal & Professional Fees (Verify Retainer, Non-Contingent, Non-Litigation)",
      "disallow_ratio": 0.15,
      "keywords": [
        "legal",
        "attorney",
        "law firm",
        "litigation",
        "outside counsel",
        "professional fees",
        "consulting fees",
        "advisory fees"
      ],
      "exclude_keywords": [
        "accounting",
        "cpa",
        "bookkeeping",
        "payroll service",
        "audit prep",
        "far 31",
        "it support",
        "recruiting"
      ],
      "rationale": "Legal and consultant fees require invoice-level verification under FAR 31.205-33 (non-contingent, evidenced work product) and FAR 31.205-47 (disallow costs of certain proceedings/claims against the government). Conservative 15% pre-scan review reserve applied."
    },
    {
      "id": "FAR_31_205_46_TRAVEL_REVIEW",
      "category": "REVIEW_REQUIRED_PARTIAL",
      "far_citation": "FAR 31.205-46",
      "title": "General Travel & Lodging (Verify FTR/GSA Per Diem Compliance)",
      "disallow_ratio": 0.1,
      "keywords": [
        "travel",
        "airfare",
        "lodging",
        "hotel",
        "conference travel",
        "per diem"
      ],
      "exclude_keywords": [
        "direct travel",
        "project travel",
        "reimbursable travel",
        "billable travel"
      ],
      "rationale": "Indirect travel must comply with Federal Travel Regulation (FTR) / GSA per diem caps and lowest available airfare rules under FAR 31.205-46. Conservative 10% pre-scan review adjustment applied."
    },
    {
      "id": "DIRECT_LABOR_BASE_RULE",
      "category": "DIRECT_LABOR_BASE",
      "far_citation": "FAR 31.202 / AASHTO Ch. 5",
      "title": "Direct Project Labor (Allocation Base)",
      "disallow_ratio": 0.0,
      "keywords": [
        "direct labor",
        "direct salaries",
        "direct wages",
        "billable labor",
        "project labor",
        "chargeable labor",
        "direct payroll",
        "direct engineering labor",
        "direct staff labor",
        "field direct labor",
        "home direct labor",
        "direct survey",
        "direct billable"
      ],
      "regex_keywords": [
        "\\bdirect\\b[^\\n]{0,40}\\b(?:labor|salaries|wages|payroll)\\b",
        "\\bbillable\\b[^\\n]{0,30}\\b(?:labor|salaries|wages)\\b"
      ],
      "exclude_keywords": [
        "subconsultant",
        "subcontractor",
        "direct expense",
        "direct project cost",
        "direct travel",
        "non-labor",
        "odc",
        "reimbursable",
        "indirect"
      ],
      "rationale": "Direct project labor forms the denominator (allocation base) of the FAR Part 31 Indirect Cost Rate."
    },
    {
      "id": "DIRECT_PROJECT_COST_RULE",
      "category": "DIRECT_PROJECT_COST",
      "far_citation": "FAR 31.202",
      "title": "Other Direct Project Costs / Subconsultants (Excluded from Indirect Pool)",
      "disallow_ratio": 0.0,
      "keywords": [
        "subconsultant",
        "subcontractor",
        "other direct",
        "odc",
        "direct project",
        "direct expense",
        "reimbursable expense",
        "project expense",
        "project travel",
        "direct travel",
        "billable expense",
        "cost of goods",
        "cogs",
        "project materials",
        "lab testing - direct",
        "survey supplies - direct",
        "reproduction - direct",
        "permit fees - project"
      ],
      "rationale": "Direct non-labor project costs and subconsultant pass-throughs are billed directly to projects and excluded from both the indirect cost pool and direct labor base."
    },
    {
      "id": "NON_OPERATING_EXCLUDED_RULE",
      "category": "EXCLUDED_NON_OPERATING",
      "far_citation": "Non-Operating / Balance Sheet / Revenue",
      "title": "Revenue, Assets, Liabilities, or Equity Line (Excluded from Expense Pool)",
      "disallow_ratio": 0.0,
      "keywords": [
        "revenue",
        "sales",
        "fee income",
        "consulting income",
        "billing",
        "interest income",
        "other income",
        "cash",
        "checking",
        "savings",
        "accounts receivable",
        "accounts payable",
        "retained earnings",
        "common stock",
        "owner equity",
        "member equity",
        "accumulated depreciation",
        "fixed asset",
        "work in progress",
        "wip",
        "unbilled revenue"
      ],
      "rationale": "Revenue and balance-sheet accounts are not indirect operating expenses and are excluded from the indirect cost pool."
    },
    {
      "id": "ALLOWABLE_INDIRECT_LABOR_FRINGE",
      "category": "ALLOWABLE_INDIRECT",
      "far_citation": "FAR 31.203 / 31.205-6",
      "title": "Allowable Indirect Labor, PTO & Fringe Benefits",
      "disallow_ratio": 0.0,
      "keywords": [
        "indirect labor",
        "indirect salaries",
        "admin salaries",
        "administrative labor",
        "officer salary",
        "executive salary",
        "pto",
        "vacation",
        "holiday pay",
        "sick leave",
        "payroll tax",
        "fica",
        "futa",
        "suta",
        "health insurance",
        "medical insurance",
        "dental",
        "vision",
        "workers comp",
        "worker's comp",
        "401k",
        "401(k)",
        "retirement",
        "pension",
        "fringe",
        "employee benefits",
        "uncompensated overtime"
      ],
      "rationale": "Allowable indirect labor, paid leave, payroll taxes, and standard employee fringe benefits (subject to FAR 31.205-6(p) statutory cap and NCM reasonableness check on executive pay)."
    },
    {
      "id": "ALLOWABLE_INDIRECT_OVERHEAD",
      "category": "ALLOWABLE_INDIRECT",
      "far_citation": "FAR 31.203 / 31.205-36 / 31.205-33",
      "title": "Allowable General & Administrative Overhead",
      "disallow_ratio": 0.0,
      "keywords": [
        "rent",
        "office lease",
        "utilities",
        "electric",
        "internet",
        "telephone",
        "telecom",
        "software",
        "cad ",
        "autocad",
        "civil 3d",
        "microstation",
        "bentley",
        "revit",
        "deltek",
        "ajera",
        "bqe",
        "quickbooks",
        "it support",
        "cloud",
        "office supplies",
        "postage",
        "shipping",
        "depreciation",
        "amortization",
        "professional liability",
        "errors & omissions",
        "e&o",
        "general liability",
        "business insurance",
        "accounting",
        "cpa",
        "bookkeeping",
        "payroll service",
        "training",
        "continuing education",
        "pdh",
        "professional license",
        "pe license",
        "professional dues",
        "asce",
        "acec",
        "nspe",
        "recruiting",
        "repairs",
        "maintenance",
        "janitorial",
        "bank service charge",
        "merchant fee",
        "property tax",
        "business license",
        "equipment rental"
      ],
      "rationale": "Ordinary, reasonable, and allocable indirect overhead costs under FAR Part 31."
    }
  ],
  "account_code_hints": {
    "revenue_prefixes": [
      "4"
    ],
    "balance_sheet_prefixes": [
      "1",
      "2",
      "3"
    ],
    "direct_cost_prefixes": [
      "5"
    ],
    "indirect_expense_prefixes": [
      "6",
      "7",
      "8",
      "9"
    ]
  },
  "pii_guardrail": {
    "forbidden_header_patterns": [
      "\\bssn\\b",
      "social[\\s_-]*security",
      "employee[\\s_-]*name",
      "full[\\s_-]*name",
      "first[\\s_-]*name",
      "last[\\s_-]*name",
      "\\bein\\b",
      "tax[\\s_-]*id",
      "\\btin\\b",
      "\\bemail\\b",
      "e-mail",
      "date[\\s_-]*of[\\s_-]*birth",
      "\\bdob\\b",
      "home[\\s_-]*address",
      "phone[\\s_-]*number"
    ],
    "ssn_regex": "\\b\\d{3}-\\d{2}-\\d{4}\\b",
    "ein_regex": "\\b\\d{2}-\\d{7}\\b",
    "email_regex": "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
  }
};

  const VALID_JURISDICTIONS = ["FL_FDOT_UNDER_1M", "NC_NCDOT_UNDER_500K", "TRACK_B_PRE_AUDIT"];
  const VALID_OFFICE_TYPES = ["home", "field"];
  const VALID_PII_MODES = ["refuse", "redact"];

  const SUMMARY_ROW_PATTERNS = [
    /^\s*total\b/i,
    /^\s*grand\s+total\b/i,
    /^\s*net\s+(income|loss|operating\s+income)\b/i,
    /^\s*subtotal\b/i
  ];

  const EXCLUDED_ACCOUNT_TYPES = new Set([
    "asset",
    "assets",
    "bank",
    "cash",
    "accounts receivable",
    "other current asset",
    "fixed asset",
    "other asset",
    "liability",
    "liabilities",
    "accounts payable",
    "credit card",
    "other current liability",
    "long term liability",
    "equity",
    "income",
    "revenue",
    "other income"
  ]);

  function roundNum(val, digits) {
    const d = digits === undefined ? 2 : digits;
    const factor = Math.pow(10, d);
    const scaled = val * factor;
    if (scaled >= 0) {
      return Math.floor(scaled + 0.5 + 1e-12) / factor;
    }
    return -Math.floor(-scaled + 0.5 + 1e-12) / factor;
  }

  function formatMoneyNumber(val) {
    const fixed = Math.abs(val).toFixed(2);
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function formatUsd(val) {
    return val < 0 ? "-$" + formatMoneyNumber(val) : "$" + formatMoneyNumber(val);
  }

  function formatUsdInt(val) {
    const rounded = Math.round(Math.abs(val)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return val < 0 ? "-$" + rounded : "$" + rounded;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  function parseCsv(text) {
    const cleaned = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let i = 0;

    while (i < cleaned.length) {
      const ch = cleaned[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < cleaned.length && cleaned[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i += 1;
          }
        } else {
          field += ch;
          i += 1;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i += 1;
        } else if (ch === ",") {
          row.push(field);
          field = "";
          i += 1;
        } else if (ch === "\r") {
          if (i + 1 < cleaned.length && cleaned[i + 1] === "\n") {
            i += 2;
          } else {
            i += 1;
          }
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else if (ch === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
          i += 1;
        } else {
          field += ch;
          i += 1;
        }
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function parseMoney(raw) {
    if (raw === null || raw === undefined) return null;
    let s = String(raw).trim();
    if (!s || s === "-" || s === "--" || s === "\u2014" || s === "N/A" || s === "n/a") {
      return 0.0;
    }
    let neg = false;
    if (s.startsWith("(") && s.endsWith(")")) {
      neg = true;
      s = s.slice(1, -1).trim();
    }
    s = s.replace(/\$/g, "").replace(/,/g, "").replace(/ /g, "");
    if (s.endsWith("-")) {
      neg = true;
      s = s.slice(0, -1);
    } else if (s.startsWith("-")) {
      neg = true;
      s = s.slice(1);
    }
    if (!s) return null;
    const val = Number(s);
    if (!Number.isFinite(val)) return null;
    return neg ? -val : val;
  }

  function normalizeHeader(h) {
    return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function detectCsvLayout(rows) {
    const codeAliases = new Set(["account code", "account number", "account id", "acct code", "acct no", "acct", "gl code", "code", "number"]);
    const nameAliases = new Set(["account name", "account description", "description", "account", "gl account", "account title", "name"]);
    const typeAliases = new Set(["account type", "type", "category", "classification"]);
    const amountAliases = new Set(["amount", "balance", "ending balance", "net balance", "ytd balance", "total", "net"]);
    const debitAliases = new Set(["debit", "debits", "dr", "debit balance", "ytd debit"]);
    const creditAliases = new Set(["credit", "credits", "cr", "credit balance", "ytd credit"]);

    let headerIdx = -1;
    let colMap = {};

    const scanLimit = Math.min(rows.length, 15);
    for (let idx = 0; idx < scanLimit; idx++) {
      const row = rows[idx];
      const norm = row.map(normalizeHeader);
      const nonEmpty = norm.filter(Boolean);
      if (nonEmpty.length < 2) continue;

      const found = {};
      for (let cIdx = 0; cIdx < norm.length; cIdx++) {
        const h = norm[cIdx];
        if (!h) continue;
        if (found.code === undefined && codeAliases.has(h)) found.code = cIdx;
        else if (found.name === undefined && nameAliases.has(h)) found.name = cIdx;
        else if (found.type === undefined && typeAliases.has(h)) found.type = cIdx;
        else if (found.debit === undefined && debitAliases.has(h)) found.debit = cIdx;
        else if (found.credit === undefined && creditAliases.has(h)) found.credit = cIdx;
        else if (found.amount === undefined && amountAliases.has(h)) found.amount = cIdx;
      }

      const hasValue = found.amount !== undefined || (found.debit !== undefined && found.credit !== undefined);
      const hasAcct = found.name !== undefined || found.code !== undefined;
      if (hasValue && hasAcct) {
        headerIdx = idx;
        colMap = found;
        break;
      }
    }

    if (headerIdx === -1) {
      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        if (row.filter(function (c) { return String(c || "").trim().length > 0; }).length >= 3) {
          headerIdx = idx;
          if (row.length >= 4) {
            colMap = { code: 0, name: 1, debit: 2, credit: 3 };
          } else {
            colMap = { code: 0, name: 1, amount: 2 };
          }
          break;
        }
      }
    }

    const preambleRows = rows.slice(0, Math.max(headerIdx + 1, 1));
    const preambleText = preambleRows.map(function (r) { return r.join(" "); }).join(" ").toLowerCase();
    const rawHeaders = (headerIdx >= 0 && headerIdx < rows.length ? rows[headerIdx] : []).map(normalizeHeader);

    let detectedFormat = "GENERIC_3COL_AMOUNT";
    if (preambleText.indexOf("ajera") !== -1 || (rawHeaders.indexOf("account id") !== -1 && rawHeaders.indexOf("account description") !== -1)) {
      detectedFormat = "DELTEK_AJERA";
    } else if (preambleText.indexOf("bqe") !== -1 || (rawHeaders.indexOf("account number") !== -1 && rawHeaders.indexOf("account type") !== -1)) {
      detectedFormat = "BQE_CORE";
    } else if (
      preambleText.indexOf("quickbooks") !== -1 ||
      (rawHeaders.indexOf("account") !== -1 && colMap.debit !== undefined && colMap.credit !== undefined && colMap.code === undefined)
    ) {
      detectedFormat = "QUICKBOOKS";
    } else if (colMap.debit !== undefined && colMap.credit !== undefined) {
      detectedFormat = "GENERIC_4COL_DEBIT_CREDIT";
    }

    return {
      header_idx: headerIdx,
      col_map: colMap,
      detected_format: detectedFormat
    };
  }

  function scanPiiInRows(rows, headerIdx, rules, execCompAnon) {
    const piiCfg = rules.pii_guardrail;
    const headerPatterns = piiCfg.forbidden_header_patterns.map(function (p) { return new RegExp(p, "i"); });
    const ssnRe = new RegExp(piiCfg.ssn_regex);
    const einRe = new RegExp(piiCfg.ein_regex);
    const emailRe = new RegExp(piiCfg.email_regex);

    const findings = [];

    if (headerIdx >= 0 && headerIdx < rows.length) {
      const headers = rows[headerIdx];
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const cleaned = String(headers[colIdx] || "").trim();
        for (let p = 0; p < headerPatterns.length; p++) {
          if (headerPatterns[p].test(cleaned)) {
            findings.push({
              type: "FORBIDDEN_HEADER",
              row: headerIdx + 1,
              col: colIdx + 1,
              detail: "Forbidden identity/PII column header detected at column " + (colIdx + 1)
            });
            break;
          }
        }
      }
    }

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const val = String(row[cIdx] || "").trim();
        if (!val) continue;
        if (ssnRe.test(val)) {
          findings.push({
            type: "SSN_DETECTED",
            row: rIdx + 1,
            col: cIdx + 1,
            detail: "SSN pattern detected at row " + (rIdx + 1) + ", col " + (cIdx + 1) + " (value withheld)"
          });
        }
        if (einRe.test(val)) {
          findings.push({
            type: "EIN_DETECTED",
            row: rIdx + 1,
            col: cIdx + 1,
            detail: "EIN pattern detected at row " + (rIdx + 1) + ", col " + (cIdx + 1) + " (value withheld)"
          });
        }
        if (emailRe.test(val)) {
          findings.push({
            type: "EMAIL_DETECTED",
            row: rIdx + 1,
            col: cIdx + 1,
            detail: "Email address detected at row " + (rIdx + 1) + ", col " + (cIdx + 1) + " (value withheld)"
          });
        }
      }
    }

    if (Array.isArray(execCompAnon)) {
      const forbiddenKeys = new Set(["name", "employee_name", "full_name", "ssn", "email", "first_name", "last_name"]);
      for (let idx = 0; idx < execCompAnon.length; idx++) {
        const item = execCompAnon[idx];
        if (!item || typeof item !== "object") continue;
        const keys = Object.keys(item);
        for (let k = 0; k < keys.length; k++) {
          const key = keys[k];
          if (forbiddenKeys.has(key.trim().toLowerCase())) {
            findings.push({
              type: "EXEC_COMP_PII_KEY",
              row: idx + 1,
              col: 0,
              detail: "Forbidden identity key '" + key + "' in exec_comp_anon entry " + (idx + 1)
            });
          }
        }
        const roleVal = String(item.role || "");
        if (ssnRe.test(roleVal) || einRe.test(roleVal) || emailRe.test(roleVal)) {
          findings.push({
            type: "EXEC_COMP_PII_VALUE",
            row: idx + 1,
            col: 0,
            detail: "Sensitive identifier detected in exec_comp_anon entry " + (idx + 1) + " (value withheld)"
          });
        }
      }
    }

    return findings;
  }

  function redactPiiInRows(rows, headerIdx, rules) {
    const piiCfg = rules.pii_guardrail;
    const headerPatterns = piiCfg.forbidden_header_patterns.map(function (p) { return new RegExp(p, "i"); });
    const ssnRe = new RegExp(piiCfg.ssn_regex, "g");
    const einRe = new RegExp(piiCfg.ein_regex, "g");
    const emailRe = new RegExp(piiCfg.email_regex, "g");

    const dropCols = new Set();
    let redactions = 0;
    if (headerIdx >= 0 && headerIdx < rows.length) {
      const headers = rows[headerIdx];
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const cleaned = String(headers[colIdx] || "").trim();
        for (let p = 0; p < headerPatterns.length; p++) {
          if (headerPatterns[p].test(cleaned)) {
            dropCols.add(colIdx);
            redactions += 1;
            break;
          }
        }
      }
    }

    const cleanedRows = [];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const newRow = [];
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        if (dropCols.has(cIdx)) continue;
        let val = String(row[cIdx] || "");
        [ssnRe, einRe, emailRe].forEach(function (rx) {
          const matches = val.match(rx);
          if (matches) {
            redactions += matches.length;
            val = val.replace(rx, "[REDACTED_PII]");
          }
        });
        newRow.push(val);
      }
      cleanedRows.push(newRow);
    }
    return { rows: cleanedRows, redactions: redactions };
  }

  function splitCombinedAccount(codeRaw, nameRaw) {
    const code = String(codeRaw || "").trim();
    const name = String(nameRaw || "").trim();
    if (!code && name) {
      const m = name.match(/^(\d{3,6}(?:[-.]\d{1,4})?)\s*(?:[\u00B7:\-\u2013\u2014]\s*|\s+)(.+)$/);
      if (m) {
        return { code: m[1].trim(), name: m[2].trim() };
      }
    }
    return { code: code, name: name };
  }

  function parseTrialBalanceRows(rows, layout) {
    const headerIdx = layout.header_idx;
    const colMap = layout.col_map;
    const entries = [];
    if (headerIdx < 0 || headerIdx >= rows.length) return entries;

    for (let rIdx = headerIdx + 1; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row.some(function (c) { return String(c || "").trim().length > 0; })) continue;

      function getCell(key) {
        const idx = colMap[key];
        if (idx === undefined || idx >= row.length) return "";
        return String(row[idx] || "").trim();
      }

      const rawCode = getCell("code");
      const rawName = getCell("name");
      const acctType = getCell("type");
      const split = splitCombinedAccount(rawCode, rawName);
      const code = split.code;
      const name = split.name;

      if (!code && !name) continue;
      const combinedLabel = name || code;
      if (SUMMARY_ROW_PATTERNS.some(function (p) { return p.test(combinedLabel); })) continue;
      if (code && SUMMARY_ROW_PATTERNS.some(function (p) { return p.test(code); })) continue;

      let amount = null;
      if (colMap.debit !== undefined && colMap.credit !== undefined) {
        const dr = parseMoney(getCell("debit"));
        const cr = parseMoney(getCell("credit"));
        if (dr === null && cr === null) continue;
        amount = (dr || 0.0) - (cr || 0.0);
      } else {
        const amt = parseMoney(getCell("amount"));
        if (amt === null) continue;
        amount = amt;
      }

      if (Math.abs(amount) < 1e-9) continue;

      entries.push({
        row_number: rIdx + 1,
        account_code: code,
        account_name: name || code,
        account_type: acctType,
        amount: roundNum(amount, 2)
      });
    }
    return entries;
  }

  function keywordMatches(haystack, keyword) {
    const kw = String(keyword || "").toLowerCase();
    if (!kw) return false;
    const startsAlnum = /[a-z0-9]/.test(kw[0]);
    if (!startsAlnum) {
      return haystack.indexOf(kw) !== -1;
    }
    let pos = 0;
    while (true) {
      const idx = haystack.indexOf(kw, pos);
      if (idx === -1) return false;
      if (idx === 0 || !/[a-z0-9]/.test(haystack[idx - 1])) {
        return true;
      }
      pos = idx + 1;
    }
  }

  function classifyLine(entry, rules) {
    const acctCode = String(entry.account_code || "").trim();
    const acctName = String(entry.account_name || "").trim();
    const acctType = String(entry.account_type || "").trim().toLowerCase();
    const amount = Number(entry.amount);
    const haystack = " " + acctName.toLowerCase() + " ";

    if (acctType && EXCLUDED_ACCOUNT_TYPES.has(acctType)) {
      return Object.assign({}, entry, {
        category: "EXCLUDED_NON_OPERATING",
        rule_id: "ACCOUNT_TYPE_NON_OPERATING",
        far_citation: "Non-Operating / Balance Sheet / Revenue",
        rule_title: "Excluded via Account Type (" + entry.account_type + ")",
        disallow_ratio: 0.0,
        disallowed_amount: 0.0,
        allowable_indirect_amount: 0.0,
        rationale: "Balance sheet or revenue account excluded from indirect cost pool."
      });
    }

    const hints = rules.account_code_hints || {};
    const bsRevPrefixes = (hints.balance_sheet_prefixes || []).concat(hints.revenue_prefixes || []);
    const firstDigit = acctCode && /[0-9]/.test(acctCode[0]) ? acctCode[0] : "";

    const precedence = rules.classification_precedence;
    const rulesByCat = {};
    precedence.forEach(function (c) { rulesByCat[c] = []; });
    rules.rules.forEach(function (r) {
      if (rulesByCat[r.category]) rulesByCat[r.category].push(r);
    });

    if (firstDigit && bsRevPrefixes.indexOf(firstDigit) !== -1) {
      const expWords = ["expense", "labor", "salary", "salaries", "wages", "overhead"];
      if (!expWords.some(function (w) { return keywordMatches(haystack, w); })) {
        return Object.assign({}, entry, {
          category: "EXCLUDED_NON_OPERATING",
          rule_id: "CODE_PREFIX_NON_OPERATING",
          far_citation: "Non-Operating / Balance Sheet / Revenue",
          rule_title: "Balance Sheet or Revenue Prefix (1xxx-4xxx)",
          disallow_ratio: 0.0,
          disallowed_amount: 0.0,
          allowable_indirect_amount: 0.0,
          rationale: "Account code prefix indicates Balance Sheet or Revenue; excluded from indirect cost pool."
        });
      }
    }

    for (let p = 0; p < precedence.length; p++) {
      const cat = precedence[p];
      const catRules = rulesByCat[cat] || [];
      for (let r = 0; r < catRules.length; r++) {
        const rule = catRules[r];
        const excludes = rule.exclude_keywords || [];
        if (excludes.some(function (ex) { return keywordMatches(haystack, ex); })) continue;

        const kwHit = (rule.keywords || []).some(function (kw) { return keywordMatches(haystack, kw); });
        const rxHit = (rule.regex_keywords || []).some(function (rx) { return new RegExp(rx, "i").test(haystack); });
        if (kwHit || rxHit) {
          const ratio = Number(rule.disallow_ratio || 0.0);
          let disallowed = 0.0;
          let allowable = 0.0;
          if (cat === "EXPRESSLY_UNALLOWABLE" || cat === "REVIEW_REQUIRED_PARTIAL") {
            disallowed = roundNum(Math.max(0.0, amount) * ratio, 2);
            allowable = roundNum(amount - disallowed, 2);
          } else if (cat === "ALLOWABLE_INDIRECT") {
            disallowed = 0.0;
            allowable = roundNum(amount, 2);
          }
          return Object.assign({}, entry, {
            category: cat,
            rule_id: rule.id,
            far_citation: rule.far_citation,
            rule_title: rule.title,
            disallow_ratio: ratio,
            disallowed_amount: disallowed,
            allowable_indirect_amount: allowable,
            rationale: rule.rationale
          });
        }
      }
    }

    const directPrefixes = hints.direct_cost_prefixes || [];
    if (firstDigit && directPrefixes.indexOf(firstDigit) !== -1) {
      return Object.assign({}, entry, {
        category: "DIRECT_PROJECT_COST",
        rule_id: "FALLBACK_5XXX_DIRECT_COST",
        far_citation: "FAR 31.202",
        rule_title: "Unmapped 5xxx Direct Project Cost (Excluded from Indirect Pool)",
        disallow_ratio: 0.0,
        disallowed_amount: 0.0,
        allowable_indirect_amount: 0.0,
        rationale: "5xxx cost-of-services account defaulted to Direct Project Cost; verify not Direct Labor."
      });
    }

    return Object.assign({}, entry, {
      category: "ALLOWABLE_INDIRECT",
      rule_id: "FALLBACK_ALLOWABLE_INDIRECT",
      far_citation: "FAR 31.203 (Verify Allowability)",
      rule_title: "General Indirect Expense (Default Allowable — Verify Detail)",
      disallow_ratio: 0.0,
      disallowed_amount: 0.0,
      allowable_indirect_amount: roundNum(amount, 2),
      rationale: "No FAR 31.205 unallowable keyword matched; included in allowable indirect pool pending GL detail check."
    });
  }

  function evaluateExecComp(execCompAnon, constants, taxYear, ncmThreshold) {
    const ecCfg = constants.executive_compensation;
    const statutoryCap = taxYear === 2025
      ? Number(ecCfg.cy_2025_statutory_cap_usd)
      : Number(ecCfg.cy_2026_statutory_cap_usd);

    const evaluations = [];
    let totalStatutoryDisallowance = 0.0;
    const ncmFlags = [];

    (execCompAnon || []).forEach(function (item, idx) {
      const role = String((item && item.role) || ("Executive Role #" + (idx + 1))).trim();
      const amt = Number((item && item.amount) || 0.0);
      const excess = roundNum(Math.max(0.0, amt - statutoryCap), 2);
      totalStatutoryDisallowance = roundNum(totalStatutoryDisallowance + excess, 2);
      const ncmFlagged = amt > ncmThreshold;

      evaluations.push({
        role: role,
        total_compensation_usd: roundNum(amt, 2),
        statutory_cap_usd: statutoryCap,
        statutory_excess_disallowed_usd: excess,
        far_citation: "FAR 31.205-6(p)",
        ncm_threshold_usd: ncmThreshold,
        ncm_reasonableness_review_required: ncmFlagged
      });

      if (ncmFlagged) {
        ncmFlags.push({
          role: role,
          total_compensation_usd: roundNum(amt, 2),
          screening_threshold_usd: ncmThreshold,
          far_citation: "FAR 31.205-6(b)",
          message:
            "Anonymous role '" + role + "' (" + formatUsd(roundNum(amt, 2)) + ") exceeds configurable " +
            "NCM reasonableness screening threshold (" + formatUsd(ncmThreshold) + "); " +
            "benchmark against official AASHTO NCM revenue-tier table during workpaper prep."
        });
      }
    });

    return {
      tax_year: taxYear,
      statutory_cap_usd: statutoryCap,
      ncm_screening_threshold_usd: ncmThreshold,
      total_statutory_disallowance_usd: totalStatutoryDisallowance,
      roles_evaluated: evaluations,
      ncm_reasonableness_flags: ncmFlags
    };
  }

  function buildComplianceNotices(jurisdiction, constants) {
    const pc = constants.pricing_and_compliance;
    let jurNotice;
    if (jurisdiction === "FL_FDOT_UNDER_1M") {
      jurNotice = constants.fdot_under_1m_self_cert.disclosure;
    } else if (jurisdiction === "NC_NCDOT_UNDER_500K") {
      jurNotice = constants.ncdot_under_500k_self_cert.audit_right_notice;
    } else {
      jurNotice = constants.track_b_pre_audit.disclosure;
    }
    return {
      criminal_liability_18_usc_1020: pc.criminal_liability_warning,
      non_audit_non_attestation: pc.non_audit_disclaimer,
      fixed_fee_far_31_205_33:
        "FIXED NON-CONTINGENT FEE (" + formatUsdInt(pc.fixed_fee_usd) + "): " + pc.allowability_note,
      jurisdiction_disclosure: jurNotice
    };
  }

  function scanTrialBalance(csvText, options) {
    const opts = options || {};
    const constants = opts.constants || DEFAULT_CONSTANTS;
    const rules = opts.rules || DEFAULT_RULES;

    const jurisdiction = opts.jurisdiction || "FL_FDOT_UNDER_1M";
    const officeType = opts.office_type || "home";
    const directLaborBase = opts.direct_labor_base !== undefined ? opts.direct_labor_base : null;
    const netBookValueAssets = opts.net_book_value_assets !== undefined ? Number(opts.net_book_value_assets) : 0.0;
    const annualDotDl = opts.annual_dot_direct_labor_billings !== undefined ? opts.annual_dot_direct_labor_billings : null;
    const execCompAnon = opts.exec_comp_anon || null;
    const taxYear = opts.tax_year !== undefined ? Number(opts.tax_year) : 2026;
    const treasuryRate = opts.treasury_rate !== undefined ? opts.treasury_rate : null;
    const ncmTierThreshold = opts.ncm_tier_threshold !== undefined ? opts.ncm_tier_threshold : null;
    const piiMode = opts.pii_mode || "refuse";
    const includeReviewReserves = opts.include_review_reserves !== undefined ? Boolean(opts.include_review_reserves) : true;

    if (VALID_JURISDICTIONS.indexOf(jurisdiction) === -1) {
      throw new Error("Unsupported jurisdiction: " + jurisdiction);
    }
    if (VALID_OFFICE_TYPES.indexOf(officeType) === -1) {
      throw new Error("Unsupported office_type: " + officeType);
    }
    if (VALID_PII_MODES.indexOf(piiMode) === -1) {
      throw new Error("Unsupported pii_mode: " + piiMode);
    }

    let rows = parseCsv(csvText);
    let layout = detectCsvLayout(rows);
    const piiFindings = scanPiiInRows(rows, layout.header_idx, rules, execCompAnon);

    if (piiFindings.length > 0 && piiMode === "refuse") {
      return {
        ok: false,
        status: "REFUSED_PII",
        message:
          "PII GUARDRAIL TRIGGERED: Processing refused because potential personally identifiable " +
          "information (SSN, EIN, email, or employee identity column) was detected. Remove all " +
          "names/SSNs/EINs/emails and upload account numbers and amounts only.",
        pii_findings: piiFindings,
        pii_redacted_count: 0,
        compliance_notices: buildComplianceNotices(jurisdiction, constants)
      };
    }

    let piiRedactedCount = 0;
    if (piiFindings.length > 0 && piiMode === "redact") {
      const redacted = redactPiiInRows(rows, layout.header_idx, rules);
      rows = redacted.rows;
      piiRedactedCount = redacted.redactions;
      layout = detectCsvLayout(rows);
    }

    const parsedEntries = parseTrialBalanceRows(rows, layout);
    const classifiedLines = parsedEntries.map(function (entry) { return classifyLine(entry, rules); });

    const effNcmThreshold = (ncmTierThreshold !== null && Number(ncmTierThreshold) > 0)
      ? Number(ncmTierThreshold)
      : Number(constants.executive_compensation.ncm_reasonableness.default_review_threshold_usd);
    const execCompResult = evaluateExecComp(execCompAnon, constants, taxYear, effNcmThreshold);

    if (execCompResult.total_statutory_disallowance_usd > 0) {
      classifiedLines.push({
        row_number: 0,
        account_code: "ADJ-EXEC-6P",
        account_name: "Statutory Exec Comp Cap Adjustment (CY " + taxYear + " Cap " + formatUsdInt(execCompResult.statutory_cap_usd) + ")",
        account_type: "Adjustment",
        amount: execCompResult.total_statutory_disallowance_usd,
        category: "EXPRESSLY_UNALLOWABLE",
        rule_id: "FAR_31_205_6P_STATUTORY_CAP_SYNTHETIC",
        far_citation: "FAR 31.205-6(p)",
        rule_title: "Excess Compensation Above OFPP Statutory Benchmark",
        disallow_ratio: 1.0,
        disallowed_amount: execCompResult.total_statutory_disallowance_usd,
        allowable_indirect_amount: 0.0,
        rationale:
          "Aggregate compensation exceeding CY " + taxYear + " statutory cap of " +
          formatUsdInt(execCompResult.statutory_cap_usd) + " per employee is expressly unallowable."
      });
    }

    function sumBy(arr, fn) {
      let s = 0.0;
      for (let i = 0; i < arr.length; i++) s += fn(arr[i]);
      return roundNum(s, 2);
    }

    const detectedDirectLabor = sumBy(
      classifiedLines.filter(function (l) { return l.category === "DIRECT_LABOR_BASE"; }),
      function (l) { return l.amount; }
    );
    const directProjectCostTotal = sumBy(
      classifiedLines.filter(function (l) { return l.category === "DIRECT_PROJECT_COST"; }),
      function (l) { return l.amount; }
    );
    const excludedNonOperatingTotal = sumBy(
      classifiedLines.filter(function (l) { return l.category === "EXCLUDED_NON_OPERATING"; }),
      function (l) { return l.amount; }
    );

    const glIndirectLines = classifiedLines.filter(function (l) {
      return (
        (l.category === "ALLOWABLE_INDIRECT" ||
          l.category === "EXPRESSLY_UNALLOWABLE" ||
          l.category === "REVIEW_REQUIRED_PARTIAL") &&
        l.rule_id !== "FAR_31_205_6P_STATUTORY_CAP_SYNTHETIC"
      );
    });
    const rawIndirectPool = sumBy(glIndirectLines, function (l) { return l.amount; });

    const expresslyUnallowableTotal = sumBy(
      classifiedLines.filter(function (l) { return l.category === "EXPRESSLY_UNALLOWABLE"; }),
      function (l) { return l.disallowed_amount; }
    );
    const reviewRequiredGrossTotal = sumBy(
      classifiedLines.filter(function (l) { return l.category === "REVIEW_REQUIRED_PARTIAL"; }),
      function (l) { return l.amount; }
    );
    const reviewRequiredDisallowedTotal = includeReviewReserves
      ? sumBy(
          classifiedLines.filter(function (l) { return l.category === "REVIEW_REQUIRED_PARTIAL"; }),
          function (l) { return l.disallowed_amount; }
        )
      : 0.0;

    const totalFar31Disallowed = roundNum(expresslyUnallowableTotal + reviewRequiredDisallowedTotal, 2);
    const scrubbedIndirectPool = roundNum(Math.max(0.0, rawIndirectPool - totalFar31Disallowed), 2);
    const bestCaseIndirectPool = roundNum(Math.max(0.0, rawIndirectPool - expresslyUnallowableTotal), 2);

    let effDlBase;
    let dlSource;
    if (directLaborBase !== null && Number(directLaborBase) > 0) {
      effDlBase = roundNum(Number(directLaborBase), 2);
      dlSource = "user_override";
    } else {
      effDlBase = detectedDirectLabor;
      dlSource = "trial_balance_detected";
    }

    const unadjustedIcr = effDlBase > 0 ? rawIndirectPool / effDlBase : 0.0;
    const scrubbedIcr = effDlBase > 0 ? scrubbedIndirectPool / effDlBase : 0.0;
    const bestCaseIcr = effDlBase > 0 ? bestCaseIndirectPool / effDlBase : 0.0;

    const fdotCaps = constants.fdot_under_1m_self_cert.statewide_average_caps;
    let icrCap = null;
    let effectiveIcr = scrubbedIcr;
    let truncatedByFdotCap = false;
    let fdotCapReduction = 0.0;
    let directExpenseCap = null;

    if (jurisdiction === "FL_FDOT_UNDER_1M") {
      icrCap = Number(officeType === "home" ? fdotCaps.home_office_icr : fdotCaps.field_office_icr);
      effectiveIcr = Math.min(scrubbedIcr, icrCap);
      truncatedByFdotCap = scrubbedIcr > icrCap;
      fdotCapReduction = Math.max(0.0, scrubbedIcr - icrCap);
      directExpenseCap = Number(
        officeType === "home" ? fdotCaps.home_office_direct_expense : fdotCaps.field_office_direct_expense
      );
    }

    const effTreasuryRate = (treasuryRate !== null && Number(treasuryRate) > 0)
      ? Number(treasuryRate)
      : Number(constants.treasury_prompt_payment_fccm.default_rate);
    const nbv = Math.max(0.0, Number(netBookValueAssets || 0.0));
    const fccmCostUsd = roundNum(nbv * effTreasuryRate, 2);
    const rawFccmRate = (effDlBase > 0 && nbv > 0) ? (fccmCostUsd / effDlBase) : 0.0;

    let fccmCap = null;
    let effectiveFccmRate = rawFccmRate;
    let fccmTruncatedByFdotCap = false;
    if (jurisdiction === "FL_FDOT_UNDER_1M") {
      fccmCap = Number(fdotCaps.fccm);
      effectiveFccmRate = Math.min(rawFccmRate, fccmCap);
      fccmTruncatedByFdotCap = rawFccmRate > fccmCap;
    }

    const safeHarborRate = Number(constants.fhwa_safe_harbor.rate);
    const netIcrUplift = effectiveIcr - safeHarborRate;
    const totalEffectiveRate = effectiveIcr + effectiveFccmRate;
    const totalUpliftWithFccm = totalEffectiveRate - safeHarborRate;

    let projDlBase;
    let projDlSource;
    if (annualDotDl !== null && Number(annualDotDl) > 0) {
      projDlBase = roundNum(Number(annualDotDl), 2);
      projDlSource = "user_input";
    } else {
      projDlBase = effDlBase;
      projDlSource = "direct_labor_base_proxy";
    }

    const projected12moIcrUpliftUsd = roundNum(netIcrUplift * projDlBase, 2);
    const projected12moFccmUsd = roundNum(effectiveFccmRate * projDlBase, 2);
    const projected12moTotalUpliftUsd = roundNum(totalUpliftWithFccm * projDlBase, 2);
    const fixedFeeUsd = Number(constants.pricing_and_compliance.fixed_fee_usd);
    const projected12moNetBenefitUsd = roundNum(projected12moTotalUpliftUsd - fixedFeeUsd, 2);
    const feePaybackMultiple = projected12moTotalUpliftUsd > 0
      ? roundNum(projected12moTotalUpliftUsd / fixedFeeUsd, 2)
      : 0.0;

    const warnings = [];
    if (effDlBase <= 0) {
      warnings.push(
        "Direct Labor Base is $0.00. Provide a Direct Labor account in the CSV or pass direct_labor_base."
      );
    }
    if (truncatedByFdotCap) {
      const officeTitle = officeType.charAt(0).toUpperCase() + officeType.slice(1);
      warnings.push(
        "FDOT STATEWIDE CAP APPLIED: Scrubbed ICR (" + roundNum(scrubbedIcr * 100, 2).toFixed(2) + "%) exceeds " +
        "FDOT Form 375-030-51 " + officeTitle + " Office cap (" + roundNum(icrCap * 100, 2).toFixed(2) + "% effective " +
        "June 26, 2026) and has been truncated to " + roundNum(effectiveIcr * 100, 2).toFixed(2) + "%."
      );
    }
    if (fccmTruncatedByFdotCap) {
      warnings.push(
        "FDOT FCCM CAP APPLIED: Computed FCCM (" + roundNum(rawFccmRate * 100, 2).toFixed(2) + "%) exceeds " +
        "FDOT statewide cap (" + roundNum(fccmCap * 100, 2).toFixed(2) + "%) and has been truncated."
      );
    }
    if (jurisdiction === "NC_NCDOT_UNDER_500K") {
      warnings.push(constants.ncdot_under_500k_self_cert.audit_right_notice);
    }
    if (jurisdiction === "TRACK_B_PRE_AUDIT") {
      warnings.push(constants.track_b_pre_audit.disclosure);
    }
    if (piiRedactedCount > 0) {
      warnings.push("PII guardrail redacted " + piiRedactedCount + " sensitive column(s)/cell(s) before processing.");
    }

    return {
      ok: true,
      status: "COMPLETED",
      engine_version: "1.0.0",
      inputs: {
        jurisdiction: jurisdiction,
        office_type: officeType,
        tax_year: taxYear,
        detected_csv_format: layout.detected_format,
        rows_parsed: parsedEntries.length,
        direct_labor_base_source: dlSource,
        projection_dl_source: projDlSource,
        include_review_reserves: includeReviewReserves,
        pii_mode: piiMode,
        pii_redacted_count: piiRedactedCount
      },
      pools: {
        direct_labor_base_usd: effDlBase,
        detected_direct_labor_usd: detectedDirectLabor,
        direct_project_cost_excluded_usd: directProjectCostTotal,
        excluded_non_operating_usd: excludedNonOperatingTotal,
        raw_indirect_pool_usd: rawIndirectPool,
        expressly_unallowable_disallowed_usd: expresslyUnallowableTotal,
        review_required_gross_usd: reviewRequiredGrossTotal,
        review_required_disallowed_usd: reviewRequiredDisallowedTotal,
        total_far31_disallowed_usd: totalFar31Disallowed,
        scrubbed_indirect_pool_usd: scrubbedIndirectPool,
        best_case_indirect_pool_usd: bestCaseIndirectPool
      },
      rates: {
        safe_harbor_pct: roundNum(safeHarborRate * 100, 2),
        unadjusted_icr_pct: roundNum(unadjustedIcr * 100, 2),
        scrubbed_icr_pct: roundNum(scrubbedIcr * 100, 2),
        best_case_if_review_substantiated_icr_pct: roundNum(bestCaseIcr * 100, 2),
        effective_claimable_icr_pct: roundNum(effectiveIcr * 100, 2),
        fdot_icr_cap_pct: icrCap !== null ? roundNum(icrCap * 100, 2) : null,
        fdot_direct_expense_cap_pct: directExpenseCap !== null ? roundNum(directExpenseCap * 100, 2) : null,
        truncated_by_fdot_cap: truncatedByFdotCap,
        fdot_cap_reduction_pct: roundNum(fdotCapReduction * 100, 2),
        net_icr_uplift_vs_safe_harbor_pct: roundNum(netIcrUplift * 100, 2),
        treasury_rate_used_pct: roundNum(effTreasuryRate * 100, 4),
        raw_fccm_rate_pct: roundNum(rawFccmRate * 100, 2),
        effective_fccm_rate_pct: roundNum(effectiveFccmRate * 100, 2),
        fdot_fccm_cap_pct: fccmCap !== null ? roundNum(fccmCap * 100, 2) : null,
        fccm_truncated_by_fdot_cap: fccmTruncatedByFdotCap,
        total_effective_rate_with_fccm_pct: roundNum(totalEffectiveRate * 100, 2),
        total_uplift_with_fccm_vs_safe_harbor_pct: roundNum(totalUpliftWithFccm * 100, 2)
      },
      fccm: {
        net_book_value_assets_usd: roundNum(nbv, 2),
        treasury_rate_used_pct: roundNum(effTreasuryRate * 100, 4),
        treasury_h1_2026_pct: constants.treasury_prompt_payment_fccm.h1_2026_rate_pct,
        treasury_h2_2026_pct: constants.treasury_prompt_payment_fccm.h2_2026_rate_pct,
        computed_fccm_cost_usd: fccmCostUsd,
        raw_fccm_rate_pct: roundNum(rawFccmRate * 100, 2),
        effective_fccm_rate_pct: roundNum(effectiveFccmRate * 100, 2),
        truncated_by_fdot_cap: fccmTruncatedByFdotCap
      },
      projection_12mo: {
        annual_dot_direct_labor_base_usd: projDlBase,
        projected_12mo_icr_uplift_usd: projected12moIcrUpliftUsd,
        projected_12mo_fccm_recovery_usd: projected12moFccmUsd,
        projected_12mo_total_uplift_usd: projected12moTotalUpliftUsd,
        fixed_fee_usd: fixedFeeUsd,
        fee_type: constants.pricing_and_compliance.fee_type,
        fee_allowability_citation: constants.pricing_and_compliance.allowability_citation,
        projected_12mo_net_benefit_after_fee_usd: projected12moNetBenefitUsd,
        fee_payback_multiple: feePaybackMultiple
      },
      executive_compensation: execCompResult,
      warnings: warnings,
      compliance_notices: buildComplianceNotices(jurisdiction, constants),
      lines: classifiedLines,
      regulatory_sources: {
        fhwa_safe_harbor: constants.fhwa_safe_harbor.source_urls,
        fdot: constants.fdot_under_1m_self_cert.source_urls,
        ncdot: constants.ncdot_under_500k_self_cert.source_urls,
        exec_comp: constants.executive_compensation.source_urls,
        treasury_fccm: constants.treasury_prompt_payment_fccm.source_urls,
        far_31_205_33: constants.pricing_and_compliance.source_urls
      }
    };
  }

  function csvCell(val) {
    const s = String(val === null || val === undefined ? "" : val);
    if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1 || s.indexOf("\r") !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function generateTraceabilityCsv(result) {
    const header = [
      "Row",
      "Account_Code",
      "Account_Name",
      "Account_Type",
      "Trial_Balance_Amount_USD",
      "Category",
      "FAR_Citation",
      "Rule_ID",
      "Disallow_Ratio",
      "Disallowed_Amount_USD",
      "Allowable_Indirect_USD",
      "Rationale"
    ];
    const linesOut = [header.join(",")];
    (result.lines || []).forEach(function (line) {
      const row = [
        line.row_number,
        line.account_code,
        line.account_name,
        line.account_type || "",
        Number(line.amount).toFixed(2),
        line.category,
        line.far_citation,
        line.rule_id,
        Number(line.disallow_ratio).toFixed(2),
        Number(line.disallowed_amount).toFixed(2),
        Number(line.allowable_indirect_amount).toFixed(2),
        line.rationale
      ];
      linesOut.push(row.map(csvCell).join(","));
    });
    return linesOut.join("\n") + "\n";
  }

  function generateWorkpaperHtml(result) {
    if (!result || !result.ok) {
      return (
        "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
        "<title>Pre-Scan Refused — PII Guardrail</title></head><body>" +
        "<h1>Pre-Scan Refused</h1><p>" + escapeHtml((result && result.message) || "") + "</p></body></html>"
      );
    }

    const rates = result.rates;
    const pools = result.pools;
    const proj = result.projection_12mo;
    const fccm = result.fccm;
    const notices = result.compliance_notices;
    const ec = result.executive_compensation;
    const inp = result.inputs;
    const officeTitle = inp.office_type.charAt(0).toUpperCase() + inp.office_type.slice(1);

    function fmtPct(v) {
      return (v === null || v === undefined) ? "N/A" : Number(v).toFixed(2) + "%";
    }

    let fdotBanner = "";
    if (rates.truncated_by_fdot_cap) {
      fdotBanner =
        "<div class='alert alert-warn'>" +
        "<strong>FDOT Statewide Average Cap Truncation Triggered:</strong> " +
        "Scrubbed ICR (" + fmtPct(rates.scrubbed_icr_pct) + ") exceeds the FDOT Form 375-030-51 " +
        escapeHtml(officeTitle) + " Office cap (" + fmtPct(rates.fdot_icr_cap_pct) + ", " +
        "effective June 26, 2026) and is capped at <strong>" + fmtPct(rates.effective_claimable_icr_pct) + "</strong>." +
        "</div>";
    }

    let ncmRows = "";
    if (ec.roles_evaluated && ec.roles_evaluated.length > 0) {
      const parts = ec.roles_evaluated.map(function (r) {
        const flagTxt = r.ncm_reasonableness_review_required
          ? "FLAG: Benchmark vs AASHTO NCM"
          : "Within Screening Threshold";
        return (
          "<tr>" +
          "<td>" + escapeHtml(r.role) + "</td>" +
          "<td class='num'>" + formatUsd(r.total_compensation_usd) + "</td>" +
          "<td class='num'>" + formatUsd(r.statutory_cap_usd) + "</td>" +
          "<td class='num'>" + formatUsd(r.statutory_excess_disallowed_usd) + "</td>" +
          "<td>" + escapeHtml(flagTxt) + "</td>" +
          "</tr>"
        );
      });
      ncmRows =
        "<h2>Anonymous Executive Compensation &amp; NCM Screening Schedule (FAR 31.205-6(p) / 31.205-6(b))</h2>" +
        "<table><thead><tr><th>Anonymous Role</th><th class='num'>Total Comp</th>" +
        "<th class='num'>Statutory Cap</th><th class='num'>Excess Disallowed</th><th>NCM Reasonableness Status</th></tr></thead>" +
        "<tbody>" + parts.join("") + "</tbody></table>";
    }

    const lineRows = result.lines.map(function (ln) {
      let cls = "";
      if (ln.category === "EXPRESSLY_UNALLOWABLE") cls = "row-unallowable";
      else if (ln.category === "REVIEW_REQUIRED_PARTIAL") cls = "row-review";
      else if (ln.category === "DIRECT_LABOR_BASE") cls = "row-dl";
      return (
        "<tr class='" + cls + "'>" +
        "<td>" + escapeHtml(ln.account_code) + "</td>" +
        "<td>" + escapeHtml(ln.account_name) + "</td>" +
        "<td>" + escapeHtml(ln.category) + "</td>" +
        "<td>" + escapeHtml(ln.far_citation) + "</td>" +
        "<td class='num'>" + formatUsd(ln.amount) + "</td>" +
        "<td class='num'>" + formatUsd(ln.disallowed_amount) + "</td>" +
        "<td class='num'>" + formatUsd(ln.allowable_indirect_amount) + "</td>" +
        "<td>" + escapeHtml(ln.rationale) + "</td>" +
        "</tr>"
      );
    }).join("");

    return [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8" />',
      "<title>FAR Part 31 / NCM / FCCM Anonymous Pre-Scan Workpaper</title>",
      "<style>",
      '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; margin: 28px; line-height: 1.45; }',
      "  h1 { font-size: 20px; margin-bottom: 4px; }",
      "  h2 { font-size: 15px; margin-top: 22px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }",
      "  .meta { font-size: 12px; color: #4b5563; margin-bottom: 14px; }",
      "  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }",
      "  .kpi { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; background: #f9fafb; }",
      "  .kpi .label { font-size: 11px; color: #4b5563; text-transform: uppercase; }",
      "  .kpi .value { font-size: 18px; font-weight: 700; margin-top: 3px; }",
      "  .alert { padding: 10px 12px; border-radius: 6px; margin: 10px 0; font-size: 12.5px; }",
      "  .alert-danger { background: #fef2f2; border: 1px solid #ef4444; color: #7f1d1d; }",
      "  .alert-warn { background: #fffbeb; border: 1px solid #f59e0b; color: #78350f; }",
      "  .alert-info { background: #eff6ff; border: 1px solid #3b82f6; color: #1e3a8a; }",
      "  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 8px; }",
      "  th, td { border: 1px solid #d1d5db; padding: 5px 7px; text-align: left; vertical-align: top; }",
      "  th { background: #f3f4f6; font-weight: 600; }",
      "  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }",
      "  .row-unallowable { background: #fef2f2; }",
      "  .row-review { background: #fffbeb; }",
      "  .row-dl { background: #ecfdf5; }",
      "  @media print { body { margin: 12px; } }",
      "</style>",
      "</head>",
      "<body>",
      "  <h1>FAR Part 31 / NCM / FCCM Anonymous Trial Balance Pre-Scan Workpaper</h1>",
      '  <div class="meta">',
      "    Jurisdiction: <strong>" + escapeHtml(inp.jurisdiction) + "</strong> |",
      "    Office Type: <strong>" + escapeHtml(officeTitle) + "</strong> |",
      "    Tax Year: <strong>" + inp.tax_year + "</strong> |",
      "    Detected CSV Format: <strong>" + escapeHtml(inp.detected_csv_format) + "</strong> |",
      "    Zero-PII Anonymous Mode",
      "  </div>",
      '  <div class="alert alert-danger"><strong>MANDATORY FEDERAL COMPLIANCE WARNING:</strong> ' + escapeHtml(notices.criminal_liability_18_usc_1020) + "</div>",
      '  <div class="alert alert-info"><strong>NON-AUDIT / NON-ATTESTATION DISCLOSURE:</strong> ' + escapeHtml(notices.non_audit_non_attestation) + "</div>",
      '  <div class="alert alert-info"><strong>JURISDICTION RULE NOTICE:</strong> ' + escapeHtml(notices.jurisdiction_disclosure) + "</div>",
      fdotBanner,
      '  <div class="kpi-grid">',
      '    <div class="kpi"><div class="label">Unadjusted ICR</div><div class="value">' + fmtPct(rates.unadjusted_icr_pct) + "</div></div>",
      '    <div class="kpi"><div class="label">Scrubbed FAR 31 ICR</div><div class="value">' + fmtPct(rates.scrubbed_icr_pct) + "</div></div>",
      '    <div class="kpi"><div class="label">Effective Claimable ICR</div><div class="value">' + fmtPct(rates.effective_claimable_icr_pct) + "</div></div>",
      '    <div class="kpi"><div class="label">Net Uplift vs 110% Safe Harbor</div><div class="value">' + fmtPct(rates.net_icr_uplift_vs_safe_harbor_pct) + "</div></div>",
      "  </div>",
      "  <h2>Cost Pool, FCCM &amp; 12-Month Margin Projection</h2>",
      "  <table><tbody>",
      '    <tr><td>Direct Labor Allocation Base</td><td class="num">' + formatUsd(pools.direct_labor_base_usd) + "</td></tr>",
      '    <tr><td>Raw Indirect Cost Pool (Pre-Scrub)</td><td class="num">' + formatUsd(pools.raw_indirect_pool_usd) + "</td></tr>",
      '    <tr><td>Less: Expressly Unallowable Costs (FAR 31.205-X)</td><td class="num">' + formatUsd(-pools.expressly_unallowable_disallowed_usd) + "</td></tr>",
      '    <tr><td>Less: Review-Required Partial Reserves</td><td class="num">' + formatUsd(-pools.review_required_disallowed_usd) + "</td></tr>",
      '    <tr><td><strong>Scrubbed FAR Part 31 Net Indirect Pool</strong></td><td class="num"><strong>' + formatUsd(pools.scrubbed_indirect_pool_usd) + "</strong></td></tr>",
      '    <tr><td>FCCM Effective Rate (Treasury ' + Number(fccm.treasury_rate_used_pct).toFixed(4) + "% on NBV " + formatUsd(fccm.net_book_value_assets_usd) + ')</td><td class="num">' + fmtPct(rates.effective_fccm_rate_pct) + "</td></tr>",
      '    <tr><td>Projected 12-Month Total Uplift vs 110% Safe Harbor (on ' + formatUsd(proj.annual_dot_direct_labor_base_usd) + ' DOT DL)</td><td class="num"><strong>' + formatUsd(proj.projected_12mo_total_uplift_usd) + "</strong></td></tr>",
      '    <tr><td>Fixed Non-Contingent Workpaper Prep Fee (' + escapeHtml(proj.fee_allowability_citation) + ')</td><td class="num">' + formatUsd(proj.fixed_fee_usd) + "</td></tr>",
      '    <tr><td><strong>Projected 12-Month Net Benefit After Fixed Fee</strong></td><td class="num"><strong>' + formatUsd(proj.projected_12mo_net_benefit_after_fee_usd) + "</strong></td></tr>",
      "  </tbody></table>",
      '  <div class="alert alert-info">' + escapeHtml(notices.fixed_fee_far_31_205_33) + "</div>",
      ncmRows,
      "  <h2>Line-by-Line FAR Part 31 Adjustment Traceability Schedule</h2>",
      "  <table><thead><tr>",
      "    <th>Code</th><th>Account Name</th><th>Category</th><th>FAR Citation</th>",
      '    <th class="num">TB Amount</th><th class="num">Disallowed</th><th class="num">Allowable Indirect</th><th>Rationale</th>',
      "  </tr></thead><tbody>",
      lineRows,
      "  </tbody></table>",
      "</body></html>"
    ].join("\n");
  }

  return {
    DEFAULT_CONSTANTS: DEFAULT_CONSTANTS,
    DEFAULT_RULES: DEFAULT_RULES,
    VALID_JURISDICTIONS: VALID_JURISDICTIONS,
    VALID_OFFICE_TYPES: VALID_OFFICE_TYPES,
    parseCsv: parseCsv,
    detectCsvLayout: detectCsvLayout,
    scanPiiInRows: scanPiiInRows,
    scanTrialBalance: scanTrialBalance,
    generateTraceabilityCsv: generateTraceabilityCsv,
    generateWorkpaperHtml: generateWorkpaperHtml
  };
}));

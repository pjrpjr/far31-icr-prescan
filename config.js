/**
 * Configuration for the 15-Second Anonymous FAR Part 31 Pre-Scan Landing Page.
 * Update CONTACT_EMAIL once the isolated AgentMail inbox is provisioned.
 */
window.PRESCAN_CONFIG = {
  CONTACT_EMAIL: "w5gbs570gu-csa@agentmail.to",
  SENDER_IDENTITY: "DOT FAR 31 Pre-Scan Support (Independent Non-CPA Financial Data Compilation Service)",
  FIXED_FEE_USD: 1695,
  SAFE_HARBOR_RATE: 110.0,
  FDOT_CAPS: {
    home: 173.36,
    field: 129.20,
    fccm: 0.81,
    homeDirect: 6.35,
    fieldDirect: 10.79
  },
  NCDOT_THRESHOLD_USD: 500000,
  FDOT_THRESHOLD_USD: 1000000,
  SAMPLES: {
    fl: {
      id: "fl",
      label: "QuickBooks FL Sample",
      path: "engine/samples/qb_small_ae_fl.csv",
      jurisdiction: "FL_FDOT_UNDER_1M",
      office_type: "home",
      annual_dot_direct_labor_billings: 320000,
      net_book_value_assets: 145000
    },
    nc: {
      id: "nc",
      label: "Ajera NC Sample",
      path: "engine/samples/ajera_civil_nc.csv",
      jurisdiction: "NC_NCDOT_UNDER_500K",
      office_type: "home",
      annual_dot_direct_labor_billings: 210000,
      net_book_value_assets: 140000
    },
    track_b: {
      id: "track_b",
      label: "BQE CORE Track B Sample",
      path: "engine/samples/bqe_core_track_b.csv",
      jurisdiction: "TRACK_B_PRE_AUDIT",
      office_type: "home",
      annual_dot_direct_labor_billings: 850000,
      net_book_value_assets: 480000
    }
  }
};

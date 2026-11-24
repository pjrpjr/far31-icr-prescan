(function () {
  "use strict";

  const CFG = window.PRESCAN_CONFIG || {};

  const state = {
    jurisdiction: "FL_FDOT_UNDER_1M",
    officeType: "home",
    csvText: "",
    fileName: "",
    filter: "all",
    lastResult: null
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function formatCurrency(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "--";
    const sign = num < 0 ? "-" : "";
    return sign + "$" + Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function formatCurrencyExact(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "--";
    const sign = num < 0 ? "-" : "";
    return sign + "$" + Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatPct(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "--";
    return num.toFixed(2) + "%";
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initElements() {
    els.modeCards = document.querySelectorAll(".mode-card");
    els.officeHome = $("btn-office-home");
    els.officeField = $("btn-office-field");
    els.sampleFl = $("sample-fl");
    els.sampleNc = $("sample-nc");
    els.sampleTrackB = $("sample-track-b");
    els.dropzone = $("csv-dropzone");
    els.fileInput = $("csv-file-input");
    els.activeFilePill = $("active-file-pill");

    els.inputDirectLabor = $("input-direct-labor");
    els.inputAssetNbv = $("input-asset-nbv");
    els.inputDotBillings = $("input-dot-billings");
    els.inputExecComp = $("input-exec-comp");

    els.alertPii = $("alert-pii");
    els.alertFdotCap = $("alert-fdot-cap");
    els.alertNcdotRight = $("alert-ncdot-right");
    els.alertTrackB = $("alert-track-b");

    els.kpiSafeHarbor = $("kpi-safe-harbor");
    els.kpiScrubbedIcr = $("kpi-scrubbed-icr");
    els.kpiUnadjustedSub = $("kpi-unadjusted-sub");
    els.kpiEffectiveRate = $("kpi-effective-rate");
    els.kpiEffectiveSub = $("kpi-effective-sub");
    els.kpiUplift = $("kpi-uplift");
    els.kpiFccmSub = $("kpi-fccm-sub");

    els.filterTabs = document.querySelectorAll(".filter-tab");
    els.countAll = $("count-all");
    els.countFlagged = $("count-flagged");
    els.countAllowable = $("count-allowable");
    els.countDirect = $("count-direct");
    els.linesTbody = $("lines-tbody");

    els.btnDownloadCsv = $("btn-download-csv");
    els.btnDownloadHtml = $("btn-download-html");

    els.displayContactEmail = $("display-contact-email");
    els.footerContactEmail = $("footer-contact-email");
    els.displaySenderIdentity = $("display-sender-identity");
    els.ctaFirmName = $("cta-firm-name");
    els.ctaSenderRole = $("cta-sender-role");
    els.ctaPreviewBody = $("cta-preview-body");
    els.btnMailtoCta = $("btn-mailto-cta");
    els.btnCopyCta = $("btn-copy-cta");
    els.copyFeedback = $("copy-feedback");
  }

  function populateStaticConfig() {
    const email = CFG.CONTACT_EMAIL || "w5gbs570gu-csa@agentmail.to";
    if (els.displayContactEmail) els.displayContactEmail.textContent = email;
    if (els.footerContactEmail) els.footerContactEmail.textContent = email;
    if (els.displaySenderIdentity) {
      els.displaySenderIdentity.textContent =
        CFG.SENDER_IDENTITY || "DOT FAR 31 Pre-Scan Support (Independent Non-CPA Financial Data Compilation Service)";
    }
  }

  function setJurisdiction(mode) {
    state.jurisdiction = mode;
    els.modeCards.forEach((card) => {
      const cardMode = card.getAttribute("data-mode");
      const radio = card.querySelector("input[type='radio']");
      const isActive = cardMode === mode;
      card.classList.toggle("active", isActive);
      if (radio) radio.checked = isActive;
    });
    runScan();
  }

  function setOfficeType(office) {
    state.officeType = office;
    els.officeHome.classList.toggle("active", office === "home");
    els.officeField.classList.toggle("active", office === "field");
    runScan();
  }

  function setFilePill(name) {
    if (!name) {
      els.activeFilePill.classList.add("hidden");
      els.activeFilePill.textContent = "";
      return;
    }
    els.activeFilePill.textContent = "Loaded locally: " + name;
    els.activeFilePill.classList.remove("hidden");
  }

  async function loadSample(sampleKey) {
    const sample = CFG.SAMPLES && CFG.SAMPLES[sampleKey];
    if (!sample) return;
    try {
      const resp = await fetch(sample.path);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const text = await resp.text();
      state.csvText = text;
      state.fileName = sample.label + " (" + sample.path.split("/").pop() + ")";
      setFilePill(state.fileName);

      if (sample.annual_dot_direct_labor_billings != null) {
        els.inputDotBillings.value = sample.annual_dot_direct_labor_billings;
      }
      if (sample.net_book_value_assets != null) {
        els.inputAssetNbv.value = sample.net_book_value_assets;
      }
      els.inputDirectLabor.value = "";
      state.officeType = sample.office_type || "home";
      els.officeHome.classList.toggle("active", state.officeType === "home");
      els.officeField.classList.toggle("active", state.officeType === "field");
      setJurisdiction(sample.jurisdiction);
    } catch (err) {
      showErrorAlert("Could not load sample CSV (" + sample.path + "): " + err.message);
    }
  }

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      state.csvText = String(e.target.result || "");
      state.fileName = file.name;
      setFilePill(file.name);
      runScan();
    };
    reader.onerror = function () {
      showErrorAlert("Failed to read CSV file locally in browser.");
    };
    reader.readAsText(file);
  }

  function showErrorAlert(msg) {
    els.alertPii.innerHTML = "<strong>Pre-Scan Notice</strong>" + escapeHtml(msg);
    els.alertPii.classList.remove("hidden");
  }

  function collectParams() {
    const dlOverride = parseFloat(els.inputDirectLabor.value);
    const assetNbv = parseFloat(els.inputAssetNbv.value);
    const dotBillings = parseFloat(els.inputDotBillings.value);
    const execCompVal = parseFloat(els.inputExecComp.value);

    const params = {
      jurisdiction: state.jurisdiction,
      office_type: state.officeType,
      pii_mode: "refuse"
    };
    if (Number.isFinite(dlOverride) && dlOverride > 0) {
      params.direct_labor_base = dlOverride;
    }
    if (Number.isFinite(assetNbv) && assetNbv >= 0) {
      params.net_book_value_assets = assetNbv;
    }
    if (Number.isFinite(dotBillings) && dotBillings >= 0) {
      params.annual_dot_direct_labor_billings = dotBillings;
    }
    if (Number.isFinite(execCompVal) && execCompVal > 0) {
      params.exec_comp_anon = [{ role: "Principal / Executive", amount: execCompVal }];
    }
    return params;
  }

  function runScan() {
    els.alertPii.classList.add("hidden");
    els.alertFdotCap.classList.add("hidden");
    els.alertNcdotRight.classList.add("hidden");
    els.alertTrackB.classList.add("hidden");

    updateJurisdictionBanners(null);

    if (!state.csvText.trim()) {
      updateCtaMailto(null);
      return;
    }

    const eng = window.FAR31Engine;
    if (!eng || typeof eng.scanTrialBalance !== "function") {
      showErrorAlert("Browser-local FAR31Engine bundle is not loaded.");
      return;
    }

    let result;
    try {
      result = eng.scanTrialBalance(state.csvText, collectParams());
    } catch (err) {
      showErrorAlert(err.message || "Error running local FAR Part 31 engine.");
      return;
    }

    if (!result || result.ok === false || result.status === "REFUSED_PII") {
      const msg = (result && result.message) ||
        "PII detected in CSV. Please upload account numbers and amounts only (zero employee names, SSNs, EINs, or emails).";
      const details = (result && Array.isArray(result.pii_findings) && result.pii_findings.length)
        ? " (" + result.pii_findings.map((f) => f.detail || f.type).slice(0, 3).join("; ") + ")"
        : "";
      els.alertPii.innerHTML = "<strong>Browser-Local PII Guardrail Triggered</strong>" + escapeHtml(msg + details);
      els.alertPii.classList.remove("hidden");
      state.lastResult = null;
      els.linesTbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#b91c1c;padding:24px;">Processing blocked locally due to detected PII. Remove identity columns/SSNs and re-upload.</td></tr>';
      return;
    }

    state.lastResult = result;
    renderResult(result);
    updateJurisdictionBanners(result);
    updateCtaMailto(result);
  }

  function updateJurisdictionBanners(result) {
    const rates = result && result.rates ? result.rates : null;

    if (state.jurisdiction === "NC_NCDOT_UNDER_500K") {
      els.alertNcdotRight.innerHTML =
        "<strong>NCDOT &lt;$500,000 Self-Cert Disclosure</strong>" +
        "NCDOT permits self-submitted FAR rates on projected annual contracts under $500,000, but <strong>NCDOT explicitly reserves the right to request an independent CPA audit at any time</strong>.";
      els.alertNcdotRight.classList.remove("hidden");
    }

    if (state.jurisdiction === "TRACK_B_PRE_AUDIT") {
      const execNotes = (result && Array.isArray(result.warnings) && result.warnings.length)
        ? "<br><em>Engine Flag: " + escapeHtml(result.warnings[0]) + "</em>"
        : "";
      els.alertTrackB.innerHTML =
        "<strong>Track B Mandatory CPA Audit Pre-Cleanup (&gt;= $1M / Multi-State)</strong>" +
        "This pre-scan prepares your GL cost-pool schedule, NCM exec comp worksheet, FCCM computation, and AASHTO ICQ binder to cut external CPA billable hours. Your firm must still engage an independent CPA for required Yellow Book examination (this tool does not provide an audit report or CPA attestation)." +
        execNotes;
      els.alertTrackB.classList.remove("hidden");
    }

    if (state.jurisdiction === "FL_FDOT_UNDER_1M" && rates) {
      const cappedIcr = Boolean(rates.truncated_by_fdot_cap);
      const cappedFccm = Boolean(rates.fccm_truncated_by_fdot_cap);
      const capPct = state.officeType === "field" ? "129.20%" : "173.36%";
      if (cappedIcr || cappedFccm) {
        els.alertFdotCap.innerHTML =
          "<strong>FDOT Form 375-030-51 Statewide Cap Truncation Applied</strong>" +
          "Your scrubbed FAR 31 rate (" + escapeHtml(formatPct(rates.scrubbed_icr_pct)) + ") exceeds the FDOT statewide average cap for " +
          (state.officeType === "field" ? "Field Office (129.20%)" : "Home Office (173.36%)") +
          ". Effective claimable rate has been truncated to <strong>" + escapeHtml(formatPct(rates.effective_claimable_icr_pct)) + "</strong>" +
          (cappedFccm ? " and FCCM capped at <strong>0.81%</strong>" : "") +
          " (FDOT Form 375-030-51 caps: 173.36% Home / 129.20% Field / 0.81% FCCM).";
        els.alertFdotCap.classList.remove("hidden");
      } else {
        els.alertFdotCap.innerHTML =
          "<strong>FDOT Form 375-030-51 Cap Check (&lt;$1M)</strong>" +
          "Scrubbed rate (" + escapeHtml(formatPct(rates.scrubbed_icr_pct)) + ") is within the FDOT " + escapeHtml(capPct) +
          " statewide cap (173.36% Home / 129.20% Field / 0.81% FCCM), so no truncation was needed.";
        els.alertFdotCap.classList.remove("hidden");
      }
    }
  }

  function renderResult(res) {
    const rates = res.rates || {};
    const proj = res.projection_12mo || {};
    const safeHarbor = rates.safe_harbor_pct != null ? rates.safe_harbor_pct : 110.0;
    const scrubbed = rates.scrubbed_icr_pct;
    const unadj = rates.unadjusted_icr_pct;
    const eff = rates.effective_claimable_icr_pct;
    const spread = rates.net_icr_uplift_vs_safe_harbor_pct != null
      ? rates.net_icr_uplift_vs_safe_harbor_pct
      : (eff - safeHarbor);
    const fccmEff = rates.effective_fccm_rate_pct != null ? rates.effective_fccm_rate_pct : rates.raw_fccm_rate_pct;
    const uplift = proj.projected_12mo_total_uplift_usd != null
      ? proj.projected_12mo_total_uplift_usd
      : proj.projected_12mo_icr_uplift_usd;
    const netAfterFee = proj.projected_12mo_net_benefit_after_fee_usd != null
      ? proj.projected_12mo_net_benefit_after_fee_usd
      : (uplift != null ? uplift - (CFG.FIXED_FEE_USD || 1695) : null);

    els.kpiSafeHarbor.textContent = formatPct(safeHarbor);
    els.kpiScrubbedIcr.textContent = formatPct(scrubbed);
    els.kpiUnadjustedSub.textContent = "Unadjusted GL: " + formatPct(unadj);
    els.kpiEffectiveRate.textContent = formatPct(eff);
    els.kpiEffectiveSub.textContent =
      (spread >= 0 ? "+" : "") + Number(spread).toFixed(2) + " pts vs 110.00% Safe Harbor" +
      (rates.truncated_by_fdot_cap ? " (FDOT Capped)" : "");
    els.kpiUplift.textContent = formatCurrency(uplift);
    els.kpiFccmSub.textContent =
      "FCCM: " + formatPct(fccmEff) +
      (rates.fccm_truncated_by_fdot_cap ? " (0.81% cap)" : "") +
      " • Net of $1,695 fee: " + formatCurrency(netAfterFee);

    renderLinesTable(res.lines || []);
  }

  function classifyGroup(line) {
    const cat = String(line.category || "").toUpperCase();
    if (cat === "EXPRESSLY_UNALLOWABLE" || cat === "REVIEW_REQUIRED_PARTIAL") {
      return "flagged";
    }
    if (cat === "ALLOWABLE_INDIRECT") {
      return "allowable";
    }
    return "direct";
  }

  function formatCategoryLabel(cat) {
    const map = {
      EXPRESSLY_UNALLOWABLE: "Expressly Unallowable",
      REVIEW_REQUIRED_PARTIAL: "Review Required / Partial",
      ALLOWABLE_INDIRECT: "Allowable Indirect",
      DIRECT_LABOR_BASE: "Direct Labor Base",
      DIRECT_PROJECT_COST: "Direct Project Cost",
      EXCLUDED_NON_OPERATING: "Excluded Non-Operating"
    };
    return map[cat] || cat;
  }

  function badgeForLine(line) {
    const cat = String(line.category || "").toUpperCase();
    const label = formatCategoryLabel(cat);
    if (cat === "EXPRESSLY_UNALLOWABLE") {
      return '<span class="badge badge-red">' + escapeHtml(label) + "</span>";
    }
    if (cat === "REVIEW_REQUIRED_PARTIAL") {
      return '<span class="badge badge-amber">' + escapeHtml(label) + "</span>";
    }
    if (cat === "ALLOWABLE_INDIRECT") {
      return '<span class="badge badge-emerald">' + escapeHtml(label) + "</span>";
    }
    return '<span class="badge badge-slate">' + escapeHtml(label) + "</span>";
  }

  function renderLinesTable(lines) {
    let countFlagged = 0;
    let countAllowable = 0;
    let countDirect = 0;

    lines.forEach((line) => {
      const grp = classifyGroup(line);
      if (grp === "flagged") countFlagged++;
      else if (grp === "allowable") countAllowable++;
      else countDirect++;
    });

    els.countAll.textContent = String(lines.length);
    els.countFlagged.textContent = String(countFlagged);
    els.countAllowable.textContent = String(countAllowable);
    els.countDirect.textContent = String(countDirect);

    const visible = lines.filter((line) => {
      if (state.filter === "all") return true;
      return classifyGroup(line) === state.filter;
    });

    if (!visible.length) {
      els.linesTbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">No lines match the selected filter.</td></tr>';
      return;
    }

    const html = visible.map((line) => {
      const cat = String(line.category || "").toUpperCase();
      const rowCls = cat === "EXPRESSLY_UNALLOWABLE"
        ? "row-unallowable"
        : (cat === "REVIEW_REQUIRED_PARTIAL" ? "row-review" : "");
      const cit = line.far_citation || "—";
      const note = line.rationale || line.rule_title || "—";
      return (
        '<tr class="' + rowCls + '">' +
        '<td class="mono">' + escapeHtml(line.account_code || "") + "</td>" +
        "<td>" + escapeHtml(line.account_name || "") + "</td>" +
        '<td class="mono text-right">' + escapeHtml(formatCurrencyExact(line.amount)) + "</td>" +
        "<td>" + badgeForLine(line) + "</td>" +
        '<td class="mono">' + escapeHtml(cit) + "</td>" +
        "<td>" + escapeHtml(note) + "</td>" +
        "</tr>"
      );
    }).join("");

    els.linesTbody.innerHTML = html;
  }

  function triggerDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadTraceabilityCsv() {
    if (!state.lastResult) return;
    const eng = window.FAR31Engine;
    if (eng && typeof eng.generateTraceabilityCsv === "function") {
      const csvContent = eng.generateTraceabilityCsv(state.lastResult);
      triggerDownload("far31_traceability_trail.csv", csvContent, "text/csv;charset=utf-8;");
    }
  }

  function downloadHtmlWorkpaper() {
    if (!state.lastResult) return;
    const eng = window.FAR31Engine;
    if (eng && typeof eng.generateWorkpaperHtml === "function") {
      const htmlContent = eng.generateWorkpaperHtml(state.lastResult);
      triggerDownload("far31_workpaper_sample.html", htmlContent, "text/html;charset=utf-8;");
    }
  }

  function updateCtaMailto(result) {
    const email = CFG.CONTACT_EMAIL || "w5gbs570gu-csa@agentmail.to";
    const firm = (els.ctaFirmName && els.ctaFirmName.value.trim()) || "[Your A&E Firm Name]";
    const role = (els.ctaSenderRole && els.ctaSenderRole.value.trim()) || "[Principal / Controller]";

    const trackLabels = {
      FL_FDOT_UNDER_1M: "Florida FDOT Self-Cert (<$1M, Statewide Cap Applied)",
      NC_NCDOT_UNDER_500K: "North Carolina NCDOT Self-Cert (<$500k)",
      TRACK_B_PRE_AUDIT: "Track B Mandatory CPA Audit Pre-Cleanup (>= $1M)"
    };

    const summaryLines = [
      "Hello DOT FAR 31 Pre-Scan Support,",
      "",
      "I would like to request the $1,695 Fixed Non-Contingent FAR Part 31 Workpaper Compilation Package (FAR 31.205-33 allowable indirect cost).",
      "",
      "Firm: " + firm,
      "Role: " + role,
      "Track: " + (trackLabels[state.jurisdiction] || state.jurisdiction),
      "Office Basis: " + (state.officeType === "field" ? "Field Office" : "Home Office")
    ];

    if (result && result.rates && result.projection_12mo) {
      summaryLines.push(
        "Browser Pre-Scan Scrubbed ICR: " + formatPct(result.rates.scrubbed_icr_pct),
        "Effective Claimable Rate: " + formatPct(result.rates.effective_claimable_icr_pct) +
          (result.rates.truncated_by_fdot_cap ? " (FDOT Cap Applied)" : ""),
        "Effective FCCM Rate: " + formatPct(result.rates.effective_fccm_rate_pct),
        "Projected 12-Month Gross Margin Uplift: " + formatCurrency(result.projection_12mo.projected_12mo_total_uplift_usd)
      );
    }

    summaryLines.push(
      "",
      "Understood: This is a non-audit / non-attestation workpaper compilation service ($1,695 fixed non-contingent fee); zero employee PII attached.",
      "Please reply with next steps for submitting our anonymous Trial Balance CSV (Account Code + Amount only)."
    );

    const bodyText = summaryLines.join("\n");
    if (els.ctaPreviewBody) els.ctaPreviewBody.value = bodyText;

    const subject = "FAR Part 31 $1,695 Workpaper Package Request - " + (trackLabels[state.jurisdiction] || state.jurisdiction);
    if (els.btnMailtoCta) {
      els.btnMailtoCta.href =
        "mailto:" + email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyText);
    }
  }

  function bindEvents() {
    els.modeCards.forEach((card) => {
      card.addEventListener("click", () => {
        setJurisdiction(card.getAttribute("data-mode"));
      });
    });

    els.officeHome.addEventListener("click", () => setOfficeType("home"));
    els.officeField.addEventListener("click", () => setOfficeType("field"));

    els.sampleFl.addEventListener("click", () => loadSample("fl"));
    els.sampleNc.addEventListener("click", () => loadSample("nc"));
    els.sampleTrackB.addEventListener("click", () => loadSample("track_b"));

    els.dropzone.addEventListener("click", () => els.fileInput.click());
    els.dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        els.fileInput.click();
      }
    });

    els.dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      els.dropzone.classList.add("dragover");
    });

    els.dropzone.addEventListener("dragleave", () => {
      els.dropzone.classList.remove("dragover");
    });

    els.dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      els.dropzone.classList.remove("dragover");
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    });

    els.fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFileUpload(file);
    });

    [els.inputDirectLabor, els.inputAssetNbv, els.inputDotBillings, els.inputExecComp].forEach((inp) => {
      inp.addEventListener("input", runScan);
    });

    els.filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        state.filter = tab.getAttribute("data-filter") || "all";
        els.filterTabs.forEach((t) => t.classList.toggle("active", t === tab));
        if (state.lastResult) renderLinesTable(state.lastResult.lines || []);
      });
    });

    els.btnDownloadCsv.addEventListener("click", downloadTraceabilityCsv);
    els.btnDownloadHtml.addEventListener("click", downloadHtmlWorkpaper);

    [els.ctaFirmName, els.ctaSenderRole].forEach((inp) => {
      inp.addEventListener("input", () => updateCtaMailto(state.lastResult));
    });

    els.btnCopyCta.addEventListener("click", async () => {
      const email = CFG.CONTACT_EMAIL || "w5gbs570gu-csa@agentmail.to";
      const payload = "To: " + email + "\n\n" + (els.ctaPreviewBody.value || "");
      try {
        await navigator.clipboard.writeText(payload);
        els.copyFeedback.textContent = "Copied to clipboard!";
        setTimeout(() => {
          els.copyFeedback.textContent = "";
        }, 3000);
      } catch (_) {
        els.copyFeedback.textContent = "Select text above to copy.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initElements();
    populateStaticConfig();
    bindEvents();
    loadSample("fl");
  });
})();

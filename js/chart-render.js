/* =============================================
   LenTiny Chart System Renderer
   Static-only: chart detail + chart listing
   ============================================= */

(function () {
  "use strict";

  var root = document.querySelector(".lt-chart-system");
  if (!root) return;

  var utils = window.LenTinyChartUtils;
  if (!utils) {
    console.error("[LenTiny ChartSystem] Missing js/chart-utils.js.");
    return;
  }

  var clean = utils.clean;
  var escapeAttr = utils.escapeAttr;
  var escapeHtml = utils.escapeHtml;
  var isObject = utils.isObject;
  var parseJson = utils.parseJson;
  var sanitizeSlug = utils.sanitizeSlug;
  var FALLBACK_IMAGE = "images/og-image.jpg";
  var PDF_REQUEST_WEBHOOK_URL = window.LENTINY_PDF_WEBHOOK_URL || "";
  var page = root.getAttribute("data-page");
  var fontSize = Number(localStorage.getItem("lt-chart-font-size")) || 18;

  applyReaderState();

  if (page === "detail") {
    initDetail();
  }

  if (page === "list") {
    initList();
  }

  function initDetail() {
    var app = document.getElementById("chartApp");
    var slug = getSlug();

    if (!app) {
      console.error("[LenTiny ChartSystem] Missing #chartApp container.");
      return;
    }

    if (!slug) {
      renderError(app, "Thiếu slug chart", "Mở trang theo dạng chart-template.html?slug=con-luoi nha.");
      return;
    }

    renderLoading(app, "Đang tải chart " + slug + "...");

    fetchJson("charts/" + slug + ".json", "chart detail")
      .then(function (chart) {
        var result = normalizeChart(chart, slug);
        if (!result.valid) {
          console.error("[LenTiny ChartSystem] Invalid chart JSON:", result.errors, chart);
          renderError(app, "JSON chart chưa hợp lệ", result.errors.join(" "));
          return;
        }
        renderDetail(app, result.chart);
        applySeo(result.chart);
        bindToolbar();
        bindProgress(result.chart.slug);
        bindZaloPlaceholder(result.chart);
      })
      .catch(function (error) {
        console.error("[LenTiny ChartSystem] Cannot load chart JSON:", error);
        renderError(app, "Chưa tìm thấy chart", "File charts/" + escapeHtml(slug) + ".json chưa tồn tại hoặc JSON đang lỗi.");
      });
  }

  function initList() {
    var app = document.getElementById("chartListApp");
    var search = document.getElementById("chartSearch");
    var filters = document.getElementById("tagFilters");
    var state = { query: "", tag: "all", charts: [] };

    if (!app) {
      console.error("[LenTiny ChartSystem] Missing #chartListApp container.");
      return;
    }

    renderLoading(app, "Đang tải kho chart...");

    fetchJson("charts/index.json", "chart index")
      .then(function (data) {
        state.charts = normalizeIndex(data);
        if (!state.charts.length) {
          console.warn("[LenTiny ChartSystem] Empty charts/index.json or no valid chart cards.");
        }
        if (filters) renderFilters(filters, state);
        renderCards(app, state);

        if (search) {
          /* TODO Search optimization: for hundreds of charts, prebuild a normalized
             search index in charts/index.json instead of scanning raw text on input. */
          search.addEventListener("input", function () {
            state.query = search.value.trim().toLowerCase();
            renderCards(app, state);
          });
        }

        if (filters) {
          filters.addEventListener("click", function (event) {
            var button = event.target.closest("[data-tag]");
            if (!button) return;
            state.tag = button.getAttribute("data-tag");
            renderFilters(filters, state);
            renderCards(app, state);
          });
        }
      })
      .catch(function (error) {
        console.error("[LenTiny ChartSystem] Cannot load chart index JSON:", error);
        renderError(app, "Chưa mở được kho chart", "Kiểm tra file charts/index.json nha.");
      });
  }

  async function fetchJson(url, label) {
    try {
      var response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) {
        throw new Error(label + " request failed: " + response.status + " " + response.statusText);
      }

      try {
        return await response.json();
      } catch (jsonError) {
        throw new Error(label + " JSON parse failed: " + jsonError.message);
      }
    } catch (error) {
      console.error("[LenTiny ChartSystem] fetchJson error for " + url + ":", error);
      throw error;
    }
  }

  function normalizeChart(raw, fallbackSlug) {
    var errors = [];
    if (!isObject(raw)) {
      return { valid: false, errors: ["File JSON phải là object."], chart: null };
    }

    var slug = sanitizeSlug(raw.slug || fallbackSlug || "");
    if (!slug) errors.push("Thiếu slug.");

    var title = clean(raw.title) || "Chart chưa đặt tên";
    if (!clean(raw.title)) errors.push("Thiếu title.");

    var chart = {
      slug: slug,
      title: title,
      description: clean(raw.description) || "Chart móc len từ LenTiny.",
      difficulty: raw.difficulty || "",
      time: clean(raw.time),
      size: clean(raw.size),
      tags: normalizeStringArray(raw.tags),
      coverImage: clean(raw.coverImage) || clean(raw.chartImage) || FALLBACK_IMAGE,
      chartImage: clean(raw.chartImage) || clean(raw.coverImage),
      materialSet: isObject(raw.materialSet) ? {
        price: clean(raw.materialSet.price),
        messengerUrl: clean(raw.materialSet.messengerUrl)
      } : { price: "", messengerUrl: "" },
      materials: normalizeStringArray(raw.materials),
      abbreviations: normalizeAbbreviations(raw.abbreviations),
      sections: normalizeSections(raw.sections, slug, clean(raw.chartImage)),
      seo: isObject(raw.seo) ? {
        title: clean(raw.seo.title),
        description: clean(raw.seo.description),
        socialImage: clean(raw.seo.socialImage)
      } : {}
    };

    return { valid: errors.length === 0, errors: errors, chart: chart };
  }

  function normalizeIndex(raw) {
    if (!isObject(raw) || !Array.isArray(raw.charts)) {
      console.error("[LenTiny ChartSystem] charts/index.json must contain { charts: [...] }.", raw);
      return [];
    }

    return raw.charts.map(function (chart) {
      if (!isObject(chart)) return null;
      var slug = sanitizeSlug(chart.slug || "");
      if (!slug) {
        console.error("[LenTiny ChartSystem] Skipping chart card without slug:", chart);
        return null;
      }
      return {
        slug: slug,
        title: clean(chart.title) || "Chart chưa đặt tên",
        description: clean(chart.description),
        difficulty: chart.difficulty || "",
        time: clean(chart.time),
        tags: normalizeStringArray(chart.tags),
        coverImage: clean(chart.coverImage) || FALLBACK_IMAGE
      };
    }).filter(Boolean);
  }

  function normalizeSections(sections, slug, defaultImage) {
    if (!Array.isArray(sections)) return [];

    return sections.map(function (section, sectionIndex) {
      if (!isObject(section)) return null;
      var title = clean(section.title) || "Phần " + (sectionIndex + 1);
      var steps = Array.isArray(section.steps) ? section.steps.map(function (step, stepIndex) {
        if (!isObject(step)) {
          return { id: slug + "-" + sectionIndex + "-" + stepIndex, text: clean(step) };
        }
        return {
          id: sanitizeSlug(step.id || title + "-" + (stepIndex + 1)) || slug + "-" + sectionIndex + "-" + stepIndex,
          text: clean(step.text)
        };
      }).filter(function (step) {
        return step.text;
      }) : [];

      return {
        title: title,
        image: clean(section.image) || defaultImage,
        steps: steps
      };
    }).filter(Boolean);
  }

  function normalizeAbbreviations(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (item) {
      if (!isObject(item)) return null;
      var symbol = clean(item.symbol);
      var meaning = clean(item.meaning);
      if (!symbol || !meaning) return null;
      return { symbol: symbol, meaning: meaning };
    }).filter(Boolean);
  }

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return value.map(clean).filter(Boolean);
  }

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return sanitizeSlug(params.get("slug") || "");
  }

  function renderDetail(app, chart) {
    app.className = "";
    app.innerHTML = [
      renderBreadcrumb(chart),
      renderHero(chart),
      renderInfo(chart),
      renderMaterialCta(chart),
      renderToolbar(),
      renderSections(chart),
      renderZaloCta(chart)
    ].filter(Boolean).join("");
  }

  function renderBreadcrumb(chart) {
    return [
      '<nav class="lt-breadcrumb" aria-label="Breadcrumb">',
      '<a href="index.html">Trang chủ</a>',
      '<span>/</span>',
      '<a href="chart-index.html">Kho chart</a>',
      '<span>/</span>',
      '<span>' + escapeHtml(chart.title) + '</span>',
      '</nav>'
    ].join("");
  }

  function renderHero(chart) {
    var heroAlt = chart.title
      ? "Ảnh thành phẩm " + chart.title + " của LenTiny"
      : "Ảnh thành phẩm chart móc len LenTiny";

    return [
      '<section class="lt-hero">',
      '<div class="lt-hero-grid">',
      '<div>',
      '<p class="lt-eyebrow">Chart tiếng Việt từ LenTiny</p>',
      '<h1>' + escapeHtml(chart.title) + '</h1>',
      '<p>' + escapeHtml(chart.description) + '</p>',
      renderTags(chart.tags || []),
      '</div>',
      '<figure class="lt-hero-image">',
      '<img src="' + escapeAttr(chart.coverImage || FALLBACK_IMAGE) + '" alt="' + escapeAttr(heroAlt) + '" width="900" height="675" decoding="async" onerror="this.onerror=null;this.src=\'' + escapeAttr(FALLBACK_IMAGE) + '\';" />',
      '</figure>',
      '</div>',
      '</section>'
    ].join("");
  }

  function renderTags(tags) {
    if (!tags.length) return "";
    return '<div class="lt-tags">' + tags.map(function (tag) {
      return '<span class="lt-tag">' + escapeHtml(tag) + '</span>';
    }).join("") + '</div>';
  }

  function renderInfo(chart) {
    var materials = chart.materials.length
      ? chart.materials.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("")
      : '<li>Chưa có danh sách nguyên liệu.</li>';
    var abbreviations = chart.abbreviations.length
      ? chart.abbreviations.map(function (item) { return '<li><strong>' + escapeHtml(item.symbol) + '</strong> = ' + escapeHtml(item.meaning) + '</li>'; }).join("")
      : '<li>Chưa có bảng ký hiệu.</li>';

    return [
      '<section class="lt-grid" aria-label="Thông tin chart">',
      '<article class="lt-card lt-info-card">',
      '<h2>Thông tin nhanh</h2>',
      '<ul class="lt-list">',
      '<li><strong>Độ khó:</strong> ' + escapeHtml(renderDifficulty(chart.difficulty)) + '</li>',
      '<li><strong>Thời gian:</strong> ' + escapeHtml(chart.time || "") + '</li>',
      '<li><strong>Kích thước:</strong> ' + escapeHtml(chart.size || "") + '</li>',
      '</ul>',
      '<h3>Nguyên liệu</h3>',
      '<ul class="lt-list">' + materials + '</ul>',
      '</article>',
      '<article class="lt-card lt-info-card">',
      '<h2>Bảng ký hiệu</h2>',
      '<ul class="lt-list">' + abbreviations + '</ul>',
      '</article>',
      '</section>'
    ].join("");
  }

  function renderMaterialCta(chart) {
    var set = chart.materialSet || {};
    if (!set.messengerUrl) return "";
    return [
      '<section class="lt-cta">',
      '<h2>Muốn móc bé này mà chưa có đủ nguyên liệu?</h2>',
      '<p>Tiny có thể chuẩn bị sẵn set len, kim móc và phụ kiện vừa đủ cho mẫu này. Giá tham khảo: <strong>' + escapeHtml(set.price || "Liên hệ") + '</strong>.</p>',
      '<a class="lt-button lt-button-primary" href="' + escapeAttr(set.messengerUrl || "https://m.me/lentiny") + '" target="_blank" rel="noopener">Nhắn Tiny để đặt set</a>',
      '</section>'
    ].join("");
  }

  function renderToolbar() {
    return [
      '<section class="lt-toolbar" aria-label="Tiện ích đọc chart">',
      '<p class="lt-toolbar-title">Tiện ích khi móc</p>',
      '<div class="lt-toolbar-actions">',
      '<button class="lt-tool-button" type="button" id="darkModeToggle" aria-pressed="' + String(root.classList.contains("lt-dark")) + '">Móc ban đêm</button>',
      '<button class="lt-tool-button" type="button" id="fontDecrease" aria-label="Giảm cỡ chữ">A-</button>',
      '<button class="lt-tool-button" type="button" id="fontIncrease" aria-label="Tăng cỡ chữ">A+</button>',
      '<button class="lt-tool-button lt-reset-progress" type="button" id="resetProgressButton">Reset</button>',
      '</div>',
      '</section>'
    ].join("");
  }

  function renderSections(chart) {
    if (!chart.sections.length) {
      console.warn("[LenTiny ChartSystem] Chart has no sections:", chart.slug);
      return '<section class="lt-loading">Chart này chưa có nội dung section.</section>';
    }

    return '<section aria-label="Nội dung chart">' + (chart.sections || []).map(function (section, sectionIndex) {
      var stepsHtml = section.steps.length
        ? section.steps.map(function (step, stepIndex) { return renderStep(chart.slug, sectionIndex, step, stepIndex); }).join("")
        : "";
      return [
        '<article class="lt-card lt-section">',
        '<h2>' + escapeHtml(section.title) + '</h2>',
        section.image ? renderSectionImage(section, chart.title) : "",
        stepsHtml ? '<ul class="lt-steps">' : "",
        stepsHtml,
        stepsHtml ? '</ul>' : "",
        !section.image && !stepsHtml ? '<p class="lt-small-note">Phần này chưa có ảnh hoặc nội dung.</p>' : "",
        '</article>'
      ].join("");
    }).join("") + '</section>';
  }

  function renderStep(slug, sectionIndex, step, stepIndex) {
    var stepId = sanitizeSlug(step.id || "step-" + (stepIndex + 1)) || "step-" + (stepIndex + 1);
    var id = [sectionIndex, stepId].join(":");
    var progressId = "lt-step-" + slug + "-" + sectionIndex + "-" + stepId;
    return [
      '<li class="lt-step">',
      '<input id="' + escapeAttr(progressId) + '" type="checkbox" data-progress-id="' + escapeAttr(id) + '" />',
      '<label for="' + escapeAttr(progressId) + '">' + escapeHtml(step.text || "") + '</label>',
      '</li>'
    ].join("");
  }

  function renderSectionImage(section, title) {
    var imageAlt = section.title
      ? "Ảnh minh họa " + section.title + " trong " + title
      : "Ảnh minh họa chart móc len " + title;

    return [
      '<figure class="lt-section-image">',
      '<img src="' + escapeAttr(section.image || FALLBACK_IMAGE) + '" alt="' + escapeAttr(imageAlt) + '" width="900" height="675" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + escapeAttr(FALLBACK_IMAGE) + '\';" />',
      '<figcaption class="lt-caption">' + escapeHtml(section.title) + '</figcaption>',
      '</figure>'
    ].join("");
  }

  function renderZaloCta(chart) {
    return [
      '<section class="lt-cta">',
      '<h2>Nhập thông tin để lấy file PDF</h2>',
      '<p>Điền tên và SĐT/Zalo để Tiny biết bạn đang quan tâm chart nào. Link PDF sẽ được n8n trả về sau khi ghi nhận thông tin.</p>',
      '<form class="lt-zalo-form" id="zaloForm">',
      '<label class="lt-field"><span>Tên của bạn</span><input name="name" type="text" autocomplete="name" placeholder="Ví dụ: An" required /></label>',
      '<label class="lt-field"><span>SĐT/Zalo</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ví dụ: 0901234567" required /></label>',
      '<button class="lt-button lt-button-primary" type="submit">Lấy file PDF</button>',
      '<p class="lt-small-note" id="zaloMessage">Thông tin này chỉ dùng để Tiny hỗ trợ chart và tư vấn set len phù hợp.</p>',
      '<p class="lt-small-note" id="pdfDownloadWrap" hidden><a class="lt-button lt-button-soft" id="pdfDownloadLink" href="#" target="_blank" rel="noopener">Mở file PDF</a></p>',
      '</form>',
      '</section>'
    ].join("");
  }

  function bindToolbar() {
    var darkModeToggle = document.getElementById("darkModeToggle");
    var fontIncrease = document.getElementById("fontIncrease");
    var fontDecrease = document.getElementById("fontDecrease");

    if (!darkModeToggle || !fontIncrease || !fontDecrease) return;

    darkModeToggle.addEventListener("click", function () {
      var next = !root.classList.contains("lt-dark");
      root.classList.toggle("lt-dark", next);
      darkModeToggle.setAttribute("aria-pressed", String(next));
      localStorage.setItem("lt-chart-dark-mode", next ? "1" : "0");
    });

    fontIncrease.addEventListener("click", function () {
      fontSize = setFontSize(fontSize + 1);
    });

    fontDecrease.addEventListener("click", function () {
      fontSize = setFontSize(fontSize - 1);
    });
  }

  function bindProgress(slug) {
    var key = "lt-chart-progress:" + slug;
    var saved = parseJson(localStorage.getItem(key), {});
    var inputs = document.querySelectorAll("[data-progress-id]");
    var resetButton = document.getElementById("resetProgressButton");

    inputs.forEach(function (input) {
      var id = input.getAttribute("data-progress-id");
      input.checked = Boolean(saved[id]);
      input.addEventListener("change", function () {
        saved[id] = input.checked;
        localStorage.setItem(key, JSON.stringify(saved));
      });
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        saved = {};
        localStorage.removeItem(key);
        inputs.forEach(function (input) {
          input.checked = false;
        });
      });
    }
  }

  function bindZaloPlaceholder(chart) {
    var form = document.getElementById("zaloForm");
    var message = document.getElementById("zaloMessage");
    var downloadWrap = document.getElementById("pdfDownloadWrap");
    var downloadLink = document.getElementById("pdfDownloadLink");
    if (!form || !message) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var name = clean(formData.get("name"));
      var phone = clean(formData.get("phone"));
      var request = {
        name: name,
        phone: phone,
        chart: chart.slug,
        title: chart.title,
        source: "chart-subpage",
        createdAt: new Date().toISOString()
      };
      savePdfRequest(request);
      console.info("[LenTiny ChartSystem] PDF request placeholder:", {
        name: name,
        phone: phone,
        chart: chart.slug,
        source: "chart-subpage"
      });
      message.textContent = "Đang gửi thông tin để lấy PDF...";
      requestPdfLink(request).then(function (pdfUrl) {
        if (pdfUrl && downloadLink && downloadWrap) {
          downloadLink.href = pdfUrl;
          downloadWrap.hidden = false;
          message.textContent = "Cảm ơn " + (name || "bạn") + " nha. Bấm nút Mở file PDF để lưu chart về máy.";
          return;
        }
        message.textContent = "Cảm ơn " + (name || "bạn") + " nha. Tiny đã ghi nhận thông tin và sẽ gửi PDF cho bạn.";
      }).catch(function (error) {
        console.error("[LenTiny ChartSystem] PDF request failed:", error);
        message.textContent = "Tiny đã ghi nhận tạm trên máy này. Nếu chưa thấy PDF, nhắn Tiny để nhận file nha.";
      });
    });
  }

  async function requestPdfLink(request) {
    if (!PDF_REQUEST_WEBHOOK_URL) return "";

    var response = await fetch(PDF_REQUEST_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error("PDF webhook failed: " + response.status);
    }

    var data = await response.json().catch(function () {
      return {};
    });
    return clean(data.pdfUrl || data.pdf_url || data.url);
  }

  function savePdfRequest(request) {
    var key = "lt-chart-pdf-requests";
    var saved = parseJson(localStorage.getItem(key), []);
    if (!Array.isArray(saved)) saved = [];
    saved.push(request);
    localStorage.setItem(key, JSON.stringify(saved.slice(-100)));
  }

  function renderFilters(container, state) {
    if (!container) return;
    var tags = ["all"];
    state.charts.forEach(function (chart) {
      (chart.tags || []).forEach(function (tag) {
        if (tags.indexOf(tag) === -1) tags.push(tag);
      });
    });

    container.innerHTML = tags.map(function (tag) {
      var label = tag === "all" ? "Tất cả" : tag;
      return '<button class="lt-filter-button ' + (state.tag === tag ? "is-active" : "") + '" type="button" data-tag="' + escapeAttr(tag) + '">' + escapeHtml(label) + '</button>';
    }).join("");
  }

  function renderCards(app, state) {
    var filtered = state.charts.filter(function (chart) {
      var haystack = [chart.title, chart.description, (chart.tags || []).join(" ")].join(" ").toLowerCase();
      var matchesQuery = !state.query || haystack.indexOf(state.query) !== -1;
      var matchesTag = state.tag === "all" || (chart.tags || []).indexOf(state.tag) !== -1;
      return matchesQuery && matchesTag;
    });

    if (!filtered.length) {
      app.innerHTML = '<div class="lt-loading">Chưa có chart phù hợp.</div>';
      return;
    }

    app.innerHTML = filtered.map(function (chart) {
      var tags = chart.tags || [];
      var beginnerBadge = tags.some(function (tag) { return tag.toLowerCase() === "beginner"; })
        ? '<span>Beginner</span>'
        : "";
      var timeBadge = chart.time ? '<span>' + escapeHtml(chart.time) + '</span>' : "";
      var cardAlt = chart.title
        ? "Ảnh bìa " + chart.title + " của LenTiny"
        : "Ảnh bìa chart móc len LenTiny";
      return [
        '<article class="lt-card lt-feed-card">',
        '<figure class="lt-card-image"><img src="' + escapeAttr(chart.coverImage || FALLBACK_IMAGE) + '" alt="' + escapeAttr(cardAlt) + '" width="700" height="525" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + escapeAttr(FALLBACK_IMAGE) + '\';" /></figure>',
        '<div class="lt-card-body">',
        '<h2>' + escapeHtml(chart.title) + '</h2>',
        '<div class="lt-card-meta">' + escapeHtml(renderDifficulty(chart.difficulty)) + '</div>',
        '<div class="lt-card-tags">' + beginnerBadge + timeBadge + '</div>',
        '<a class="lt-card-cta" href="chart-template.html?slug=' + escapeAttr(chart.slug) + '">Xem chart</a>',
        '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function applyReaderState() {
    root.classList.toggle("lt-dark", localStorage.getItem("lt-chart-dark-mode") === "1");
    setFontSize(fontSize);
  }

  function setFontSize(value) {
    var next = Math.max(17, Math.min(22, value));
    root.style.setProperty("--chart-font", next + "px");
    localStorage.setItem("lt-chart-font-size", String(next));
    return next;
  }

  function applySeo(chart) {
    var seo = chart.seo || {};
    var title = clean(seo.title) || (chart.title ? chart.title + " | LenTiny" : "Chart móc len | LenTiny");
    var description = clean(seo.description) || chart.description || "Chart móc len tiếng Việt từ Tiệm Len Nhà Tiny.";
    var image = clean(seo.socialImage) || chart.coverImage || chart.chartImage || FALLBACK_IMAGE;
    var url = window.location.href;

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', image);
  }

  function setMeta(selector, value) {
    var meta = document.querySelector(selector);
    if (meta && value) meta.setAttribute("content", value);
  }

  function renderDifficulty(value) {
    var number = Number(value);
    if (!number) return String(value || "");
    return "★".repeat(number) + "☆".repeat(Math.max(0, 5 - number));
  }

  function renderError(app, title, message) {
    if (!app) return;
    app.className = "lt-error";
    app.innerHTML = '<h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(message) + '</p><p><a class="lt-button lt-button-primary" href="chart-index.html">Về kho chart</a></p>';
  }

  function renderLoading(app, message) {
    if (!app) return;
    app.className = "lt-loading";
    app.textContent = message || "Đang tải...";
  }

})();

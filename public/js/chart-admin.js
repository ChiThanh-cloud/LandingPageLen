/* =============================================
   LenTiny Chart Admin
   Static JSON generator, no server writes
   ============================================= */

/* TODO Admin auth: protect this page before production.
   Current admin.html is a static local tool. Future phases should add a real
   login gate or move authoring into the existing authenticated admin surface. */

(function () {
  "use strict";

  var form = document.getElementById("chartAdminForm");
  var builder = document.getElementById("sectionsBuilder");
  var addButton = document.getElementById("addSectionButton");
  var generateButton = document.getElementById("generateJsonButton");
  var copyButton = document.getElementById("copyJsonButton");
  var downloadButton = document.getElementById("downloadJsonButton");
  var pdfBuilderLink = document.getElementById("pdfBuilderLink");
  var output = document.getElementById("jsonOutput");
  var message = document.getElementById("adminMessage");
  var publishGuide = document.getElementById("publishGuide");
  var cloudNameInput = document.getElementById("cloudinaryCloudName");
  var uploadPresetInput = document.getElementById("cloudinaryUploadPreset");
  var utils = window.LenTinyChartUtils;
  var CHART_SYNC_KEY = "lentiny_chart_admin_latest";
  var CLOUD_NAME_KEY = "lentiny_cloudinary_cloud_name";
  var UPLOAD_PRESET_KEY = "lentiny_cloudinary_upload_preset";
  var DEFAULT_CLOUD_NAME = "djn2kd2hh";
  var DEFAULT_UPLOAD_PRESET = "my_unsigned_preset";

  if (!form || !builder || !output || !message) {
    console.error("[LenTiny ChartAdmin] Missing required admin DOM nodes.");
    return;
  }

  if (!utils) {
    console.error("[LenTiny ChartAdmin] Missing js/chart-utils.js.");
    return;
  }

  var clean = utils.clean;
  var escapeAttr = utils.escapeAttr;
  var escapeHtml = utils.escapeHtml;
  var sanitizeSlug = utils.sanitizeSlug;

  if (addButton) {
    addButton.addEventListener("click", function () {
      try {
        addSection();
      } catch (error) {
        handleError("Không thêm được section.", error);
      }
    });
  }

  if (generateButton) {
    generateButton.addEventListener("click", function () {
      safeGenerate();
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      try {
        safeGenerate();
        copyToClipboard(output.value);
      } catch (error) {
        handleError("Không copy được JSON.", error);
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      try {
        var json = safeGenerate();
        var filename = (json.slug || "chart") + ".json";
        downloadText(filename, output.value);
      } catch (error) {
        handleError("Không tải được JSON.", error);
      }
    });
  }

  if (pdfBuilderLink) {
    pdfBuilderLink.addEventListener("click", function () {
      safeGenerate();
    });
  }

  loadCloudinaryConfig();
  bindCloudinaryConfig();
  bindCloudinaryUploads();

  builder.addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove-section]");
    if (!button) return;
    var section = button.closest(".lt-builder-section");
    if (!section) return;
    section.remove();
    showMessage("Đã xóa section.");
  });

  addSection({
    title: "Phần đầu",
    image: "",
    steps: ""
  });
  addSection({
    title: "Phần thân",
    image: "",
    steps: ""
  });
  safeGenerate();

  function safeGenerate() {
    try {
      return generate();
    } catch (error) {
      handleError("Không generate được JSON. Kiểm tra lại form nha.", error);
      return { slug: "chart" };
    }
  }

  function addSection(defaults) {
    var data = defaults || {};
    var index = builder.children.length + 1;
    var section = document.createElement("section");
    section.className = "lt-builder-section";
    section.innerHTML = [
      '<div class="lt-builder-section-head">',
      '<strong>Phần ' + index + '</strong>',
      '<button class="lt-button lt-button-soft" type="button" data-remove-section>Xóa</button>',
      '</div>',
      '<label class="lt-field">',
      '<span>Tên phần này</span>',
      '<input name="sectionTitle" value="' + escapeAttr(data.title || "") + '" placeholder="Ví dụ: Phần đầu" />',
      '<small>Hiện thành tiêu đề của từng khối trong trang chart.</small>',
      '</label>',
      '<label class="lt-field">',
      '<span>Link ảnh cho phần này</span>',
      '<input name="sectionImage" value="' + escapeAttr(data.image || "") + '" placeholder="https://res.cloudinary.com/.../chart-step.jpg" />',
      '<span class="lt-upload-row">',
      '<button class="lt-button lt-button-soft lt-upload-button" type="button" data-upload-scope="sectionImage">Upload ảnh phần này</button>',
      '<input class="lt-file-input" type="file" accept="image/*" data-file-scope="sectionImage" />',
      '</span>',
      '<small>Đây là ảnh chart chụp sẽ hiện trong phần này.</small>',
      '</label>',
      '<label class="lt-field">',
      '<span>Nội dung từng hàng nếu muốn gõ thêm</span>',
      '<textarea name="sectionSteps" rows="5" placeholder="Có thể bỏ trống nếu chỉ muốn hiện ảnh.">' + escapeHtml(data.steps || "") + '</textarea>',
      '<small>Mỗi dòng là một bước. Bỏ trống vẫn hợp lệ nếu phần này có ảnh.</small>',
      '</label>'
    ].join("");
    builder.appendChild(section);
  }

  function generate() {
    var data = new FormData(form);
    var slug = sanitizeSlug(data.get("slug") || data.get("title") || "chart");

    /* TODO AI chart generation: allow AI/OCR to draft this object from an uploaded
       chart note, then keep this generator as the human review/edit step. */
    var chart = {
      slug: slug,
      title: clean(data.get("title")),
      description: clean(data.get("description")),
      difficulty: Number(data.get("difficulty")) || 1,
      time: clean(data.get("time")),
      hookSize: clean(data.get("hookSize")),
      size: clean(data.get("size")),
      tags: parseList(data.get("tags")),
      coverImage: clean(data.get("coverImage")),
      chartImage: clean(data.get("chartImage")),
      materialSet: {
        price: clean(data.get("price")),
        messengerUrl: clean(data.get("messengerUrl"))
      },
      materials: parseLines(data.get("materials")),
      abbreviations: parseAbbreviations(data.get("abbreviations")),
      sections: readSections(slug),
      seo: {
        title: clean(data.get("seoTitle")),
        description: clean(data.get("seoDescription")),
        socialImage: clean(data.get("socialImage"))
      }
    };

    /* TODO Auto save: after serverless/admin storage exists, write chart JSON
       directly to the internal chart source folder whenever a chart is published. */
    validateChart(chart);
    output.value = JSON.stringify(chart, null, 2);
    saveChartForPdf(chart);
    renderPublishGuide(chart);
    showMessage("Đã tạo JSON. Tên file nên là " + slug + ".json.");
    return chart;
  }

  function readSections(slug) {
    return Array.from(builder.querySelectorAll(".lt-builder-section")).map(function (section, sectionIndex) {
      var titleInput = section.querySelector('[name="sectionTitle"]');
      var imageInput = section.querySelector('[name="sectionImage"]');
      var stepsInput = section.querySelector('[name="sectionSteps"]');
      var title = clean(titleInput ? titleInput.value : "");
      var image = clean(imageInput ? imageInput.value : "");
      var steps = parseLines(stepsInput ? stepsInput.value : "").map(function (line, stepIndex) {
        return {
          id: sanitizeSlug(title || "section") + "-r" + (stepIndex + 1),
          text: line
        };
      });
      return {
        title: title || "Section " + (sectionIndex + 1),
        image: image,
        steps: steps
      };
    }).filter(function (section) {
      return section.title || section.image || section.steps.length;
    });
  }

  function validateChart(chart) {
    if (!chart.slug) throw new Error("Chart thiếu slug.");
    if (!chart.title) throw new Error("Chart thiếu title.");
    if (!Array.isArray(chart.sections)) throw new Error("Chart sections phải là array.");
    if (!chart.sections.length) throw new Error("Chart cần ít nhất một phần.");
  }

  function renderPublishGuide(chart) {
    if (!publishGuide) return;

    var chartPath = "/charts/" + chart.slug + ".json";
    var blogPath = "/blog/" + chart.slug;
    var pdfPath = "/assets/pdf/" + chart.slug + ".pdf";
    var prettyTags = chart.tags.length ? chart.tags.join(", ") : "Chưa có tag";
    var indexEntry = {
      slug: chart.slug,
      title: chart.title,
      description: chart.description,
      difficulty: chart.difficulty,
      time: chart.time,
      tags: chart.tags,
      coverImage: chart.coverImage
    };

    publishGuide.innerHTML = [
      '<div class="lt-placement-preview">',
      '<h3>Ảnh và nội dung sẽ nằm ở đâu?</h3>',
      '<ul>',
      '<li><strong>Tên chart:</strong> dùng làm tên file JSON và tiêu đề khi xuất nội dung.</li>',
      '<li><strong>Ảnh bìa:</strong> dùng cho cover khi bạn chuyển chart thành bài blog hoặc PDF.</li>',
      '<li><strong>Ảnh chính:</strong> ảnh mặc định nếu từng phần chưa có ảnh riêng.</li>',
      '<li><strong>Từng phần:</strong> giữ thứ tự nội dung để copy sang bài blog hoặc file PDF.</li>',
      '<li><strong>File PDF:</strong> lưu riêng trong <code>' + escapeHtml(pdfPath) + '</code> rồi link từ bài blog.</li>',
      '</ul>',
      '</div>',
      '<div class="lt-publish-steps">',
      '<h3>Luồng đăng blog + PDF</h3>',
      '<ol>',
      '<li>Đặt tên file là <code>' + escapeHtml(chart.slug) + '.json</code>.</li>',
      '<li>Lưu file vào <code>' + escapeHtml(chartPath) + '</code> nếu cần giữ dữ liệu nguồn.</li>',
      '<li>Dùng dữ liệu này để viết bài blog tại <code>' + escapeHtml(blogPath) + '</code>.</li>',
      '<li>Mở <a href="chart-pdf-builder.html" target="_blank" rel="noopener">tool tạo PDF</a>, bấm <strong>Đồng bộ từ admin</strong>, xuất PDF rồi lưu vào <code>' + escapeHtml(pdfPath) + '</code>.</li>',
      '<li>Trong bài blog, đặt nút PDF trỏ tới <code>' + escapeHtml(pdfPath) + '</code>.</li>',
      '</ol>',
      '</div>',
      '<div class="lt-index-card">',
      '<h3>Dữ liệu tóm tắt</h3>',
      '<pre>' + escapeHtml(JSON.stringify(indexEntry, null, 2)) + '</pre>',
      '<p class="lt-small-note">Tag hiện tại: ' + escapeHtml(prettyTags) + '</p>',
      '</div>'
    ].join("");
  }

  function parseList(value) {
    return String(value || "")
      .split(",")
      .map(clean)
      .filter(Boolean);
  }

  function parseLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map(clean)
      .filter(Boolean);
  }

  function parseAbbreviations(value) {
    return parseLines(value).map(function (line) {
      var parts = line.split("=");
      return {
        symbol: clean(parts.shift()),
        meaning: clean(parts.join("="))
      };
    }).filter(function (item) {
      return item.symbol && item.meaning;
    });
  }

  function copyToClipboard(text) {
    if (!text) {
      showMessage("Chưa có JSON để copy.");
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        showMessage("Đã copy JSON.");
      }).catch(function (error) {
        console.error("[LenTiny ChartAdmin] Clipboard API failed:", error);
        fallbackCopy(text);
      });
      return;
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    try {
      output.focus();
      output.select();
      document.execCommand("copy");
      showMessage("Đã copy JSON.");
    } catch (error) {
      handleError("Không copy được JSON.", error);
    }
  }

  function downloadText(filename, text) {
    if (!text) {
      showMessage("Chưa có JSON để tải.");
      return;
    }
    var blob = new Blob([text], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("Đã tải " + filename + ".");
  }

  function saveChartForPdf(chart) {
    try {
      localStorage.setItem(CHART_SYNC_KEY, JSON.stringify({
        savedAt: Date.now(),
        chart: chart
      }));
    } catch (error) {
      console.error("[LenTiny ChartAdmin] Cannot save chart for PDF builder:", error);
    }
  }

  function loadCloudinaryConfig() {
    if (cloudNameInput) cloudNameInput.value = localStorage.getItem(CLOUD_NAME_KEY) || cloudNameInput.value || DEFAULT_CLOUD_NAME;
    if (uploadPresetInput) uploadPresetInput.value = localStorage.getItem(UPLOAD_PRESET_KEY) || uploadPresetInput.value || DEFAULT_UPLOAD_PRESET;
  }

  function bindCloudinaryConfig() {
    if (cloudNameInput) {
      cloudNameInput.addEventListener("input", function () {
        localStorage.setItem(CLOUD_NAME_KEY, clean(cloudNameInput.value));
      });
    }
    if (uploadPresetInput) {
      uploadPresetInput.addEventListener("input", function () {
        localStorage.setItem(UPLOAD_PRESET_KEY, clean(uploadPresetInput.value));
      });
    }
  }

  function bindCloudinaryUploads() {
    form.addEventListener("click", function (event) {
      var button = event.target.closest("[data-upload-target], [data-upload-scope]");
      if (!button) return;
      var fileInput = getUploadFileInput(button);
      if (fileInput) fileInput.click();
    });

    form.addEventListener("change", function (event) {
      var fileInput = event.target.closest("[data-file-target], [data-file-scope]");
      if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
      uploadSelectedImage(fileInput);
    });
  }

  function getUploadFileInput(button) {
    if (button.hasAttribute("data-upload-target")) {
      return form.querySelector('[data-file-target="' + button.getAttribute("data-upload-target") + '"]');
    }
    return button.closest(".lt-field").querySelector("[data-file-scope]");
  }

  function uploadSelectedImage(fileInput) {
    var targetInput = getUploadTargetInput(fileInput);
    var file = fileInput.files[0];
    var config = getCloudinaryConfig();

    if (!targetInput) {
      showMessage("Chưa tìm thấy ô để điền link ảnh.");
      fileInput.value = "";
      return;
    }

    if (!config.cloudName || !config.uploadPreset) {
      showMessage("Nhập Cloud name và Upload preset trước khi upload ảnh.");
      fileInput.value = "";
      return;
    }

    setUploadState(fileInput, true);
    showMessage("Đang upload " + file.name + " lên Cloudinary...");

    uploadToCloudinary(file, config)
      .then(function (imageUrl) {
        targetInput.value = imageUrl;
        safeGenerate();
        showMessage("Đã upload ảnh và điền link Cloudinary.");
      })
      .catch(function (error) {
        handleError("Upload Cloudinary lỗi. Kiểm tra cloud name, preset hoặc dung lượng ảnh.", error);
      })
      .finally(function () {
        setUploadState(fileInput, false);
        fileInput.value = "";
      });
  }

  function getUploadTargetInput(fileInput) {
    if (fileInput.hasAttribute("data-file-target")) {
      return form.elements[fileInput.getAttribute("data-file-target")];
    }
    return fileInput.closest(".lt-field").querySelector('[name="sectionImage"]');
  }

  function getCloudinaryConfig() {
    return {
      cloudName: clean(cloudNameInput ? cloudNameInput.value : ""),
      uploadPreset: clean(uploadPresetInput ? uploadPresetInput.value : "")
    };
  }

  async function uploadToCloudinary(file, config) {
    var body = new FormData();
    body.append("file", file);
    body.append("upload_preset", config.uploadPreset);
    body.append("tags", "lentiny,chart-admin");

    var response = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(config.cloudName) + "/image/upload", {
      method: "POST",
      body: body
    });
    var data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error && data.error.message ? data.error.message : "Cloudinary upload failed.");
    }

    return optimizeCloudinaryUrl(data.secure_url);
  }

  function optimizeCloudinaryUrl(url) {
    return String(url || "").replace("/upload/", "/upload/f_auto,q_auto/");
  }

  function setUploadState(fileInput, isUploading) {
    var field = fileInput.closest(".lt-field");
    var button = field ? field.querySelector("[data-upload-target], [data-upload-scope]") : null;
    if (!button) return;
    button.disabled = isUploading;
    button.textContent = isUploading ? "Đang upload..." : getUploadButtonText(button);
  }

  function getUploadButtonText(button) {
    var target = button.getAttribute("data-upload-target");
    if (target === "coverImage") return "Upload ảnh bìa";
    if (target === "chartImage") return "Upload ảnh chính";
    if (target === "socialImage") return "Upload ảnh chia sẻ";
    return "Upload ảnh phần này";
  }

  /* TODO CMS migration: when chart volume grows, migrate JSON files into a hosted
     CMS/table while preserving this same JSON contract for the frontend renderer. */

  function showMessage(text) {
    if (message) message.textContent = text;
  }

  function handleError(userMessage, error) {
    console.error("[LenTiny ChartAdmin] " + userMessage, error);
    showMessage(userMessage);
  }

})();

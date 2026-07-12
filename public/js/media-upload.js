(function () {
  var cloudInput = document.getElementById("mediaCloudName");
  var presetInput = document.getElementById("mediaUploadPreset");
  var fileInput = document.getElementById("mediaFile");
  var uploadButton = document.getElementById("mediaUploadButton");
  var clearButton = document.getElementById("mediaClearButton");
  var message = document.getElementById("mediaMessage");
  var preview = document.getElementById("mediaPreview");
  var output = document.getElementById("mediaOutput");

  if (!cloudInput || !presetInput || !fileInput || !uploadButton || !output) return;

  var CLOUD_NAME_KEY = "lentiny_cloudinary_cloud_name";
  var UPLOAD_PRESET_KEY = "lentiny_cloudinary_upload_preset";

  cloudInput.value = localStorage.getItem(CLOUD_NAME_KEY) || cloudInput.value;
  presetInput.value = localStorage.getItem(UPLOAD_PRESET_KEY) || presetInput.value;

  cloudInput.addEventListener("input", saveConfig);
  presetInput.addEventListener("input", saveConfig);
  uploadButton.addEventListener("click", handleUpload);
  clearButton && clearButton.addEventListener("click", clearResult);

  function saveConfig() {
    localStorage.setItem(CLOUD_NAME_KEY, cloudInput.value.trim());
    localStorage.setItem(UPLOAD_PRESET_KEY, presetInput.value.trim());
  }

  function setMessage(text) {
    if (message) message.textContent = text;
  }

  function clean(value) {
    return String(value || "").trim();
  }

  async function handleUpload() {
    var file = fileInput.files && fileInput.files[0];
    var cloudName = clean(cloudInput.value);
    var uploadPreset = clean(presetInput.value);

    if (!cloudName || !uploadPreset) {
      setMessage("Thiếu Cloud name hoặc upload preset.");
      return;
    }

    if (!file) {
      setMessage("Bạn chọn một ảnh trước nha.");
      return;
    }

    saveConfig();
    uploadButton.disabled = true;
    uploadButton.textContent = "Đang upload...";
    setMessage("Đang upload ảnh lên Cloudinary...");

    try {
      var secureUrl = await uploadToCloudinary(file, cloudName, uploadPreset);
      renderResult(secureUrl);
      setMessage("Upload xong. Copy link phù hợp rồi dán vào blog.");
    } catch (error) {
      console.error("[LenTiny MediaUpload]", error);
      setMessage("Upload lỗi. Kiểm tra cloud name, preset unsigned hoặc dung lượng ảnh.");
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = "Upload ảnh";
      fileInput.value = "";
    }
  }

  async function uploadToCloudinary(file, cloudName, uploadPreset) {
    var body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset);
    body.append("tags", "lentiny,blog-media");

    var response = await fetch("https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloudName) + "/image/upload", {
      method: "POST",
      body: body
    });
    var data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error && data.error.message ? data.error.message : "Cloudinary upload failed.");
    }

    return data.secure_url;
  }

  function makeTransform(url, transform) {
    return String(url || "").replace("/upload/", "/upload/" + transform + "/");
  }

  function renderResult(url) {
    var urls = [
      {
        label: "Card blog 800x1000",
        note: "Dán vào image/card của data bài blog Next.js.",
        url: makeTransform(url, "f_auto,q_auto,c_fill,w_800,h_1000")
      },
      {
        label: "Hero bài viết 1200x900",
        note: "Dán vào hero image của bài trong data/posts.ts.",
        url: makeTransform(url, "f_auto,q_auto,c_fill,w_1200,h_900")
      },
      {
        label: "og:image 1200x900",
        note: "Dán vào meta property=\"og:image\" content.",
        url: makeTransform(url, "f_auto,q_auto,c_fill,w_1200,h_900")
      },
      {
        label: "Ảnh gốc tối ưu tự động",
        note: "Dùng khi không muốn crop theo kích thước cố định.",
        url: makeTransform(url, "f_auto,q_auto")
      }
    ];

    if (preview) {
      preview.innerHTML = '<img src="' + escapeAttr(urls[1].url) + '" alt="Ảnh vừa upload lên Cloudinary" />';
    }

    output.innerHTML = urls.map(function (item) {
      return [
        '<article class="lt-output-item">',
        '<strong>' + escapeHtml(item.label) + '</strong>',
        '<small>' + escapeHtml(item.note) + '</small>',
        '<code>' + escapeHtml(item.url) + '</code>',
        '<div class="lt-output-actions">',
        '<button class="lt-button lt-button-soft lt-upload-button" type="button" data-copy-url="' + escapeAttr(item.url) + '">Copy link</button>',
        '</div>',
        '</article>'
      ].join("");
    }).join("");

    output.querySelectorAll("[data-copy-url]").forEach(function (button) {
      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-copy-url") || "");
        button.textContent = "Đã copy";
        window.setTimeout(function () {
          button.textContent = "Copy link";
        }, 1400);
      });
    });
  }

  function clearResult() {
    if (preview) preview.textContent = "Chưa có ảnh upload.";
    output.innerHTML = '<p class="lt-small-note">Sau khi upload, link card, hero và og:image sẽ hiện ở đây.</p>';
    setMessage("Đã xóa kết quả trên màn hình.");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }

    var input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();

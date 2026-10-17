/*
 * Reusable admin upload widget — preview / replace / remove for one or
 * several images (or a single file such as a PDF).
 *
 *   <div class="media-field" data-name="images" data-kind="image"
 *        data-max="3" data-array="true" data-accept="image/*"
 *        data-existing='[{"_id":"..","url":"..","originalName":".."}]'></div>
 *
 *   const field = MediaField.mount(el);
 *   const ids = await field.resolve();   // uploads anything new, returns ids
 *
 * Large photos (phone cameras, flyers exported at print size) are scaled
 * down in the browser before upload so they stay well under the server's
 * 10MB limit and upload quickly on slow connections.
 */
(function () {
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;
  const MAX_DIMENSION = 2400;

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function accepts(accept, file) {
    if (!accept) return true;
    return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
      if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
      if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
      return file.type.toLowerCase() === rule;
    });
  }

  // Scales big JPEG/PNG/WebP photos down and re-encodes them as JPEG.
  async function compressImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= COMPRESS_ABOVE_BYTES) return file;
    if (typeof createImageBitmap !== "function") return file;

    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // JPEG has no transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (!blob || blob.size >= file.size) return file;

      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch (e) {
      return file; // fall back to the original; the server will validate it
    }
  }

  // Uploads one file to the Media library and returns the new Media record.
  async function uploadFile(file) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The maximum size is 10MB.`);
    }

    const fd = new FormData();
    fd.append("file", file);

    let res;
    try {
      res = await fetch("/api/media/upload", { method: "POST", credentials: "same-origin", body: fd });
    } catch (networkErr) {
      throw new Error("Upload failed — please check your connection and try again.");
    }

    let body = {};
    try {
      body = await res.json();
    } catch (e) {
      /* non-JSON response */
    }

    if (res.status === 429) throw new Error("Too many requests right now — wait a minute and try again.");
    if (res.status === 401 || res.status === 403) throw new Error("Your session expired — please log in again.");
    if (!res.ok) throw new Error(body.message || `Upload failed (${res.status}).`);

    return body.media;
  }

  async function prepareAndUpload(file) {
    const ready = await compressImage(file);
    return uploadFile(ready);
  }

  function mount(el) {
    const name = el.dataset.name;
    const kind = el.dataset.kind || "image";
    const max = Number(el.dataset.max) || 1;
    const isArray = el.dataset.array === "true";
    const accept = el.dataset.accept || (kind === "image" ? "image/*" : "");
    const noun = kind === "image" ? "image" : "file";

    let existing = [];
    try {
      existing = JSON.parse(el.dataset.existing || "[]");
    } catch (e) {
      existing = [];
    }

    // items: { id?, url, name, file? }
    let items = existing.filter((a) => a && a.url).map((a) => ({ id: a._id, url: a.url, name: a.originalName || "" }));
    let replaceIndex = null;

    const grid = document.createElement("div");
    grid.className = "media-grid";
    const message = document.createElement("div");
    message.className = "media-message";
    const input = document.createElement("input");
    input.type = "file";
    input.hidden = true;
    input.accept = accept;
    input.multiple = max > 1 && replaceIndex === null;
    el.innerHTML = "";
    el.append(grid, message, input);

    function showMessage(text) {
      message.textContent = text || "";
      message.classList.toggle("show", !!text);
    }

    function tileFor(item, index) {
      const tile = document.createElement("div");
      tile.className = "media-tile";
      const isImage = kind === "image";
      tile.innerHTML = `
        <div class="media-preview">${
          isImage
            ? `<img src="${escapeHtml(item.url)}" alt="Preview">`
            : `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.name || "View file")}</a>`
        }</div>
        <div class="media-tile-actions">
          <button type="button" class="btn btn-sm btn-outline-dark" data-act="replace">Replace</button>
          <button type="button" class="btn btn-sm btn-outline-dark" data-act="remove">Remove</button>
        </div>`;
      tile.querySelector('[data-act="replace"]').addEventListener("click", () => {
        replaceIndex = index;
        input.multiple = false;
        input.value = "";
        input.click();
      });
      tile.querySelector('[data-act="remove"]').addEventListener("click", () => {
        if (item.url && item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
        items.splice(index, 1);
        showMessage("");
        render();
      });
      return tile;
    }

    function render() {
      grid.innerHTML = "";
      items.forEach((item, i) => grid.appendChild(tileFor(item, i)));

      if (items.length < max) {
        const add = document.createElement("button");
        add.type = "button";
        add.className = "media-add";
        add.innerHTML = `<span>+</span>${items.length === 0 ? `Add ${noun}${max > 1 ? "s" : ""}` : `Add another`}<small>${items.length}/${max}</small>`;
        add.addEventListener("click", () => {
          replaceIndex = null;
          input.multiple = max - items.length > 1;
          input.value = "";
          input.click();
        });
        grid.appendChild(add);
      }
    }

    input.addEventListener("change", () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      showMessage("");

      const problems = [];
      const accepted = files.filter((f) => {
        if (!accepts(accept, f)) {
          problems.push(`"${f.name}" isn't a supported ${noun} type.`);
          return false;
        }
        const compressible = /^image\/(jpeg|png|webp)$/.test(f.type);
        if (!compressible && f.size > MAX_UPLOAD_BYTES) {
          problems.push(`"${f.name}" is larger than 10MB.`);
          return false;
        }
        return true;
      });

      if (replaceIndex !== null) {
        const f = accepted[0];
        if (f) {
          const old = items[replaceIndex];
          if (old && old.url && old.url.startsWith("blob:")) URL.revokeObjectURL(old.url);
          items[replaceIndex] = { url: URL.createObjectURL(f), name: f.name, file: f };
        }
        replaceIndex = null;
      } else {
        const room = max - items.length;
        if (accepted.length > room) problems.push(`Only ${max} ${noun}${max > 1 ? "s are" : " is"} allowed — extra files were ignored.`);
        accepted.slice(0, room).forEach((f) => items.push({ url: URL.createObjectURL(f), name: f.name, file: f }));
      }

      if (problems.length) showMessage(problems.join(" "));
      render();
    });

    render();

    return {
      name,
      isArray,
      // Uploads any newly chosen files and returns the final list of Media ids.
      async resolve() {
        const ids = [];
        for (const item of items) {
          if (item.file) {
            const media = await prepareAndUpload(item.file);
            item.id = media._id;
            item.file = null;
          }
          ids.push(item.id);
        }
        return ids;
      },
      hasPending() {
        return items.some((i) => i.file);
      },
      setItems(list) {
        items = (list || []).filter((a) => a && a.url).map((a) => ({ id: a._id, url: a.url, name: a.originalName || "" }));
        showMessage("");
        render();
      },
      reset() {
        this.setItems([]);
      },
    };
  }

  window.MediaField = { mount, prepareAndUpload, compressImage, uploadFile };
})();

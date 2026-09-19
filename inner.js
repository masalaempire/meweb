(() => {
  const body = document.body;
  if (!body) return;
  body.classList.add("js-ready");

  const tabs = Array.from(document.querySelectorAll("[data-lens]"));
  const panels = Array.from(document.querySelectorAll("[data-lens-panel]"));
  if (tabs.length && panels.length) {
    const selectLens = (name, focusButton) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.lens === name;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.lensPanel !== name;
      });
      if (focusButton) {
        const next = tabs.find((tab) => tab.dataset.lens === name);
        if (next) next.focus();
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectLens(tab.dataset.lens, false));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        selectLens(tabs[nextIndex].dataset.lens, true);
      });
    });

    selectLens(tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.lens || tabs[0].dataset.lens, false);
  }

  const preview = document.querySelector(".project-preview");
  const projectRows = Array.from(document.querySelectorAll("[data-project]"));
  if (preview && projectRows.length) {
    const previewArt = preview.querySelector(".preview-art");
    const previewTitle = preview.querySelector(".preview-title");
    const previewDescription = preview.querySelector(".preview-description");
    const projectData = {};
    projectRows.forEach((row) => {
      projectData[row.dataset.project] = {
        title: row.dataset.title || row.querySelector("h3")?.textContent || "",
        description: row.dataset.description || row.querySelector("p")?.textContent || "",
        art: row.dataset.art || ""
      };
      const activate = () => {
        const item = projectData[row.dataset.project];
        if (!item) return;
        projectRows.forEach((other) => other.classList.toggle("is-current", other === row));
        preview.dataset.active = row.dataset.project;
        preview.className = "project-preview preview-" + row.dataset.project;
        if (previewArt) {
          previewArt.className = "preview-art preview-art-" + row.dataset.project;
          const artText = previewArt.querySelector("span");
          if (artText) artText.textContent = item.art;
        }
        if (previewTitle) previewTitle.textContent = item.title;
        if (previewDescription) previewDescription.textContent = item.description;
      };
      row.addEventListener("mouseenter", activate);
      row.addEventListener("focus", activate);
    });
    if (projectRows[0]) {
      projectRows[0].dispatchEvent(new Event("focus"));
      projectRows[0].classList.add("is-current");
    }
  }

  const channelOutput = document.querySelector("[data-channel-output]");
  const channelLinks = Array.from(document.querySelectorAll("[data-channel]"));
  if (channelOutput && channelLinks.length) {
    const updateChannel = (link) => {
      const name = link.dataset.channelName || link.querySelector(".channel-name")?.textContent || "";
      const handle = link.dataset.channelHandle || link.querySelector(".channel-handle")?.textContent || "";
      const nameNode = channelOutput.querySelector("strong");
      const handleNode = channelOutput.querySelector("small");
      if (nameNode) nameNode.textContent = name;
      if (handleNode) handleNode.textContent = handle;
      channelLinks.forEach((other) => other.classList.toggle("is-current", other === link));
    };
    channelLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => updateChannel(link));
      link.addEventListener("focus", () => updateChannel(link));
    });
    updateChannel(channelLinks[0]);
  }

  const copyButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.querySelector("[data-copy-status]");
  if (copyButton) {
    const email = copyButton.dataset.copyEmail || "simonlm@simonlm.one";
    copyButton.addEventListener("click", async () => {
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch (_) {}
      if (!copied) {
        const helper = document.createElement("textarea");
        helper.value = email;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        try { copied = document.execCommand("copy"); } catch (_) {}
        helper.remove();
      }
      copyButton.classList.toggle("is-copied", copied);
      copyButton.textContent = copied ? "Address copied" : "Use the email link";
      if (copyStatus) copyStatus.textContent = copied ? "Ready to paste wherever you need it." : "Clipboard unavailable — the email link is still active.";
      window.setTimeout(() => {
        copyButton.classList.remove("is-copied");
        copyButton.textContent = "Copy email address";
      }, 3200);
    });
  }
})();
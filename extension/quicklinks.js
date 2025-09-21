// Hanndle quick links.
function openInNewTab(url) {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: url });
  } else {
    window.open(url, "_blank");
  }
}

function renderQuickLinks() {
  const container = document.getElementById("quickLinks");
  container.innerHTML = "";

  quickLinks.forEach((link, index) => {
    const linkElement = document.createElement("a");
    linkElement.className = "quick-link";
    linkElement.href = link.url;

    const urlObj = new URL(link.url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;

    linkElement.innerHTML = `
      <img src="${faviconUrl}" alt="" class="favicon">
      <div class="link-title">${link.title}</div>
    `;

    linkElement.addEventListener("click", (e) => {
      e.preventDefault();
      if (pomodoroActive || timerActive || stopwatchActive) {
        openInNewTab(link.url);
      } else {
        window.location.href = link.url;
      }
    });

    linkElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      editLink(index);
    });

    container.appendChild(linkElement);
  });
}

function showAddLinkModal() {
  editingIndex = -1;
  document.getElementById("modalTitle").textContent = "Add Quick Link";
  document.getElementById("linkTitle").value = "";
  document.getElementById("linkUrl").value = "";
  document.getElementById("linkModal").style.display = "flex";
  document.getElementById("deleteBtn").style.display = "none";
}

function editLink(index) {
  editingIndex = index;
  const link = quickLinks[index];
  document.getElementById("modalTitle").textContent = "Edit Quick Link";
  document.getElementById("linkTitle").value = link.title;
  document.getElementById("linkUrl").value = link.url;
  document.getElementById("linkModal").style.display = "flex";
  document.getElementById("deleteBtn").style.display = "inline-block";
}

function closeLinkModal() {
  document.getElementById("linkModal").style.display = "none";
}

function saveLinkModal() {
  const title = document.getElementById("linkTitle").value.trim();
  const url = document.getElementById("linkUrl").value.trim();
  if (!title || !url) return;

  const finalUrl = url.startsWith("http") ? url : "https://" + url;

  if (editingIndex >= 0) {
    quickLinks[editingIndex] = { title, url: finalUrl };
  } else {
    quickLinks.push({ title, url: finalUrl });
  }

  saveSetting("quickLinks", quickLinks);
  renderQuickLinks();
  closeLinkModal();
}

function deleteLink() {
  if (editingIndex >= 0) {
    quickLinks.splice(editingIndex, 1);
    saveSetting("quickLinks", quickLinks);
    renderQuickLinks();
    closeLinkModal();
  }
}

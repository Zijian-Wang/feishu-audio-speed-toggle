(function () {
  "use strict";

  const SPEEDS = [1, 1.5, 1.75, 2, 3];
  const CONTROL_CLASS = "codex-feishu-speed-control";
  const STORAGE_KEY = "codex-feishu-audio-speed";
  const seen = new WeakSet();

  function getSavedSpeed() {
    const value = Number.parseFloat(localStorage.getItem(STORAGE_KEY));
    return SPEEDS.includes(value) ? value : 1;
  }

  function setSpeed(media, speed) {
    media.playbackRate = speed;
    media.defaultPlaybackRate = speed;
  }

  function createSpeedControl(media) {
    const wrapper = document.createElement("span");
    wrapper.className = CONTROL_CLASS;
    wrapper.title = "飞书音频播放速度";

    const select = document.createElement("select");
    select.setAttribute("aria-label", "播放速度");

    SPEEDS.forEach((speed) => {
      const option = document.createElement("option");
      option.value = String(speed);
      option.textContent = `${speed}x`;
      select.appendChild(option);
    });

    const initialSpeed = getSavedSpeed();
    select.value = String(initialSpeed);
    setSpeed(media, initialSpeed);

    const resizeSelect = () => {
      const measure = document.createElement("span");
      const style = getComputedStyle(select);
      measure.textContent = select.options[select.selectedIndex].textContent;
      measure.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${style.font};padding:0 18px 0 1px;`;
      document.body.appendChild(measure);
      select.style.width = `${Math.ceil(measure.getBoundingClientRect().width)}px`;
      measure.remove();
    };

    select.addEventListener("change", () => {
      const speed = Number.parseFloat(select.value);
      setSpeed(media, speed);
      localStorage.setItem(STORAGE_KEY, String(speed));
      resizeSelect();
    });

    wrapper.appendChild(select);
    resizeSelect();
    return wrapper;
  }

  function createDownloadButton(media) {
    const download = document.createElement("button");
    download.type = "button";
    download.className = `${CONTROL_CLASS}-download`;
    download.title = "下载当前音频";
    download.setAttribute("aria-label", "下载当前音频");
    download.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    download.addEventListener("click", () => {
      const source = media.currentSrc || media.src;
      if (!source) return;
      const link = document.createElement("a");
      link.href = source;
      link.download = "feishu-audio";
      link.click();
    });
    return download;
  }

  function findVisibleContainer(media) {
    return media.closest(".docx-audio-v2-container") || media.closest(".xgplayer");
  }

  function attach(media) {
    if (seen.has(media) || media.closest(`.${CONTROL_CLASS}`)) return;
    const player = findVisibleContainer(media);
    const left = player && player.querySelector(".audio-v2-left");
    const volume = player && player.querySelector(".docx-volume-container");
    if (!left || !volume || left.getBoundingClientRect().width === 0) return;
    seen.add(media);
    left.appendChild(createSpeedControl(media));
    volume.appendChild(createDownloadButton(media));

    media.addEventListener("loadedmetadata", () => {
      setSpeed(media, getSavedSpeed());
    });
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("audio, video").forEach(attach);
    root.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) scan(element.shadowRoot);
    });
  }

  scan(document);
  new MutationObserver(() => scan(document)).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

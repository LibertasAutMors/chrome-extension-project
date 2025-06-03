document.addEventListener("DOMContentLoaded", () => {
  const summarizeButton = document.getElementById("summarizeButton");
  const historyButton = document.getElementById("viewHistoryButton");
  const summaryLengthSelect = document.getElementById("summaryLength");
  const progressMessage = document.getElementById("progressMessage");
  const themeToggleButton = document.getElementById("themeToggleButton");
  const copyButton = document.getElementById("copyButton");
  const resultDiv = document.getElementById("result");
  const sentimentDiv = document.getElementById("sentimentResult");
  const sentimentBar = document.getElementById("sentimentBar");
  const closeButton = document.getElementById("closeSummary");
  const historyList = document.getElementById("historyList");

  if (!summarizeButton || !summaryLengthSelect || !progressMessage) {
    console.error("popup.html 요소를 찾을 수 없습니다.");
    return;
  }

  summarizeButton.addEventListener("click", () => {
    const selectedLength = summaryLengthSelect.value;
    localStorage.setItem("summaryLength", selectedLength);

    progressMessage.textContent = "요약을 진행 중입니다...";
    if (historyList) historyList.style.display = "none"; // ❗ 최근 요약 숨김

    resultDiv.innerText = "";
    resultDiv.className = "";
    if (sentimentDiv) sentimentDiv.innerText = "";
    if (sentimentBar) sentimentBar.innerHTML = "";
    if (copyButton) copyButton.style.display = "none";
    if (closeButton) closeButton.style.display = "none";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      const domain = new URL(tab.url).hostname;
      chrome.storage.local.get(["usageCount", "siteStats"], (data) => {
        const count = (data.usageCount || 0) + 1;
        const siteStats = data.siteStats || {};
        siteStats[domain] = (siteStats[domain] || 0) + 1;

        chrome.storage.local.set({ usageCount: count, siteStats: siteStats }, () => {
          updateStatsUI();
        });
      });

      chrome.tabs.sendMessage(tab.id, {
        action: "startAnalysis"
      });
    });
  });

  historyButton?.addEventListener("click", () => {
    const history = JSON.parse(localStorage.getItem("summaryHistory")) || [];
    const historyList = document.getElementById("historyList");

    resultDiv.innerHTML = "";
    if (sentimentDiv) sentimentDiv.innerHTML = "";
    if (sentimentBar) sentimentBar.innerHTML = "";
    progressMessage.innerHTML = "";
    if (copyButton) copyButton.style.display = "none";
    if (closeButton) closeButton.style.display = "none";

    if (historyList) {
      historyList.style.display = "block"; // ❗ 최근 요약 보이기
      if (history.length === 0) {
        historyList.innerHTML = "<p>저장된 요약이 없습니다.</p>";
      } else {
        historyList.innerHTML =
          "<p><strong>최근 요약</strong></p><ul style='padding-left: 15px;'>" +
          history
            .slice(0, 2) // ✅ 최대 2개까지만 표시
            .map((summary, i) => `<li style='margin-bottom: 5px;'>${i + 1}. ${summary}</li>`)
            .join("") +
          "</ul>";
      }
    }
  });

  copyButton?.addEventListener("click", () => {
    const text = resultDiv?.innerText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert("복사 완료!");
      }).catch(() => {
        alert("복사 실패 😥");
      });
    }
  });

  closeButton?.addEventListener("click", () => {
    const text = resultDiv.innerText;
    if (text) {
      const history = JSON.parse(localStorage.getItem("summaryHistory")) || [];
      history.unshift(text); // 가장 앞에 추가
      localStorage.setItem("summaryHistory", JSON.stringify(history.slice(0, 2))); // ✅ 최대 2개만 저장
    }

    resultDiv.innerText = "";
    if (sentimentDiv) sentimentDiv.innerText = "";
    if (sentimentBar) sentimentBar.innerHTML = "";
    if (copyButton) copyButton.style.display = "none";
    if (closeButton) closeButton.style.display = "none";
    resultDiv.className = "";
  });

  chrome.storage.local.get("theme", (data) => {
    const theme = data.theme;
    if (!theme) {
      chrome.storage.local.set({ theme: "light" }, () => setTheme("light"));
    } else {
      setTheme(theme);
    }
  });

  themeToggleButton?.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("light") ? "light" : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    chrome.storage.local.set({ theme: newTheme }, () => {
      setTheme(newTheme);
    });
  });

  function setTheme(theme) {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    if (themeToggleButton) {
      themeToggleButton.innerText = theme === "light" ? "🌙" : "☀️";
    }
  }

  function updateStatsUI() {
    chrome.storage.local.get(["usageCount", "siteStats"], (data) => {
      document.getElementById("usageCount").innerText = data.usageCount || 0;
      const siteStats = data.siteStats || {};
      const sortedSites = Object.entries(siteStats).sort((a, b) => b[1] - a[1]);
      const topSitesHtml = sortedSites
        .slice(0, 3)
        .map(([site, count]) => `<div>${site} (${count})</div>`)
        .join("");
      document.getElementById("topSites").innerHTML = topSitesHtml;
    });
  }

  updateStatsUI();

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      tabContents.forEach((tab) => {
        tab.classList.toggle("hidden", tab.id !== targetTab);
      });
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summaryComplete" || message.action === "analyzeText") {
    const result = document.getElementById("result");
    const sentiment = document.getElementById("sentimentResult");
    const sentimentBar = document.getElementById("sentimentBar");
    const copyButton = document.getElementById("copyButton");
    const closeButton = document.getElementById("closeSummary");

    if (result) {
      result.innerText = message.summaryText || message.summary;
      result.className = message.sentiment;
    }

    if (sentiment) {
      sentiment.innerText = `감정 분석 결과: ${
        message.sentiment === "positive" ? "긍정" :
        message.sentiment === "neutral" ? "중립" : "부정"
      }`;
    }

    if (sentimentBar && message.sentimentStats) {
      sentimentBar.innerHTML = `
        <div class="positive-bar" style="width:${message.sentimentStats.positive}%">${message.sentimentStats.positive}%</div>
        <div class="neutral-bar" style="width:${message.sentimentStats.neutral}%">${message.sentimentStats.neutral}%</div>
        <div class="negative-bar" style="width:${message.sentimentStats.negative}%">${message.sentimentStats.negative}%</div>
      `;
    }    

    if (copyButton) copyButton.style.display = "inline-block";
    if (closeButton) closeButton.style.display = "inline-block";
  }
  
});

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveEmotion");
  const historyList = document.getElementById("emotionHistoryList");

  // 저장 버튼 클릭 이벤트
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const emotionData = document.getElementById("result").textContent;
      const timestamp = new Date().toISOString();
      const savedData = JSON.parse(localStorage.getItem("emotionHistory") || "[]");
      savedData.push({ emotion: emotionData, time: timestamp });
      localStorage.setItem("emotionHistory", JSON.stringify(savedData));
      alert("감정 분석 결과가 저장되었습니다.");
      renderEmotionHistory();  // 저장 후 목록 갱신
    });
  }

  // 감정 히스토리 렌더링
  function renderEmotionHistory() {
    const savedData = JSON.parse(localStorage.getItem("emotionHistory") || "[]");
    historyList.innerHTML = "";

    if (savedData.length === 0) {
      historyList.innerHTML = "<li>저장된 감정 분석 결과가 없습니다.</li>";
      return;
    }

    // 최근 5개 항목만 표시 (최신순)
    savedData
      .slice(-5)
      .reverse()
      .forEach((item, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${new Date(item.time).toLocaleString()} - ${item.emotion}
          <button data-index="${savedData.length - 1 - i}" class="delete-button">🗑️</button>
        `;
        historyList.appendChild(li);
      });

    // 개별 삭제 버튼 이벤트 연결
    const deleteButtons = document.querySelectorAll(".delete-button");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        savedData.splice(index, 1);
        localStorage.setItem("emotionHistory", JSON.stringify(savedData));
        renderEmotionHistory();
      });
    });
  }

  // 페이지 로드 시 히스토리 렌더링
  renderEmotionHistory();
});

document.addEventListener("DOMContentLoaded", () => {
  const translations = {
    ko: {
      save: "감정 저장",
      history: "감정 분석 히스토리",
      noData: "저장된 감정 분석 결과가 없습니다.",
    },
    en: {
      save: "Save Emotion",
      history: "Emotion History",
      noData: "No saved emotion data.",
    },
    ja: {
      save: "感情を保存する",
      history: "感情分析の履歴",
      noData: "保存された感情分析データはありません。",
    },
  };

  const saveBtn = document.getElementById("saveEmotion");
  const historyTitle = document.getElementById("historyTitle");
  const historyList = document.getElementById("emotionHistoryList");
  const langSelect = document.getElementById("languageSelect");
  console.log("languageSelect:", langSelect); 
  function applyTranslation(lang) {
    const t = translations[lang] || translations.en;

    if (saveBtn) saveBtn.textContent = t.save;
    if (historyTitle) historyTitle.textContent = t.history;

    // 리스트가 비어 있으면 안내 문구 갱신
    if (historyList && historyList.children.length === 0) {
      historyList.innerHTML = `<li>${t.noData}</li>`;
    }
  }

  // 초기 언어 감지 및 적용
  const browserLang = navigator.language.slice(0, 2);
  const initialLang = translations[browserLang] ? browserLang : "en";
  langSelect.value = initialLang;
  applyTranslation(initialLang);

  // 언어 변경 이벤트
  langSelect.addEventListener("change", (e) => {
    const selectedLang = e.target.value;
    applyTranslation(selectedLang);
  });
});

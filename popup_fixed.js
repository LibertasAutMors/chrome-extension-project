// popup_fixed.js - 진행 메시지 관리 및 content.js에 요약 요청 전달

document.addEventListener("DOMContentLoaded", () => {
  // 요소 참조
  const summarizeButton = document.getElementById("summarizeButton");
  const historyButton = document.getElementById("viewHistoryButton");
  const summaryLengthSelect = document.getElementById("summaryLength");
  const progressMessage = document.getElementById("progressMessage");
  const themeToggleButton = document.getElementById("themeToggleButton");
  const copyButton = document.getElementById("copyButton"); // ✅ 복사 버튼

  if (!summarizeButton || !summaryLengthSelect || !progressMessage) {
    console.error("popup.html 요소를 찾을 수 없습니다.");
    return;
  }

  // ✅ 요약 실행 버튼
  summarizeButton.addEventListener("click", () => {
    const selectedLength = summaryLengthSelect.value;
    localStorage.setItem("summaryLength", selectedLength);

    progressMessage.textContent = "요약을 진행 중입니다...";
    document.getElementById("result").innerText = "";
    if (copyButton) copyButton.style.display = "none"; // ✅ 요약 중일 땐 복사 버튼 숨김

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      // 사용 통계 저장
      const domain = new URL(tab.url).hostname;
      chrome.storage.local.get(["usageCount", "siteStats"], (data) => {
        const count = (data.usageCount || 0) + 1;
        const siteStats = data.siteStats || {};
        siteStats[domain] = (siteStats[domain] || 0) + 1;

        chrome.storage.local.set({ usageCount: count, siteStats: siteStats }, () => {
          updateStatsUI(); // 통계 UI 업데이트
        });
      });

      chrome.tabs.sendMessage(tab.id, {
        action: "startAnalysis"
      });
    });
  });

  // ✅ 최근 요약 보기 버튼
  historyButton?.addEventListener("click", () => {
    const history = JSON.parse(localStorage.getItem("summaryHistory")) || [];
    const historyList = document.getElementById("historyList");
    const resultDiv = document.getElementById("result");
    const sentimentDiv = document.getElementById("sentiment");

    if (resultDiv) resultDiv.innerHTML = "";
    if (sentimentDiv) sentimentDiv.innerHTML = "";
    if (progressMessage) progressMessage.innerHTML = "";
    if (copyButton) copyButton.style.display = "none"; // ✅ 복사 버튼 숨김

    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = "<p>저장된 요약이 없습니다.</p>";
      } else {
        historyList.innerHTML =
          "<p><strong>최근 요약</strong></p><ul style='padding-left: 15px;'>" +
          history.map((summary, i) => `<li style='margin-bottom: 5px;'>${i + 1}. ${summary}</li>`).join("") +
          "</ul>";
      }
    }
  });

  // ✅ 복사 버튼 클릭 이벤트
  copyButton?.addEventListener("click", () => {
    const text = document.getElementById("result")?.innerText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert("복사 완료!");
      }).catch(() => {
        alert("복사 실패 😥");
      });
    }
  });

  // ✅ 테마 토글 기능
  chrome.storage.local.get("theme", (data) => {
    const theme = data.theme || "light";
    setTheme(theme);
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
      themeToggleButton.innerText = theme === "light" ? "🌙 다크 모드" : "☀️ 라이트 모드";
    }
  }

  // ✅ 통계 표시 UI 갱신
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

  updateStatsUI(); // 처음 로딩 시에도 호출
});

// ✅ 요약 완료 메시지 수신 → 결과 표시 + 복사 버튼 활성화
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summaryComplete" && message.summaryText) {
    const progressMessage = document.getElementById("progressMessage");
    const result = document.getElementById("result");
    const copyButton = document.getElementById("copyButton");

    if (progressMessage) progressMessage.textContent = "";
    if (result) result.innerText = message.summaryText;
    if (copyButton) copyButton.style.display = "inline-block"; // ✅ 복사 버튼 보이기
  }
});


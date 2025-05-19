 // content.js - 텍스트 추출 및 결과 표시 + 저장 기능 통합

// Readability 로드 여부 확인
if (typeof Readability !== "undefined") {
  console.log("Readability 로드 성공");
} else {
  console.warn("Readability 로드 실패: Readability가 정의되지 않음");
}

// 메시지 수신: 요약 요청 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startAnalysis") {
    showInProgressMessage(); // 진행 중 메시지 출력
    removeSummary(); // 기존 요약 제거
    extractTextWithDelay((finalText) => {
      chrome.runtime.sendMessage({
        action: "analyzeText",
        text: finalText,
        lengthOption: localStorage.getItem("summaryLength") || "300"
      }, (response) => {
        removeInProgressMessage(); // 진행 중 메시지 제거
        chrome.runtime.sendMessage({ action: "summaryComplete" }); // 팝업의 메시지 제거 요청
        if (response) {
          highlightSentiments(response.summary, response.sentiment, response.sentimentStats); // 요약 및 감정 시각화
          saveSummaryRecord(response.summary); // 요약 저장
        }
      });
    });
  }
});

// 진행 중 메시지를 버튼 아래에 출력
function showInProgressMessage() {
  removeInProgressMessage();
  const target = document.getElementById("summarizeButton");
  if (!target) return;
  const summaryContainer = document.createElement("div");
  summaryContainer.id = "inProgressMessage";
  summaryContainer.innerText = "요약을 진행 중입니다...";
  summaryContainer.style = "font-size: 13px; margin-top: 8px; color: #444;";
  target.insertAdjacentElement("afterend", summaryContainer);
}

// 기존 진행 중 메시지 제거
function removeInProgressMessage() {
  const msg = document.getElementById("inProgressMessage");
  if (msg) msg.remove();
}

// 이전 요약 UI 제거
function removeSummary() {
  const existingSummary = document.getElementById("summaryContainer");
  if (existingSummary) existingSummary.remove();
}

// 일정 시간 후 텍스트 추출 재시도
function extractTextWithDelay(callback, retries = 5) {
  setTimeout(() => {
    const text = extractText();
    if (text.length > 50 || retries <= 0) {
      callback(text);
    } else {
      extractTextWithDelay(callback, retries - 1);
    }
  }, 1000);
}

// Readability 기반 텍스트 추출
function extractText() {
  let textContent = "";
  try {
    const clonedDoc = document.cloneNode(true);
    const article = new Readability(clonedDoc).parse();
    if (article && article.textContent) {
      textContent = article.textContent.trim();
    }
  } catch (e) {
    console.warn("Readability 사용 실패:", e.message);
  }
  if (!textContent || textContent.length < 50) {
    textContent = extractFallbackText();
  }
  return textContent.trim();
}

// 기본 방식으로 텍스트 추출 (fallback)
function extractFallbackText() {
  const elements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div, span, article, section, main");
  const blacklist = ["nav", "header", "footer", "aside", "form", "button", "input", "textarea", "select", "script", "style", "noscript", "iframe", "svg"];
  let textContent = Array.from(elements)
    .filter(el => {
      const style = window.getComputedStyle(el);
      return !blacklist.includes(el.tagName.toLowerCase()) && el.innerText.trim().length > 5 && style.display !== "none" && style.visibility !== "hidden";
    })
    .map(el => el.innerText.trim())
    .join(" ");
  textContent += " " + extractFromIframe();
  if (!textContent || textContent.length < 50) {
    textContent = document.body.innerText.trim();
  }
  return textContent;
}

// iframe 내부 텍스트 추출
function extractFromIframe() {
  let result = "";
  document.querySelectorAll("iframe").forEach(iframe => {
    try {
      const iframeSrc = iframe.src || null;
      const currentOrigin = location.origin;
      const iframeOrigin = iframeSrc ? new URL(iframeSrc).origin : currentOrigin;
      if (currentOrigin === iframeOrigin) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.body) result += " " + doc.body.innerText;
      }
    } catch (e) {
      console.warn("iframe 접근 불가:", e.message);
    }
  });
  return result.trim();
}

// 요약 및 감정 분석 결과 화면에 표시
function highlightSentiments(summary, sentiment, sentimentStats) {
  const colors = {
    positive: "lightgreen",
    neutral: "lightgray",
    negative: "lightcoral"
  };
  const sentimentColor = colors[sentiment] || "lightgray";

  const summaryContainer = document.createElement("div");
  summaryContainer.id = "summaryContainer";
  summaryContainer.innerHTML = `
    <p style="margin: 0; font-weight: bold;">요약:</p>
    <p style="white-space: normal; word-break: break-word; max-width: 400px;">${summary}</p>
    <div style="margin-top: 10px;">
      <strong>감정 분석 비율:</strong>
      <div style="display: flex; width: 100%; height: 10px; border: 1px solid black; margin-top: 5px;">
        <div style="width: ${sentimentStats.positive}%; background: lightgreen;"></div>
        <div style="width: ${sentimentStats.neutral}%; background: lightgray;"></div>
        <div style="width: ${sentimentStats.negative}%; background: lightcoral;"></div>
      </div>
      <p style="margin: 5px 0 0; font-size: 12px;">
        긍정: ${sentimentStats.positive}% | 중립: ${sentimentStats.neutral}% | 부정: ${sentimentStats.negative}%
      </p>
    </div>
    <button id="closeSummary" style="margin-top:5px; padding:2px 5px; background:#333; color:white; border:none; cursor:pointer;">닫기</button>
  `;
  summaryContainer.style = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: ${sentimentColor};
    border: 1px solid black;
    padding: 10px;
    z-index: 9999;
  `;
  document.body.appendChild(summaryContainer);

  // 닫기 버튼 기능
  document.getElementById("closeSummary").addEventListener("click", () => {
    summaryContainer.remove();
  });
}

// 요약 결과를 localStorage에 최대 5개 저장 (중복 방지)
function saveSummaryRecord(summary) {
  let history = JSON.parse(localStorage.getItem("summaryHistory")) || [];
  if (summary && typeof summary === "string") {
    history.unshift(summary.trim());
    const uniqueHistory = Array.from(new Set(history));
    localStorage.setItem("summaryHistory", JSON.stringify(uniqueHistory.slice(0, 5)));
  }
}

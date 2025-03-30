// popup_fixed.js - 진행 메시지 관리 및 content.js에 요약 요청 전달

document.addEventListener("DOMContentLoaded", () => {
  // 팝업 요소 참조
  const summarizeButton = document.getElementById("summarizeButton");
  const historyButton = document.getElementById("viewHistoryButton");
  const summaryLengthSelect = document.getElementById("summaryLength");
  const progressMessage = document.getElementById("progressMessage");

  // 필수 요소가 누락된 경우 오류 처리
  if (!summarizeButton || !summaryLengthSelect || !progressMessage) {
    console.error("popup.html 요소를 찾을 수 없습니다.");
    return;
  }

  // 요약 실행 버튼 클릭 시 동작
  summarizeButton.addEventListener("click", () => {
    const selectedLength = summaryLengthSelect.value;
    localStorage.setItem("summaryLength", selectedLength); // 선택한 요약 길이 저장

    // 요약 진행 중 메시지 출력
    progressMessage.textContent = "요약을 진행 중입니다...";

    // 현재 탭의 content.js로 메시지 전송하여 분석 시작
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "startAnalysis"
      });
    });
  });

  // 최근 요약 보기 버튼 클릭 시 동작
  historyButton?.addEventListener("click", () => {
    const history = JSON.parse(localStorage.getItem("summaryHistory")) || [];
    const historyList = document.getElementById("historyList");
    const resultDiv = document.getElementById("result");
    const sentimentDiv = document.getElementById("sentiment");

    // 이전 출력 결과 초기화
    if (resultDiv) resultDiv.innerHTML = "";
    if (sentimentDiv) sentimentDiv.innerHTML = "";
    if (progressMessage) progressMessage.innerHTML = "";

    // 저장된 요약 내역 출력
    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = "<p>저장된 요약이 없습니다.</p>";
      } else {
        historyList.innerHTML = "<p><strong>최근 요약</strong></p><ul style='padding-left: 15px;'>" +
          history.map((summary, i) => `<li style='margin-bottom: 5px;'>${i + 1}. ${summary}</li>`).join("") +
          "</ul>";
      }
    }
  });
});

// content.js에서 완료 메시지를 수신하면 진행 중 메시지 제거
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summaryComplete") {
    const progressMessage = document.getElementById("progressMessage");
    if (progressMessage) {
      progressMessage.textContent = "";
    }
  }
});
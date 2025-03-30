// background.js - GPT 요청 및 감정 분석 처리

// 서비스 워커가 로드되었는지 확인하는 로그
console.log("background.js 로드됨");

// content.js 또는 popup_fixed.js에서 메시지를 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzeText") {
    const inputText = message.text;
    let maxTokens = parseInt(message.lengthOption) || 400;

    console.log("요청 수신");
    console.log("입력 텍스트 길이:", inputText.length);
    console.log("요약 길이 옵션:", maxTokens);

    // 요약 길이 옵션에 따라 max_tokens 설정 변경
    if (maxTokens === 100) maxTokens = 200;
    else if (maxTokens === 300) maxTokens = 400;
    else if (maxTokens === 500) maxTokens = 600;

    // 입력 텍스트가 너무 짧은 경우 예외 처리
    if (!inputText || inputText.trim().length < 50) {
      console.warn("입력 텍스트 부족");
      sendResponse({
        summary: "요약할 텍스트가 제공되지 않았습니다.",
        sentiment: "neutral",
        sentimentStats: {
          positive: 0,
          neutral: 100,
          negative: 0
        }
      });
      return true;
    }

    // GPT API 호출
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //apikey 입력 필요
        "Authorization": "Bearer apikey"
      },
      body: JSON.stringify({
        model: "gpt-4",
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: "너는 텍스트 요약 및 감정 분석을 수행하는 AI야. '요약:'이라는 단어는 포함하지 말고 순수한 요약만 반환해."
          },
          {
            role: "user",
            content: `다음 텍스트를 요약하고 감정을 분석해줘:\n\n${inputText}`
          }
        ]
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error("GPT 오류:", data.error.message);
          sendResponse({ error: `API 오류: ${data.error.message}` });
          return;
        }

        const responseText = data.choices?.[0]?.message?.content || "";
        console.log("GPT 응답 요약:", responseText);

        // 감정 분석 (단순 키워드 기반 분석)
        let sentiment = "neutral";
        let sentimentStats = { positive: 33, neutral: 34, negative: 33 };
        if (responseText.includes("긍정")) {
          sentiment = "positive";
          sentimentStats = { positive: 60, neutral: 30, negative: 10 };
        } else if (responseText.includes("부정")) {
          sentiment = "negative";
          sentimentStats = { positive: 10, neutral: 30, negative: 60 };
        }

        sendResponse({
          summary: responseText,
          sentiment,
          sentimentStats
        });
      })
      .catch(error => {
        console.error("API 요청 실패:", error);
        sendResponse({ error: `API 요청 실패: ${JSON.stringify(error)}` });
      });

    return true; // 비동기 응답을 위해 true 반환
  }
});
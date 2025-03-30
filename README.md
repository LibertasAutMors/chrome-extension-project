# 🧠 웹페이지 요약 및 감정 분석 크롬 확장 프로그램

> 웹페이지의 본문 텍스트를 추출하고, GPT API를 통해 내용을 요약하고 감정을 분석해 시각화하는 크롬 확장 프로그램입니다.

---

## 📌 주요 기능

- ✅ 웹페이지 본문 텍스트 자동 추출 (Readability.js 활용)
- ✅ GPT API를 통한 텍스트 요약 기능
- ✅ 요약된 텍스트의 감정 분석 (긍정 / 중립 / 부정)
- ✅ 감정 분석 결과를 시각화하여 사용자에게 제공
- ✅ 요약 히스토리 저장 및 불러오기 기능 (LocalStorage)

---

## 🧾 프로젝트 구조 설명
chrome-extension-project/
├── README.md             # 프로젝트 개요 및 사용법을 설명하는 파일
├── manifest.json         # 크롬 확장 프로그램의 메타데이터와 설정을 정의하는 파일
├── background.js         # 백그라운드 스크립트로, 확장 프로그램의 전역적인 이벤트와 상태를 관리
├── content.js            # 웹 페이지의 컨텍스트에서 실행되어 페이지의 내용을 조작하거나 정보를 추출
├── popup/
│   ├── popup.html        # 확장 프로그램 아이콘 클릭 시 나타나는 팝업의 구조를 정의
│   ├── popup.js          # 팝업의 동작과 이벤트 처리를 담당
│   └── popup.css         # 팝업의 스타일을 지정
├── icons/
│   ├── icon16.png        # 16x16 크기의 확장 프로그램 아이콘
│   ├── icon48.png        # 48x48 크기의 확장 프로그램 아이콘
│   └── icon128.png       # 128x128 크기의 확장 프로그램 아이콘
└── utils/
    ├── summarize.js      # 텍스트 요약 기능을 제공하는 유틸리티 스크립트
    └── sentiment.js      # 감정 분석 기능을 제공하는 유틸리티 스크립트


---

## ⚙️ 사용 기술 및 도구

- JavaScript (Vanilla)
- HTML, CSS
- Chrome Extension API (v3)
- GPT-3.5 API (OpenAI)
- Readability.js
- LocalStorage

---

## 🚀 설치 및 실행 방법

1. 이 저장소를 클론하거나 ZIP 다운로드

```bash
git clone https://github.com/LibertasAutMors/25.git

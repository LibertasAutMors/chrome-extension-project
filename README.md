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

- `manifest.json`  
  크롬 확장 프로그램의 메타데이터와 설정을 정의하는 파일. 어떤 스크립트를 언제 실행할지 정의함.

- `background.js`  
  확장 프로그램 설치 이벤트 처리 및 백엔드 작업을 담당하는 스크립트.

- `content.js`  
  웹페이지의 본문 텍스트를 추출하고, 분석 결과를 페이지에 반영하는 콘텐츠 스크립트.

- `popup.html`  
  확장 아이콘을 클릭했을 때 나타나는 팝업의 구조(HTML) 정의.

- `popup_fixed.js`  
  팝업의 동작을 제어하는 스크립트. 버튼 클릭 시 메시지를 보내고 결과를 출력함. (`popup.js` 역할)

- `Readability.js`  
  웹페이지에서 핵심 텍스트를 추출하기 위해 사용하는 외부 라이브러리.

- `icons/icon16.png`  
  브라우저 툴바에 표시되는 16x16 크기의 아이콘.

- `icons/icon48.png`  
  크롬 확장 관리 페이지 등에 표시되는 48x48 크기의 아이콘.

- `icons/icon128.png`  
  Chrome 웹스토어 및 설정 화면 등에 사용되는 128x128 크기의 아이콘.

- `README.md`  
  프로젝트 설명, 설치 방법, 기능 등을 정리한 문서.

---

## ⚙️ 사용 기술 및 도구

- JavaScript (Vanilla)
- HTML, CSS
- Chrome Extension API (v3)
- GPT-3.5 API (OpenAI)
- Readability.js
- LocalStorage

---

## 🧑‍💻 팀원 역할 분담

| 팀원          | 담당 역할                           |
|---------------|---------------------------------|
| **최재훈(팀장)**   | 프로그램 틀 제작 및 프로젝트 진행 리더  |
| **박상근님**      | PPT 제작                          |
| **최명균님**      | 추가 기능 개발                      |
| **박준하님**      | 발표 담당                         |
| **임수현님**      | 추가 기능 개발 및 Git 관리             |


## 🚀 설치 및 실행 방법

1. 이 저장소를 클론하거나 ZIP 다운로드

```bash
git clone https://github.com/LibertasAutMors/25.git

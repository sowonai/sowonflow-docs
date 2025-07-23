# 번역 스크립트 사용법

## OpenRouter AI 번역 (권장)

### 1. OpenRouter API 키 설정
```bash
export OPENROUTER_API_KEY="your_api_key_here"
```

### 2. 사용 가능한 무료 모델들
```bash
# Mistral 7B (기본값)
export OPENROUTER_MODEL="mistralai/mistral-7b-instruct:free"

# Meta Llama 3.1 8B
export OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct:free"

# Google Gemma 2 9B
export OPENROUTER_MODEL="google/gemma-2-9b-it:free"
```

### 3. 번역 실행
```bash
node translate-simple.js "ko/agent.md ko/models.md"
```

## 장점

### AI 번역 (OpenRouter) vs 구글 번역
- ✅ **컨텍스트 이해**: 기술 문서의 맥락을 이해하고 번역
- ✅ **전문 용어**: 프로그래밍 및 AI 관련 용어를 정확히 번역
- ✅ **자연스러운 문장**: 기계적이지 않은 자연스러운 영어
- ✅ **일관성**: 같은 용어를 일관되게 번역
- ✅ **무료**: OpenRouter의 무료 모델 사용 가능

### 예상 번역 품질 개선
```yaml
# 구글 번역 결과 (문제점)
system_prompt: |
  당신은 다음 분야를 전문으로 하는 법률 전문가입니다:
  -Conalization and review of contracts  # ❌ 오타
  -Recision compliance evaluation        # ❌ 오타
  
# AI 번역 결과 (개선됨)
system_prompt: |
  You are a legal expert specializing in the following areas:
  - Contract analysis and review         # ✅ 정확
  - Regulatory compliance evaluation     # ✅ 정확
```

## 폴백 시스템

API 키가 없거나 오류가 발생하면 자동으로 구글 번역으로 폴백됩니다.

```bash
# 구글 번역 폴백을 위해 translate-shell 설치
brew install translate-shell
```

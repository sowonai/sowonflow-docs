# 자동 번역 설정 가이드

이 프로젝트는 한국어 문서를 수정할 때마다 자동으로 영어 번역을 생성하는 GitHub Actions 워크플로우를 포함합니다.

## 작동 방식

1. `ko/` 폴더의 마크다운 파일을 수정하고 메인 브랜치에 푸시
2. GitHub Actions가 변경된 파일을 감지
3. 자동으로 번역을 수행하고 `en/` 폴더에 업데이트
4. 번역된 파일을 자동으로 커밋

## 번역 옵션 (자동 우선순위)

### 🥇 옵션 1: GitHub Models (권장, 무료)
**GitHub에서 제공하는 무료 AI 모델을 사용합니다.**

**장점:**
- ✅ **완전 무료** - 별도 API 키 불필요
- ✅ **높은 번역 품질** - GPT-4o-mini 사용
- ✅ **GitHub Actions 기본 제공** - 추가 설정 없음
- ✅ **기술 문서 최적화** - 마크다운 포맷팅 보존
- ✅ **문맥 이해** - 전체 문서 구조 파악

**자동 활성화:** GitHub Actions에서 `GITHUB_TOKEN`이 기본 제공되므로 별도 설정 불필요

### 🥈 옵션 2: OpenAI/Anthropic (백업)
GitHub Models가 실패할 경우 자동으로 사용됩니다.

**설정 방법 (선택적):**
- Repository Settings → Secrets → `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY` 추가

### 🥉 옵션 3: Google Translate (최후 수단)
모든 AI 서비스가 실패할 경우 기본 번역을 제공합니다.

## 지원하는 파일

- `ko/**/*.md`: 모든 한국어 마크다운 파일
- GitBook 구조 (SUMMARY.md 포함)
- 코드 블록과 YAML 프론트매터 보존

## 수동 번역 실행

로컬에서 번역을 테스트하려면:

```bash
cd .github/scripts

# GitHub Models 사용 (기본, 권장)
export GITHUB_TOKEN="your-github-token"
node translate-github.js "ko/README.md ko/agent.md"

# OpenAI 사용 (백업)
export OPENAI_API_KEY="your-openai-key"
node translate.js "ko/README.md ko/agent.md"

# Google Translate 사용 (무료, 기본 품질)
node translate-simple.js "ko/README.md ko/agent.md"
```

## 문제 해결

### 번역이 실행되지 않는 경우
1. GitHub Actions 탭에서 워크플로우 실행 상태 확인
2. 변경된 파일이 `ko/**/*.md` 패턴과 일치하는지 확인
3. API 키가 올바르게 설정되었는지 확인

### 번역 품질 개선
1. AI 번역 서비스 사용 (API 키 설정)
2. 한국어 원문의 문법과 구조 개선
3. 기술 용어의 일관성 유지

## 커스터마이징

### 번역 로직 수정
- `.github/scripts/translate-github.js`: GitHub Models + 백업 로직 (메인)
- `.github/scripts/translate.js`: OpenAI/Anthropic 전용
- `.github/scripts/translate-simple.js`: Google Translate 전용

### 워크플로우 수정
- `.github/workflows/translate-docs.yml`: GitHub Actions 설정

### 사용 모델 변경
`translate-github.js`에서 모델 변경:
```javascript
model: 'gpt-4o-mini', // 다른 GitHub Models로 변경 가능
// 예: 'gpt-4o', 'claude-3-haiku', 등
```

### 번역할 파일 패턴 변경
워크플로우 파일에서 `paths:` 섹션을 수정하세요:

```yaml
paths: 
  - 'ko/**/*.md'
  - '!ko/drafts/**'  # drafts 폴더 제외
```

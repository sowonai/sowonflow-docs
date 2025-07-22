# 에이전트

## 에이전트

에이전트는 자연어를 이해하고, 문제에 대해 추론하며, 대형 언어 모델(LLM)을 사용하여 작업을 실행할 수 있는 AI 기반 엔티티입니다. 이들은 `@sowonai/agent` 시스템의 핵심 구성 요소입니다.

### 에이전트란 무엇인가요?

에이전트는 다음과 같이 정의됩니다:

* **역할**: 에이전트가 전문화하는 분야 (예: 법률 전문가, 기술 분석가)
* **모델**: 사용할 LLM (예: OpenAI GPT-4, Mistral)
* **시스템 프롬프트**: 에이전트의 전문성과 행동을 정의하는 지침
* **도구**: 에이전트가 기능을 확장하기 위해 호출할 수 있는 선택적 함수

### 기본 에이전트 구성

#### 간단한 에이전트

```yaml
agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 여러 소스에서 정보를 찾고 종합하는 데 뛰어난
        연구 전문가입니다. 항상 잘 구조화되고 사실적인
        응답을 제공하세요.
```

#### 도구를 사용하는 에이전트

```yaml
agents:
  - id: "calculator_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        당신은 수학 어시스턴트입니다. 모든 수치 계산에는
        계산기 도구를 사용하세요.
      tools: ["calculator"]
```

### 전문화된 에이전트 예시

#### 법률 전문가

```yaml
agents:
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 법률 전문가입니다:
        - 계약서 분석 및 검토
        - 규정 준수 평가
        - 위험 평가
        - 법률 연구 및 문서화
        
        항상 규정 요구사항과 잠재적 위험에 주의를 기울여
        철저한 법률 평가를 제공하세요.
      tools: ["document_search"]
```

#### 기술 전문가

```yaml
agents:
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 기술 전문가입니다:
        - 소프트웨어 아키텍처 및 설계
        - 기술 평가 및 검토
        - 구현 계획
        - 성능 최적화
        
        실용적인 구현 고려사항과 함께 상세한 기술 분석을
        제공하세요.
```

#### 비즈니스 분석가

```yaml
agents:
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 비즈니스 분석가입니다:
        - 전략 계획 및 분석
        - 시장 조사 및 경쟁 분석
        - ROI 및 재무 영향 평가
        - 이해관계자 분석
        
        권장사항에서 비즈니스 가치와 전략적 함의에
        초점을 맞추세요.
```

### 완전한 워크플로우 예시

다음은 단일 에이전트를 사용하는 완전한 워크플로우입니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "문서 분석"
  description: "전문 에이전트로 문서 분석"

agents:
  - id: "document_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 문서 분석 전문가입니다. 문서를 철저히 분석하고
        다음을 포함한 구조화된 인사이트를 제공하세요:
        - 주요 발견사항 및 중요한 포인트
        - 잠재적 이슈나 우려사항
        - 실행 가능한 권장사항
        
        항상 읽기 쉽도록 헤더와 불릿 포인트로
        응답을 명확하게 구조화하세요.

nodes:
  start:
    type: "agent_task"
    agent: "document_analyst"
    next: "end"
  
  end:
    type: "end"
```

### 모델 구성

#### 지원되는 모델

```yaml
# OpenAI 모델
model: "openai/gpt-4"
model: "openai/gpt-3.5-turbo"

# Anthropic 모델
model: "anthropic/claude-3-sonnet"
model: "anthropic/claude-3-haiku"

# 로컬/Ollama 모델
model: "ollama/llama3"
model: "ollama/mistral"
```

#### 모델 매개변수

```yaml
agents:
  - id: "creative_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: "당신은 창의적 글쓰기 어시스턴트입니다."
      temperature: 0.9        # 창의성을 위해 높게 설정
      max_tokens: 2000        # 응답 길이 제한
      timeout: 30000          # 30초 타임아웃
```

### 사용 가능한 도구

#### 내장 도구

```yaml
tools:
  - "calculator"           # 수학적 계산
  - "current_time"         # 현재 날짜/시간 가져오기
  - "document_section"     # 문서 섹션 검색
```

#### 도구 사용 예시

```yaml
agents:
  - id: "data_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 데이터 분석가입니다. 수학적 계산에는 계산기 도구를,
        분석에서 오늘 날짜를 참조할 때는 current_time 도구를
        사용하세요.
      tools: ["calculator", "current_time"]
```

### 모범 사례

#### 시스템 프롬프트 가이드라인

1. **구체적으로 작성**: 에이전트의 역할과 전문성을 명확히 정의
2. **기대사항 설정**: 에이전트가 어떻게 응답해야 하는지 설명
3. **컨텍스트 포함**: 관련 배경 정보 제공
4. **형식 지침**: 출력 형식 선호도 명시

#### 예시: 잘 구조화된 시스템 프롬프트

```yaml
system_prompt: |
  당신은 SaaS 회사의 고객 서비스 에이전트입니다.
  
  전문 분야:
  - 제품 기능 및 제한사항
  - 청구 및 구독 관리
  - 기본 기술 문제 해결
  - 계정 관리 절차
  
  가이드라인:
  - 항상 도움이 되고, 전문적이며, 공감적으로 대응
  - 필요할 때 단계별 지침 제공
  - 문제를 해결할 수 없으면 적절히 에스컬레이션
  - 이슈를 더 잘 이해하기 위해 명확한 질문 하기
  
  응답 형식:
  - 명확하고 간결한 언어 사용
  - 헤더와 불릿 포인트로 응답 구조화
  - 도움이 될 때 관련 링크나 참조 포함
```

#### 성능 팁

1. **적절한 모델 선택**: 기본 작업에는 더 간단한 모델 사용
2. **프롬프트 최적화**: 시스템 프롬프트를 집중적이고 명확하게 유지
3. **도구 제한**: 에이전트가 실제로 필요한 도구만 포함
4. **타임아웃 설정**: 적절한 응답 타임아웃 구성

#### 일반적인 패턴

**질문-답변 에이전트**

```yaml
agents:
  - id: "qa_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        당신은 질문에 명확하고 간결하게 답변하는 도움이 되는
        어시스턴트입니다. 모르는 것이 있으면 추측하기보다는
        솔직하게 모른다고 하세요.
```

**작업 실행 에이전트**

```yaml
agents:
  - id: "task_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 작업 실행 전문가입니다. 복잡한 요청을
        실행 가능한 단계로 나누고 상세한 구현 가이드를
        제공하세요.
      tools: ["calculator", "current_time"]
```

### 에이전트 테스트

#### 간단한 테스트 워크플로우

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "에이전트 테스트"

agents:
  - id: "test_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        당신은 테스트 에이전트입니다. 모든 요청에 도움이 되도록
        응답하고 당신의 능력을 명확하게 보여주세요.

nodes:
  start:
    type: "agent_task"
    agent: "test_agent"
    next: "end"
  
  end:
    type: "end"
```

다양한 입력으로 이 워크플로우를 테스트하여 에이전트의 행동을 검증하세요:

* 간단한 질문
* 복잡한 분석 요청
* 도구 사용이 필요한 작업
* 엣지 케이스 및 오류 조건

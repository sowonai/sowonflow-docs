

# 수퍼바이저

## 수퍼바이저란?

수퍼바이저는 복잡한 작업을 처리하기 위해 여러 에이전트를 조율하고 조정하는 전문화된 에이전트입니다. 사용자 요청을 분석하고, 적절한 에이전트를 선택하며, 다면적인 문제를 해결하기 위한 동적 워크플로우를 생성합니다.

### 주요 역할

* **복잡한 요청을 분석**하고 관리 가능한 작업으로 나눔
* **적절한 에이전트를 선택**하여 관리팀에서 배정
* **요청 유형에 따른 동적 워크플로우** 생성
* **여러 전문 에이전트 간 실행 조정**
* **다양한 에이전트의 결과를 종합**하여 일관된 응답 제공

---


---

## 간단한 수퍼바이저 예시

가장 기본적인 수퍼바이저 정의는 다음과 같이 작성할 수 있습니다:

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "parallel"  # sequential, parallel, branch, auto 중 선택
      system_prompt: |
        당신은 전문 에이전트들과 함께 작업을 조율하는 프로젝트 감독자입니다.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

---

## supervisor_mode로 워크플로우 패턴 지정

수퍼바이저 타입에서는 워크플로우 실행 패턴을 명시적으로 지정할 수 있습니다. `supervisor_mode` 속성으로 아래 네 가지 패턴 중 하나를 선택할 수 있습니다:

* `sequential`: 에이전트들을 순차적으로 실행
* `parallel`: 에이전트들을 병렬로 실행 후 결과 종합
* `branch`: 조건에 따라 특정 에이전트(들)만 선택 실행 (택일)
* `auto`: AI가 요청을 분석해서 최적의 모드 자동 선택 (기본값)

---



## 관리되는 에이전트 예시

수퍼바이저가 조정할 수 있는 전문 에이전트들을 함께 정의할 수 있습니다:

```yaml
agents:
  # 감독자
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "branch"  # sequential, parallel, branch, auto 중 선택
      system_prompt: |
        당신은 전문 컨설턴트들을 관리하는 감독자입니다.
        요청에 따라 적절한 워크플로우를 supervisor_mode에 따라 생성하세요.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  # 관리되는 에이전트들
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 계약서 분석, 규정 준수, 법적 위험 평가를 전문으로 하는 법률 전문가입니다.
  
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        당신은 소프트웨어 아키텍처, 기술 평가, 구현 계획을 전문으로 하는 기술 전문가입니다.
  
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        당신은 전략 계획, 시장 분석, ROI 평가를 전문으로 하는 비즈니스 분석가입니다.
```




---

## supervisor_mode 상세 스펙

수퍼바이저 타입에서는 워크플로우 실행 패턴을 명시적으로 지정할 수 있습니다. `supervisor_mode` 속성으로 아래 네 가지 패턴 중 하나를 선택할 수 있습니다:

* `sequential`: 에이전트들을 순차적으로 실행
* `parallel`: 에이전트들을 병렬로 실행 후 결과 종합
* `branch`: 조건에 따라 특정 에이전트(들)만 선택 실행 (택일)
* `auto`: AI가 요청을 분석해서 최적의 모드 자동 선택 (기본값)

supervisor_mode 값에 따라 워크플로우 실행 방식이 달라집니다:

* **sequential (순차)**: 작업이 순서대로 실행됩니다
  ```
  요청 → 법률 검토 → 기술 평가 → 비즈니스 분석 → 결과
  ```

* **parallel (병렬)**: 여러 전문가가 동시에 분석합니다
  ```
  요청 → [법률 전문가, 기술 전문가, 비즈니스 분석가] → 종합 → 결과
  ```

* **branch (택일)**: 요청에 따라 한 전문가만 선택적으로 실행
  ```
  요청 → 분석 → 적절한 전문가로 분기 → 결과
  ```

* **auto (자동)**: AI가 요청을 분석해 최적의 패턴을 자동 선택
  ```
  요청 → 분석 → (sequential/parallel/branch 중 하나) → 결과
  ```



## 완전한 워크플로우 예시

실제 워크플로우 전체 예시는 다음과 같습니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "다중 전문가 분석"
  description: "감독자가 전문가 분석을 조정"

agents:
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "auto"  # sequential, parallel, branch, auto 중 선택
      system_prompt: |
        당신은 전문가 분석을 조정하는 감독자입니다.
        supervisor_mode에 따라 워크플로우 패턴을 결정하세요.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 법률 전문가입니다. 다음에 집중하세요:
        - 규정 준수
        - 계약 조건 및 위험
        - 법적 함의
  
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        당신은 기술 전문가입니다. 다음에 집중하세요:
        - 구현 가능성
        - 기술 아키텍처
        - 성능 고려사항
  
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        당신은 비즈니스 분석가입니다. 다음에 집중하세요:
        - 전략적 영향
        - 시장 고려사항
        - ROI 및 비즈니스 가치

nodes:
  start:
    type: "agent_task"
    agent: "supervisor"
    next: "end"
  
  end:
    type: "end"
```



## 내장 감독자 도구

감독자는 자동으로 전문화된 도구에 접근할 수 있습니다. supervisor_mode에 따라 도구의 동작 방식도 달라집니다.

* **workflow_template_selector**: supervisor_mode가 auto일 때, 사용자 요청을 분석해 적절한 워크플로우 패턴을 선택합니다.
  - sequential, parallel, branch 중 어떤 패턴이 필요한지 결정
  - 참여해야 할 에이전트 선택
  - 결정에 대한 근거 제공

* **dynamic_workflow_executor**: supervisor_mode에 따라 워크플로우를 동적으로 생성하고 실행합니다.
  - 선택된 패턴(sequential, parallel, branch, auto)에 따라 워크플로우 구성
  - 에이전트 실행 조정
  - 에이전트 간 데이터 흐름 처리
  - 최종 결과 종합



## 시스템 프롬프트 모범 사례

supervisor_mode를 활용한 시스템 프롬프트 작성 예시입니다:

```yaml
system_prompt: |
  당신은 전문 컨설턴트 팀을 관리하는 프로젝트 감독자입니다.
  supervisor_mode에 따라 워크플로우 패턴을 결정하세요.
  
  supervisor_mode:
    - sequential: 특정 순서로 작업을 수행해야 할 때
    - parallel: 다양한 관점이 필요할 때
    - branch: 조건에 따라 한 전문가만 선택해야 할 때
    - auto: AI가 판단해서 최적의 패턴 선택
  
  사용 가능한 전문가:
    - legal_expert: 계약서 분석, 준수, 법적 위험
    - tech_expert: 기술적 타당성, 아키텍처, 구현
    - business_analyst: 전략, 시장 분석, 비즈니스 영향
  
  항상 supervisor_mode와 워크플로우 선택을 설명하고 포괄적인 결과를 제공하세요.
```



## 일반적인 사용 사례

supervisor_mode별 대표적인 활용 예시는 다음과 같습니다:

#### 제품 개발 분석
```
사용자: "새로운 AI 기반 기능 출시 타당성을 평가해주세요"
감독자: supervisor_mode: parallel → 법률(준수), 기술(구현), 비즈니스(시장) 동시 분석
```

#### 계약서 검토 프로세스
```
사용자: "이 파트너십 계약서를 검토해주세요"
감독자: supervisor_mode: sequential → 법률(조건) → 비즈니스(전략적 영향) → 기술(통합) 순차 분석
```

#### 전략적 의사결정
```
사용자: "클라우드 인프라로 마이그레이션해야 할까요?"
감독자: supervisor_mode: parallel → 모든 전문가가 동시 분석 → 종합
```

#### 특정 전문가만 필요한 경우 (branch)
```
사용자: "이 기능에 대한 기술적 고려사항은 무엇인가요?"
감독자: supervisor_mode: branch → tech_expert만 실행
```



## 감독자 테스트

아래와 같이 supervisor_mode별 테스트 워크플로우를 작성할 수 있습니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "감독자 테스트"

agents:
  - id: "test_supervisor"
    inline:
      type: "supervisor"
      model: "google/gemini-2.5-pro"
      supervisor_mode: "parallel"
      system_prompt: |
        당신은 테스트 감독자입니다. supervisor_mode에 따라 워크플로우를 생성하세요.
      agents: ["expert_a", "expert_b"]
  
  - id: "expert_a"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: "당신은 전문가 A입니다. 모든 주제에 대해 관점 A를 제공하세요."
  
  - id: "expert_b"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "당신은 전문가 B입니다. 모든 주제에 대해 관점 B를 제공하세요."

nodes:
  start:
    type: "agent_task"
    agent: "test_supervisor"
    next: "end"
  
  end:
    type: "end"
```

다음과 같은 요청으로 테스트하세요:

* supervisor_mode: parallel → "원격 근무의 장단점을 분석해주세요"
* supervisor_mode: sequential → "프로젝트 출시를 위한 단계별 계획을 세워주세요"
* supervisor_mode: branch → "이 기능에 대한 기술적 고려사항은 무엇인가요?"

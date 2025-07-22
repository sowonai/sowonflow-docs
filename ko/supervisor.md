# 감독자 (Supervisor)

## 감독자

감독자는 복잡한 작업을 처리하기 위해 여러 에이전트를 조율하고 조정하는 전문화된 에이전트입니다. 사용자 요청을 분석하고, 적절한 에이전트를 선택하며, 다면적인 문제를 해결하기 위한 동적 워크플로우를 생성합니다.

### 감독자란 무엇인가요?

감독자는 다음을 수행할 수 있는 에이전트입니다:

* **복잡한 요청을 분석**하고 관리 가능한 작업으로 나눔
* **적절한 에이전트를 선택**하여 관리팀에서 배정
* **요청 유형에 따른 동적 워크플로우** 생성
* **여러 전문 에이전트 간 실행 조정**
* **다양한 에이전트의 결과를 종합**하여 일관된 응답 제공

### 기본 감독자 구성

#### 간단한 감독자

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 전문 에이전트들과 함께 작업을 조율하는 
        프로젝트 감독자입니다.
        
        중요: 워크플로우 관리를 위해 항상 도구를 사용하세요:
        1. 요청 분석을 위해 'workflow_template_selector' 사용
        2. 워크플로우 생성 및 실행을 위해 'dynamic_workflow_executor' 사용
        
        사용 가능한 에이전트: legal_expert, tech_expert, business_analyst
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

#### 관리되는 에이전트

감독자가 조정할 수 있는 전문 에이전트를 정의합니다:

```yaml
agents:
  # 감독자
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 전문 컨설턴트들을 관리하는 감독자입니다.
        요청에 따라 적절한 워크플로우를 생성하기 위해 도구를 사용하세요.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  # 관리되는 에이전트들
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 계약서 분석, 규정 준수, 법적 위험 평가를
        전문으로 하는 법률 전문가입니다.
        
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 소프트웨어 아키텍처, 기술 평가, 구현 계획을
        전문으로 하는 기술 전문가입니다.
        
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 전략 계획, 시장 분석, ROI 평가를
        전문으로 하는 비즈니스 분석가입니다.
```

### 워크플로우 패턴

감독자는 요청에 따라 다양한 워크플로우 패턴을 생성할 수 있습니다:

#### 순차 패턴

작업이 순서대로 실행됩니다:

```
요청 → 법률 검토 → 기술 평가 → 비즈니스 분석 → 결과
```

#### 병렬 검토 패턴

여러 전문가가 동시에 분석합니다:

```
요청 → [법률 전문가, 기술 전문가, 비즈니스 분석가] → 종합 → 결과
```

#### 조건부 패턴

요청 유형에 따른 동적 라우팅:

```
요청 → 분석 → 적절한 전문가(들)로 라우팅 → 결과
```

### 완전한 워크플로우 예시

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
      model: "openai/gpt-4"
      system_prompt: |
        당신은 전문가 분석을 조정하는 감독자입니다.
        
        워크플로우 패턴:
        - 순차: 단계별 프로세스 (법률 → 기술 → 비즈니스)
        - 병렬 검토: 포괄적인 다각도 분석
        - 단일 전문가: 도메인별 특정 질문
        
        중요: 항상 도구를 사용하세요:
        1. 'workflow_template_selector' - 요청 분석 및 패턴 선택
        2. 'dynamic_workflow_executor' - 워크플로우 생성 및 실행
        
        팀원: legal_expert, tech_expert, business_analyst
      agents: ["legal_expert", "tech_expert", "business_analyst"]
        
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 법률 전문가입니다. 다음에 집중하세요:
        - 규정 준수
        - 계약 조건 및 위험
        - 법적 함의
        
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 기술 전문가입니다. 다음에 집중하세요:
        - 구현 가능성
        - 기술 아키텍처
        - 성능 고려사항
        
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
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

### 내장 감독자 도구

감독자는 자동으로 전문화된 도구에 접근할 수 있습니다:

#### workflow_template_selector

사용자 요청을 분석하고 적절한 워크플로우 패턴을 선택합니다:

* 순차, 병렬 또는 조건부 패턴이 필요한지 결정
* 참여해야 할 에이전트 선택
* 결정에 대한 근거 제공

#### dynamic_workflow_executor

워크플로우를 동적으로 생성하고 실행합니다:

* 선택된 템플릿을 기반으로 워크플로우 구성
* 에이전트 실행 조정
* 에이전트 간 데이터 흐름 처리
* 최종 결과 종합

### 시스템 프롬프트 모범 사례

#### 필수 지침

1. **도구 사용 의무화**: 감독자가 항상 도구를 사용하도록 요구
2. **명확한 프로세스**: 단계별 워크플로우 생성 프로세스 정의
3. **에이전트 인식**: 사용 가능한 에이전트와 능력 목록
4. **패턴 가이드**: 다양한 워크플로우 패턴 사용 시기 설명

#### 예시: 포괄적인 시스템 프롬프트

```yaml
system_prompt: |
  당신은 전문 컨설턴트 팀을 관리하는 프로젝트 감독자입니다.
  
  필수 프로세스:
  1. 항상 먼저 'workflow_template_selector'를 사용하여 요청 분석
  2. 항상 'dynamic_workflow_executor'를 사용하여 워크플로우 생성 및 실행
  3. 도구 사용 없이 수동 응답 제공 금지
  
  사용 가능한 전문가:
  - legal_expert: 계약서 분석, 준수, 법적 위험
  - tech_expert: 기술적 타당성, 아키텍처, 구현
  - business_analyst: 전략, 시장 분석, 비즈니스 영향
  
  워크플로우 패턴:
  - 순차: 특정 순서로 작업을 수행해야 할 때
  - 병렬 검토: 다양한 관점이 필요할 때
  - 단일 전문가: 도메인별 특정 질문
  
  결정 가이드라인:
  - 복잡한 프로젝트 → 종합이 포함된 병렬 검토
  - 구현 계획 → 순차 (법률 → 기술 → 비즈니스)
  - 특정 전문성 필요 → 단일 전문가
  - 다면적 분석 → 병렬 검토
  
  항상 워크플로우 선택을 설명하고 포괄적인 결과를 제공하세요.
```

### 일반적인 사용 사례

#### 제품 개발 분석

```
사용자: "새로운 AI 기반 기능 출시 타당성을 평가해주세요"
감독자: 병렬 검토 → 법률(준수), 기술(구현), 비즈니스(시장)
```

#### 계약서 검토 프로세스

```
사용자: "이 파트너십 계약서를 검토해주세요"
감독자: 순차 → 법률(조건) → 비즈니스(전략적 영향) → 기술(통합)
```

#### 전략적 의사결정

```
사용자: "클라우드 인프라로 마이그레이션해야 할까요?"
감독자: 병렬 검토 → 모든 전문가가 동시 분석 → 종합
```

### 감독자 테스트

#### 간단한 테스트

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "감독자 테스트"

agents:
  - id: "test_supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 테스트 감독자입니다. 도구를 사용하여 요청을
        분석하고 팀과 함께 적절한 워크플로우를 생성하세요.
      agents: ["expert_a", "expert_b"]
        
  - id: "expert_a"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: "당신은 전문가 A입니다. 모든 주제에 대해 관점 A를 제공하세요."
        
  - id: "expert_b"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
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

* "원격 근무의 장단점을 분석해주세요" (병렬 검토)
* "프로젝트 출시를 위한 단계별 계획을 세워주세요" (순차)
* "이 기능에 대한 기술적 고려사항은 무엇인가요?" (단일 전문가)

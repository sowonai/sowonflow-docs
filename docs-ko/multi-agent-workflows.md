# 멀티 에이전트 워크플로우

## 개요

SowonFlow는 여러 전문 에이전트를 조율하여 복잡한 비즈니스 시나리오를 처리할 수 있는 정교한 멀티 에이전트 워크플로우를 지원합니다. 이를 통해 병렬 처리, 지능형 라우팅, 협업 문제 해결이 가능합니다.

## 주요 기능

### 병렬 처리
여러 에이전트를 동시에 실행하여 응답 시간을 단축하고 복잡한 쿼리를 효율적으로 처리합니다.

### 지능형 라우팅  
콘텐츠 분석을 기반으로 사용자 쿼리를 가장 적절한 에이전트로 자동 라우팅합니다.

### 상태 관리
워크플로우 실행 전반에 걸쳐 에이전트 간 데이터와 컨텍스트를 공유합니다.

### 결과 결합
여러 에이전트의 응답을 일관성 있고 포괄적인 답변으로 종합합니다.

## 기본 멀티 에이전트 구조

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "멀티 에이전트 예제"
  description: "여러 전문 에이전트를 조율합니다"

state:
  variables:
    - name: "route_decision"
      initial_value: null
    - name: "expert_response"
      initial_value: null

agents:
  - id: "coordinator"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "당신은 여러 전문 에이전트를 조율하는 역할을 합니다."
  
  - id: "expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini" 
      system_prompt: "당신은 특정 도메인의 전문가입니다."
      tools: ["도메인_검색"]

nodes:
  start:
    type: "agent_task"
    agent: "coordinator"
    output:
      to_state: "route_decision"
    next: "route_check"
    
  route_check:
    type: "branch"
    method: "condition"
    condition: "route_decision"
    branches:
      "expert": "expert_task"
    default: "direct_answer"
    
  expert_task:
    type: "agent_task"
    agent: "expert"
    output:
      to_state: "expert_response"
    next: "combine_results"
    
  combine_results:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "결과를 결합하세요: {{expert_response}}"
    next: "end"
    
  direct_answer:
    type: "agent_task"
    agent: "coordinator"
    next: "end"
    
  end:
    type: "end"
```

## 고급 패턴

### 병렬 실행

```yaml
nodes:
  parallel_processing:
    type: "parallel"
    branches: ["agent_a_task", "agent_b_task"]
    
  agent_a_task:
    type: "agent_task"
    agent: "agent_a"
    next: "join"
    
  agent_b_task:
    type: "agent_task"
    agent: "agent_b"
    next: "join"
    
  join:
    type: "join"
    next: "combine_results"
```

### 조건부 분기

```yaml
nodes:
  decision_point:
    type: "branch"
    method: "condition"
    condition: "analysis_result"
    branches:
      "complex": "expert_team"
      "simple": "single_agent"
      "urgent": "priority_handler"
    default: "general_handler"
```

## 실제 사례: 비즈니스 쿼리 라우터

비즈니스 쿼리를 적절한 부서로 라우팅하는 방법을 보여주는 예제입니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "비즈니스 쿼리 라우터"
  description: "쿼리를 HR, 일정관리, 또는 재무 전문가에게 라우팅"

state:
  variables:
    - name: "query_type"
      initial_value: null
    - name: "hr_response"
      initial_value: null
    - name: "calendar_response"
      initial_value: null

agents:
  - id: "router"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "쿼리를 분석하고 적절한 부서를 결정합니다. HR, 일정관리, 둘다, 또는 일반으로 응답하세요."
      
  - id: "hr_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "당신은 HR 전문가입니다. 정책, 혜택, 직원 관련 쿼리를 처리합니다."
      tools: ["HR_정책_검색"]
      
  - id: "calendar_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "당신은 일정 관리 전문가입니다. 스케줄링과 가용성 쿼리를 처리합니다."
      tools: ["일정_검색"]

nodes:
  start:
    type: "agent_task"
    agent: "router"
    input:
      template: "이 쿼리를 분석하고 부서를 결정하세요: {{user_query}}"
    output:
      to_state: "query_type"
      format: "enum"
      schema:
        type: string
        enum: [HR, CALENDAR, BOTH, GENERAL]
    next: "route_query"
    
  route_query:
    type: "branch"
    method: "condition"
    condition: "query_type"
    branches:
      "BOTH": "parallel_processing"
      "HR": "hr_task"
      "CALENDAR": "calendar_task"
    default: "general_response"
    
  parallel_processing:
    type: "parallel"
    branches: ["hr_task", "calendar_task"]
    
  hr_task:
    type: "agent_task"
    agent: "hr_expert"
    input:
      template: "이 HR 쿼리를 처리하세요: {{user_query}}"
    output:
      to_state: "hr_response"
    next: "join_responses"
    
  calendar_task:
    type: "agent_task"
    agent: "calendar_expert"
    input:
      template: "이 일정 쿼리를 처리하세요: {{user_query}}"
    output:
      to_state: "calendar_response"
    next: "join_responses"
    
  join_responses:
    type: "join"
    next: "combine_responses"
    
  combine_responses:
    type: "agent_task"
    agent: "router"
    input:
      template: |
        원본 쿼리: {{user_query}}
        
        HR 응답: {{hr_response}}
        일정 응답: {{calendar_response}}
        
        위 정보를 결합하여 포괄적인 응답을 제공하세요.
    next: "end"
    
  general_response:
    type: "agent_task"
    agent: "router"
    input:
      template: "다음 쿼리에 일반적인 응답을 제공하세요: {{user_query}}"
    next: "end"
    
  end:
    type: "end"
```

## 노드 유형 참조

### 병렬 노드
여러 브랜치를 동시에 실행합니다:
```yaml
parallel_node:
  type: "parallel" 
  branches: ["task1", "task2", "task3"]
```

### 조인 노드
모든 병렬 브랜치가 완료될 때까지 대기합니다:
```yaml
join_node:
  type: "join"
  next: "next_step"
```

### 브랜치 노드
조건에 따라 실행을 라우팅합니다:
```yaml
branch_node:
  type: "branch"
  method: "condition"
  condition: "state_variable"
  branches:
    "value1": "path1"
    "value2": "path2" 
  default: "default_path"
```

## 모범 사례

### 1. 에이전트 전문화
명확하고 집중된 책임을 가진 에이전트를 만드세요:
```yaml
agents:
  - id: "data_analyst"
    system_prompt: "당신은 데이터를 분석하고 인사이트를 제공합니다."
  - id: "report_writer" 
    system_prompt: "당신은 전문적인 보고서를 작성합니다."
```

### 2. 상태 관리
의미 있는 변수명과 적절한 스코핑을 사용하세요:
```yaml
state:
  variables:
    - name: "analysis_result"
      initial_value: null
    - name: "report_status"
      initial_value: "pending"
```

### 3. 오류 처리
브랜치 노드에 항상 기본 경로를 제공하세요:
```yaml
decision_node:
  type: "branch"
  branches:
    "success": "continue_processing"
    "error": "error_handler"
  default: "fallback_handler"  # 항상 포함하세요
```

### 4. 성능 최적화
- 독립적인 작업에 병렬 처리 사용
- 에이전트 시스템 프롬프트를 집중적이고 간결하게 유지
- 병렬 브랜치 수 제한 (권장: 2-4개)

## 일반적인 패턴

### 마스터-워커 패턴
하나의 조율 에이전트가 여러 작업자 에이전트를 관리합니다:
```yaml
agents:
  - id: "master"
    system_prompt: "전문가들에게 작업을 조율하고 위임합니다."
  - id: "worker_1" 
    system_prompt: "특정 작업 유형 A를 처리합니다."
  - id: "worker_2"
    system_prompt: "특정 작업 유형 B를 처리합니다."
```

### 파이프라인 패턴
전문 에이전트를 통한 순차적 처리:
```yaml
nodes:
  extract:
    type: "agent_task"
    agent: "extractor"
    next: "transform"
  transform:
    type: "agent_task" 
    agent: "transformer"
    next: "load"
  load:
    type: "agent_task"
    agent: "loader"
    next: "end"
```

### 합의 패턴
의사결정을 위해 여러 에이전트가 입력을 제공합니다:
```yaml
nodes:
  parallel_analysis:
    type: "parallel"
    branches: ["expert_1", "expert_2", "expert_3"]
  # ... 개별 전문가 작업들
  consensus:
    type: "agent_task"
    agent: "decision_maker"
    input:
      template: "다음을 기반으로 결정하세요: {{expert_1_result}}, {{expert_2_result}}, {{expert_3_result}}"
    next: "end"
```

## 문제 해결

### 일반적인 문제들

1. **병렬 브랜치가 완료되지 않음**: 모든 병렬 브랜치가 조인 노드를 가리키는 적절한 `next` 설정이 있는지 확인하세요.

2. **상태 변수가 업데이트되지 않음**: 에이전트 작업에서 `output.to_state`가 올바르게 설정되었는지 확인하세요.

3. **브랜치 조건이 작동하지 않음**: 조건 변수가 상태에 존재하고 예상 값을 가지는지 확인하세요.

4. **성능 문제**: 병렬 브랜치를 제한하고 더 빠른 응답을 위해 에이전트 프롬프트를 최적화하세요.

### 디버깅 팁

1. 워크플로우 상태 리스너를 사용하여 실행을 모니터링하세요:
```javascript
workflow.addStateListener((state) => {
  console.log("현재 상태:", state);
});
```

2. 디버깅을 위해 에이전트 프롬프트에 로깅을 추가하세요:
```yaml
system_prompt: "당신은 전문가입니다. 디버깅을 위해 항상 [에이전트_이름]으로 응답을 시작하세요."
```

3. 워크플로우에 통합하기 전에 개별 에이전트를 테스트하세요.

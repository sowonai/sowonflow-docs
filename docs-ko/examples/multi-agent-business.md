# 멀티 에이전트 비즈니스 쿼리 시스템

이 예제는 비즈니스 쿼리를 전문 부서(HR 및 일정관리)로 라우팅하고 응답을 결합하는 실제 멀티 에이전트 워크플로우를 보여줍니다.

## 사용 사례

회사에서 다음과 같은 직원 쿼리를 처리할 수 있는 AI 어시스턴트를 만들고자 합니다:
- HR 정책 (출장비, 휴가일 등)
- 일정 정보 (스케줄, 가용성 등)
- 두 부서 모두가 필요한 복합 쿼리

## 워크플로우 기능

- **지능형 라우팅**: 어느 부서에 문의해야 하는지 자동으로 결정
- **병렬 처리**: 더 빠른 응답을 위해 여러 부서에 동시에 쿼리
- **결과 종합**: 여러 소스의 정보를 일관성 있는 답변으로 결합

## 완전한 구현

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "비즈니스 쿼리 멀티 에이전트 시스템"
  description: "비즈니스 쿼리를 적절한 전문가에게 라우팅하고 결과를 결합"
  version: "0.1.0"

# 워크플로우 상태 변수
state:
  variables:
    - name: "라우팅_결정"
      initial_value: null
    - name: "일정_응답"
      initial_value: null
    - name: "HR_응답"
      initial_value: null
  persistence: "session"

# 에이전트 정의
agents:
  - id: "마스터_에이전트"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        당신은 여러 전문 에이전트를 관리하는 마스터 조율 에이전트입니다. 
        
        당신의 업무는:
        1. 사용자 쿼리를 분석하여 필요한 정보 유형을 결정
        2. 쿼리를 적절한 전문가에게 라우팅
        3. 여러 에이전트의 응답을 포괄적인 답변으로 종합
        
        라우팅 결정을 위해서는 다음 값 중 정확히 하나로 응답하세요:
        - 일정관리: 일정/스케줄링 정보만 필요한 경우
        - HR: HR 정책/혜택 정보만 필요한 경우  
        - 둘다: 일정과 HR 정보가 모두 필요한 경우
        - 없음: 둘 다 필요 없고 직접 답변할 수 있는 경우
  
  - id: "일정_에이전트"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        당신은 일정 관리 및 스케줄링 전문가입니다. 일정 시스템에 접근할 수 있으며 다음을 수행할 수 있습니다:
        - 특정 날짜의 스케줄 검색
        - 가용성 확인
        - 일정 관련 정보 제공
        
        쿼리의 일정 및 스케줄링 측면에만 집중하세요.
        도구를 사용하여 관련 일정 정보를 검색하세요.
      tools: ["search_calendar"]
  
  - id: "HR_에이전트"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        당신은 HR 정책 전문가입니다. HR 시스템에 접근할 수 있으며 다음을 수행할 수 있습니다:
        - HR 정책 및 규정 검색
        - 혜택, 수당, 정책에 대한 정보 제공
        - 필요시 직원 정보 업데이트
        
        쿼리의 HR 정책 및 혜택 측면에만 집중하세요.
        도구를 사용하여 관련 HR 정보를 검색하세요.
      tools: ["search_hr", "update_userinfo"]

# 워크플로우 노드
nodes:
  start:
    type: "agent_task"
    agent: "마스터_에이전트"
    input:
      template: |
        이 사용자 쿼리를 분석하고 필요한 정보 유형을 결정하세요.
        
        사용자 쿼리: {{user_query}}
        
        다음 값 중 정확히 하나로 응답하세요:
        - 일정관리: 일정/스케줄링 정보가 필요한 경우
        - HR: HR 정책/혜택 정보가 필요한 경우
        - 둘다: 일정과 HR 정보가 모두 필요한 경우
        - 없음: 전문가 도움 없이 직접 답변할 수 있는 경우
    output:
      to_state: "라우팅_결정"
      format: "enum"
      schema:
        type: string
        enum: [둘다, 일정관리, HR, 없음]
    next: "경로_결정"
  
  경로_결정:
    type: "branch"
    method: "condition"
    condition: "라우팅_결정"
    branches:
      "둘다": "일정_HR_병렬"
      "일정관리": "일정_작업"
      "HR": "HR_작업"
    default: "직접_응답"
  
  # 두 부서 모두 필요한 쿼리의 병렬 처리
  일정_HR_병렬:
    type: "parallel"
    branches: ["일정_작업", "HR_작업"]
  
  일정_작업:
    type: "agent_task"
    agent: "일정_에이전트"
    input:
      template: |
        사용자 쿼리: {{user_query}}
        
        당신은 일정 전문가입니다. 이 쿼리의 일정/스케줄링 측면만 처리하세요.
        관련 일정 정보를 검색하고 결과를 제공하세요.
    output:
      to_state: "일정_응답"
      format: "text"
    next: "조인"
  
  HR_작업:
    type: "agent_task"
    agent: "HR_에이전트"
    input:
      template: |
        사용자 쿼리: {{user_query}}
        
        당신은 HR 전문가입니다. 이 쿼리의 HR 정책/혜택 측면만 처리하세요.
        관련 HR 정책을 검색하고 결과를 제공하세요.
    output:
      to_state: "HR_응답"
      format: "text"
    next: "조인"
  
  직접_응답:
    type: "agent_task"
    agent: "마스터_에이전트"
    input:
      template: "이 쿼리에 직접 답변해주세요: {{user_query}}"
    next: "end"
  
  # 병렬 브랜치 조인
  조인:
    type: "join"
    next: "결과_결합"

  # 전문가들의 결과 결합
  결과_결합:
    type: "agent_task"
    agent: "마스터_에이전트"
    input:
      template: |
        원본 사용자 쿼리: {{user_query}}
        
        다음 전문가 응답들을 종합하여 포괄적인 답변을 제공하세요:
        
        {{#if 일정_응답}}
        일정 정보: {{일정_응답}}
        {{/if}}
        
        {{#if HR_응답}}
        HR 정보: {{HR_응답}}
        {{/if}}
        
        사용자의 원래 질문에 답하는 명확하고 포괄적인 응답을 제공하세요.
    next: "end"
  
  end:
    type: "end"
```

## JavaScript 구현

```javascript
import { Workflow, createConfig } from '@sowonai/sowonflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// 에이전트를 위한 사용자 정의 도구 정의
const searchCalendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "특정 날짜의 일정 이벤트를 검색합니다.",
  schema: z.object({
    date: z.string().describe("검색할 날짜 (today, tomorrow, 또는 YYYY-MM-DD)"),
    query: z.string().optional().describe("선택적 검색 키워드")
  }),
  func: async ({ date, query }) => {
    // 모의 일정 데이터 - 실제 일정 API로 교체하세요
    if (date === 'today') {
      return '오늘 일정: 오전 9시 전략 회의, 오후 2시 제품 리뷰';
    } else if (date === 'tomorrow') {
      return '내일 일정: 오전 10시 팀 미팅';
    } else if (date.match(/\d{4}-\d{2}-\d{2}/)) {
      return `${date} 일정: 예약된 약속이 없습니다.`;
    }
    return '지정된 날짜에 이벤트가 없습니다.';
  }
});

const searchHRTool = new DynamicStructuredTool({
  name: "search_hr",
  description: "HR 정책 및 정보를 검색합니다.",
  schema: z.object({
    query: z.string().describe("HR 정보 검색 쿼리")
  }),
  func: async ({ query }) => {
    // 모의 HR 데이터 - 실제 HR 시스템 API로 교체하세요
    if (query.includes('출장') || query.includes('travel')) {
      return '출장비: 국내 출장 시 하루 20만원 지원. (출처: 출장 정책.pdf)';
    } else if (query.includes('휴가') || query.includes('vacation')) {
      return '연차 휴가: 연간 기본 15일 제공.';
    }
    return '이 쿼리에 대한 HR 정보를 찾을 수 없습니다.';
  }
});

const updateUserinfoTool = new DynamicStructuredTool({
  name: "update_userinfo",
  description: "HR 시스템에서 사용자 정보를 업데이트합니다.",
  schema: z.object({
    userId: z.string().describe("사용자 ID"),
    information: z.record(z.any()).describe("업데이트할 정보")
  }),
  func: async ({ userId, information }) => {
    return `사용자 ${userId} 정보가 업데이트되었습니다: ${JSON.stringify(information)}`;
  }
});

// 설정
const config = createConfig({
  apiKey: process.env.SOWONAI_API_KEY,
  spaceId: process.env.SOWONAI_SPACE_ID,
  baseUrl: process.env.SOWONAI_BASE_URL || 'http://localhost:3030'
});

// 워크플로우 생성 및 실행
async function runBusinessQuerySystem() {
  const workflow = new Workflow({
    mainWorkflow: yamlContent, // 위의 YAML 사용
    config: config,
    tools: [searchCalendarTool, searchHRTool, updateUserinfoTool]
  });

  // 디버깅을 위한 상태 리스너 추가
  workflow.addStateListener((state) => {
    const { messages, ...otherState } = state;
    console.log("[상태 변경]", otherState);
  });

  // 테스트 쿼리들
  const testQueries = [
    "오늘 일정이 어떻게 되나요?",
    "출장비는 얼마나 지원받을 수 있나요?", 
    "다음 주 수요일에 서울 출장을 계획하고 있는데, 출장비는 얼마이고 그날 일정에 충돌이 있나요?"
  ];

  for (const query of testQueries) {
    console.log(`\n=== 쿼리: ${query} ===`);
    
    const result = await workflow.ask(query);
    console.log("응답:", result.content);
    
    // 최종 상태 확인
    const finalState = workflow.getState();
    console.log("라우팅 결정:", finalState.라우팅_결정);
    console.log("일정 응답:", finalState.일정_응답);
    console.log("HR 응답:", finalState.HR_응답);
  }
}

// 시스템 실행
runBusinessQuerySystem().catch(console.error);
```

## 예상 결과

### 쿼리: "다음 주 수요일에 서울 출장을 계획하고 있는데, 출장비는 얼마이고 그날 일정에 충돌이 있나요?"

**실행 흐름:**
1. **마스터 에이전트**가 쿼리 분석 → `둘다` 결정 (일정 + HR 정보 필요)
2. **병렬 처리** 실행:
   - 일정 에이전트가 수요일 스케줄 검색
   - HR 에이전트가 출장 정책 검색
3. **조인**이 두 에이전트 완료 대기
4. **마스터 에이전트**가 응답들을 결합

**최종 응답:**
```
서울 출장 계획에 대해 알려드리겠습니다:

**일정**: 다음 주 수요일에는 예약된 일정이 없어서 출장에 문제가 없습니다.

**출장비**: 회사 정책에 따라 국내 출장 시 하루 20만원이 지원됩니다.

일정 충돌 없이 출장을 진행하실 수 있으며, 명확한 출장비 지원 가이드라인이 있습니다.
```

## 실증된 주요 이점

1. **자동 라우팅**: 시스템이 이 쿼리에 일정과 HR 정보가 모두 필요하다고 지능적으로 판단
2. **병렬 효율성**: 두 부서가 동시에 상담되어 응답 시간 단축
3. **포괄적 응답**: 여러 소스의 정보가 명확하고 실행 가능한 답변으로 종합
4. **확장성**: 더 많은 부서(재무, 법무 등)를 에이전트와 라우팅 로직을 추가하여 쉽게 확장 가능

## 커스터마이징 옵션

### 새 부서 추가
```yaml
agents:
  - id: "재무_에이전트"
    inline:
      type: "agent"
      system_prompt: "당신은 예산과 재무 쿼리를 처리합니다."
      tools: ["예산_검색"]
```

### 복합 라우팅 로직
```yaml
nodes:
  start:
    input:
      template: |
        분석: {{user_query}}
        
        다음 부서들을 고려하세요:
        - HR: 정책, 혜택, 인사
        - 일정관리: 스케줄링, 가용성  
        - 재무: 예산, 비용, 승인
        - 법무: 계약, 컴플라이언스
        
        쉼표로 구분된 목록 또는 단일 값으로 응답: HR,일정관리 또는 재무
```

### 조건부 처리
```yaml
nodes:
  긴급도_확인:
    type: "branch"
    condition: "긴급도_수준" 
    branches:
      "높음": "우선순위_처리"
      "보통": "표준_처리"
```

이 예제는 SowonFlow의 멀티 에이전트 워크플로우가 지능형 라우팅, 병렬 처리, 결과 종합을 통해 실제 비즈니스 문제를 어떻게 해결할 수 있는지 보여줍니다.

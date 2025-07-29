# 도구(Tools) 활용 가이드

## 개요

SowonFlow에서 도구(Tools)는 에이전트의 능력을 확장하여 외부 시스템과 상호작용할 수 있게 해주는 핵심 기능입니다. 에이전트는 도구를 통해 데이터를 검색하고, API를 호출하며, 파일을 처리하는 등의 작업을 수행할 수 있습니다.

## 도구 시스템의 이해

### 도구란?
도구는 에이전트가 호출할 수 있는 함수로, 다음과 같은 특징을 가집니다:

- **구조화된 입력**: 명확한 스키마로 정의된 매개변수
- **비동기 실행**: 외부 API 호출이나 파일 처리 등을 위한 비동기 지원
- **에러 처리**: 안전한 실행을 위한 에러 핸들링
- **타입 안정성**: Zod 스키마를 통한 런타임 타입 검증

### 지원되는 도구 형식
- **DynamicStructuredTool**: LangChain 호환 도구 (권장)
- **Custom Functions**: 사용자 정의 함수
- **MCP Tools**: Model Context Protocol 도구

### MCP와의 차이점

MCP(Model Context Protocol) 도구는 별도의 서버로 구현되어 여러 프로젝트에서 재사용 가능하며, 복잡한 외부 시스템 연동에 적합합니다. 더 자세한 내용은 [MCP 가이드](./mcp.md)를 참조하세요.

## 기본 도구 구현

### DynamicStructuredTool 사용법

```javascript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const searchTool = new DynamicStructuredTool({
  name: "search_database",
  description: "데이터베이스에서 정보를 검색합니다.",
  schema: z.object({
    query: z.string().describe("검색 쿼리"),
    category: z.string().optional().describe("검색 카테고리 (선택사항)")
  }),
  func: async ({ query, category }) => {
    // 실제 검색 로직 구현
    const results = await database.search(query, category);
    return JSON.stringify(results);
  }
});
```

### 워크플로우에 도구 연결

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "도구 활용 예제"

agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "당신은 연구 전문가입니다. 도구를 사용하여 정보를 검색하고 분석하세요."
      tools: ["search_database", "analyze_data"]

nodes:
  start:
    type: "agent_task"
    agent: "research_agent"
    input:
      template: "다음 주제에 대해 연구해주세요: {{user_query}}"
    next: "end"
  end:
    type: "end"
```

```javascript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  config: config,
  tools: [searchTool, analysisTool] // 도구 배열 전달
});
```

## 실제 예제: 비즈니스 시스템 도구

### 일정 관리 도구

```javascript
const calendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "특정 날짜의 일정을 검색합니다.",
  schema: z.object({
    date: z.string().describe("검색할 날짜 (today, tomorrow, 또는 YYYY-MM-DD)"),
    query: z.string().optional().describe("검색 키워드 (선택사항)")
  }),
  func: async ({ date, query }) => {
    try {
      // Google Calendar API 또는 내부 일정 시스템 연동
      if (date === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const events = await calendarAPI.getEvents(today);
        return `오늘(${today}) 일정: ${events.map(e => e.summary).join(', ')}`;
      } else if (date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const events = await calendarAPI.getEvents(tomorrowStr);
        return `내일(${tomorrowStr}) 일정: ${events.map(e => e.summary).join(', ')}`;
      } else if (date.match(/\d{4}-\d{2}-\d{2}/)) {
        const events = await calendarAPI.getEvents(date);
        return `${date} 일정: ${events.length > 0 ? events.map(e => e.summary).join(', ') : '예약된 일정이 없습니다.'}`;
      }
      return '올바른 날짜 형식을 입력해주세요.';
    } catch (error) {
      return `일정 검색 중 오류가 발생했습니다: ${error.message}`;
    }
  }
});
```

### HR 정책 검색 도구

```javascript
const hrTool = new DynamicStructuredTool({
  name: "search_hr_policies",
  description: "HR 정책 및 규정을 검색합니다.",
  schema: z.object({
    topic: z.string().describe("검색 주제 (예: 출장비, 휴가, 복리후생)"),
    department: z.string().optional().describe("부서명 (선택사항)")
  }),
  func: async ({ topic, department }) => {
    try {
      // HR 시스템 또는 문서 데이터베이스 연동
      const policies = await hrSystem.searchPolicies(topic, department);
      
      if (policies.length === 0) {
        return `"${topic}"에 대한 HR 정책을 찾을 수 없습니다.`;
      }
      
      return policies.map(policy => ({
        title: policy.title,
        summary: policy.summary,
        source: policy.document_name,
        last_updated: policy.updated_date
      }));
    } catch (error) {
      return `HR 정책 검색 중 오류가 발생했습니다: ${error.message}`;
    }
  }
});
```

### 파일 처리 도구

```javascript
const fileProcessorTool = new DynamicStructuredTool({
  name: "process_document",
  description: "문서 파일을 처리하고 내용을 추출합니다.",
  schema: z.object({
    file_path: z.string().describe("처리할 파일 경로"),
    action: z.enum(["extract_text", "summarize", "analyze"]).describe("수행할 작업"),
    options: z.object({
      max_length: z.number().optional().describe("최대 문자 수 제한"),
      language: z.string().optional().describe("문서 언어")
    }).optional()
  }),
  func: async ({ file_path, action, options = {} }) => {
    try {
      const fileContent = await fileSystem.readFile(file_path);
      
      switch (action) {
        case "extract_text":
          const text = await documentProcessor.extractText(fileContent);
          return options.max_length ? text.substring(0, options.max_length) : text;
          
        case "summarize":
          const summary = await documentProcessor.summarize(fileContent, options);
          return summary;
          
        case "analyze":
          const analysis = await documentProcessor.analyze(fileContent, options);
          return JSON.stringify(analysis);
          
        default:
          return "지원하지 않는 작업입니다.";
      }
    } catch (error) {
      return `파일 처리 중 오류가 발생했습니다: ${error.message}`;
    }
  }
});
```

## 도구 설계 모범 사례

### 1. 명확한 스키마 정의

```javascript
// 좋은 예시: 명확하고 구체적인 설명
schema: z.object({
  user_id: z.string().describe("사용자의 고유 식별자 (예: emp_12345)"),
  start_date: z.string().describe("시작 날짜 (YYYY-MM-DD 형식)"),
  end_date: z.string().describe("종료 날짜 (YYYY-MM-DD 형식)"),
  include_weekends: z.boolean().default(false).describe("주말 포함 여부")
})

// 나쁜 예시: 모호한 설명
schema: z.object({
  id: z.string().describe("ID"),
  date: z.string().describe("날짜"),
  flag: z.boolean().describe("플래그")
})
```

### 2. 안전한 에러 처리

```javascript
func: async (params) => {
  try {
    // 입력 검증
    if (!params.required_field) {
      return "필수 필드가 누락되었습니다.";
    }
    
    // 비즈니스 로직 실행
    const result = await externalAPI.call(params);
    
    // 결과 검증
    if (!result || result.error) {
      return `API 호출 실패: ${result?.error || '알 수 없는 오류'}`;
    }
    
    return result.data;
  } catch (error) {
    console.error('Tool execution error:', error);
    return `도구 실행 중 오류가 발생했습니다: ${error.message}`;
  }
}
```

### 3. 적절한 응답 형식

```javascript
// JSON 응답이 필요한 경우
func: async (params) => {
  const result = await processData(params);
  return JSON.stringify({
    status: "success",
    data: result,
    timestamp: new Date().toISOString()
  });
}

// 텍스트 응답이 적절한 경우
func: async (params) => {
  const count = await database.count(params.query);
  return `검색 결과: ${count}개의 항목을 찾았습니다.`;
}
```

## 고급 도구 패턴

### 체이닝 도구

여러 도구를 연계하여 복잡한 작업을 수행:

```javascript
const dataProcessingTool = new DynamicStructuredTool({
  name: "process_and_analyze",
  description: "데이터를 처리하고 분석합니다.",
  schema: z.object({
    data_source: z.string().describe("데이터 소스"),
    analysis_type: z.enum(["statistical", "trend", "correlation"])
  }),
  func: async ({ data_source, analysis_type }) => {
    // 1단계: 데이터 수집
    const rawData = await dataCollector.fetch(data_source);
    
    // 2단계: 데이터 정제
    const cleanData = await dataProcessor.clean(rawData);
    
    // 3단계: 분석 수행
    const analysis = await analyzer.analyze(cleanData, analysis_type);
    
    return {
      data_points: cleanData.length,
      analysis_result: analysis,
      recommendations: analysis.recommendations
    };
  }
});
```

### 캐싱이 포함된 도구

성능 향상을 위한 캐싱 구현:

```javascript
const cachedSearchTool = new DynamicStructuredTool({
  name: "cached_search",
  description: "캐시가 적용된 검색 도구입니다.",
  schema: z.object({
    query: z.string().describe("검색 쿼리"),
    cache_duration: z.number().default(300).describe("캐시 유지 시간(초)")
  }),
  func: async ({ query, cache_duration }) => {
    const cacheKey = `search:${query}`;
    
    // 캐시 확인
    const cached = await cache.get(cacheKey);
    if (cached) {
      return `[캐시됨] ${cached}`;
    }
    
    // 실제 검색 수행
    const result = await searchEngine.search(query);
    
    // 결과 캐싱
    await cache.set(cacheKey, result, cache_duration);
    
    return result;
  }
});
```

## 통합 예제: 완전한 멀티 도구 워크플로우

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "종합 비즈니스 어시스턴트"
  description: "다양한 도구를 활용하는 멀티 에이전트 시스템"

state:
  variables:
    - name: "task_type"
      initial_value: null
    - name: "results"
      initial_value: {}

agents:
  - id: "coordinator"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "작업을 분석하고 적절한 전문가에게 배정하는 조율자입니다."
      
  - id: "data_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "데이터 검색과 분석을 담당하는 전문가입니다."
      tools: ["search_database", "process_document", "cached_search"]
      
  - id: "business_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "비즈니스 프로세스와 정책을 담당하는 전문가입니다."
      tools: ["search_calendar", "search_hr_policies", "update_employee_info"]

nodes:
  start:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "작업 유형을 결정하세요: {{user_query}}"
    output:
      to_state: "task_type"
    next: "route_task"
    
  route_task:
    type: "branch"
    method: "condition"
    condition: "task_type"
    branches:
      "DATA": "data_processing"
      "BUSINESS": "business_processing"
      "MIXED": "parallel_processing"
    default: "general_response"
    
  parallel_processing:
    type: "parallel"
    branches: ["data_processing", "business_processing"]
    
  data_processing:
    type: "agent_task"
    agent: "data_specialist"
    input:
      template: "데이터 관련 작업을 수행하세요: {{user_query}}"
    next: "join_results"
    
  business_processing:
    type: "agent_task"
    agent: "business_specialist"
    input:
      template: "비즈니스 관련 작업을 수행하세요: {{user_query}}"
    next: "join_results"
    
  join_results:
    type: "join"
    next: "final_summary"
    
  final_summary:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "모든 결과를 종합하여 최종 답변을 제공하세요."
    next: "end"
    
  general_response:
    type: "agent_task"
    agent: "coordinator"
    next: "end"
    
  end:
    type: "end"
```

## 문제 해결 및 디버깅

### 일반적인 문제들

1. **도구 실행 실패**
   - 스키마 검증 오류: 입력 매개변수 타입 확인
   - 비동기 처리 오류: async/await 올바른 사용
   - 외부 API 연결 실패: 네트워크 및 인증 확인

2. **성능 문제**
   - 긴 실행 시간: 캐싱 및 배치 처리 고려
   - 메모리 사용량: 대용량 데이터 스트림 처리

3. **에러 처리**
   - 에이전트가 이해할 수 있는 명확한 에러 메시지 반환
   - 부분 실패 시에도 유용한 정보 제공

### 디버깅 팁

```javascript
// 도구 실행 로깅
const debugTool = new DynamicStructuredTool({
  name: "debug_tool",
  description: "디버깅이 포함된 도구 예제",
  schema: z.object({
    input: z.string()
  }),
  func: async ({ input }) => {
    console.log(`[DEBUG] Tool called with input: ${input}`);
    
    try {
      const result = await processInput(input);
      console.log(`[DEBUG] Tool result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.error(`[DEBUG] Tool error: ${error.message}`);
      throw error;
    }
  }
});

// 워크플로우에서 도구 사용 모니터링
workflow.addStateListener((state) => {
  console.log("Current state:", state);
  // 도구 실행 결과 확인
});
```

## 보안 고려사항

### 1. 입력 검증
```javascript
func: async ({ file_path }) => {
  // 경로 검증
  if (file_path.includes('../') || file_path.startsWith('/')) {
    return "보안상 허용되지 않는 파일 경로입니다.";
  }
  
  // 파일 확장자 검증
  const allowedExtensions = ['.txt', '.pdf', '.docx'];
  const ext = path.extname(file_path).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return "지원되지 않는 파일 형식입니다.";
  }
  
  // 정상 처리
  return await processFile(file_path);
}
```

### 2. 권한 관리
```javascript
func: async ({ user_id, action }) => {
  // 사용자 권한 확인
  const permissions = await getUserPermissions(user_id);
  if (!permissions.includes(action)) {
    return "이 작업을 수행할 권한이 없습니다.";
  }
  
  return await performAction(action);
}
```

도구는 SowonFlow의 강력한 기능 중 하나로, 적절히 설계하고 구현하면 에이전트의 능력을 크게 향상시킬 수 있습니다. 위의 가이드라인을 따라 안전하고 효율적인 도구를 개발하세요.

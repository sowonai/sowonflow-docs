# MCP

## MCP 통합

MCP (Model Context Protocol) 통합을 통해 에이전트는 표준화된 프로토콜을 통해 외부 시스템 및 서비스에 접근할 수 있습니다. `sowonflow` 패키지는 에이전트 기능 확장을 위한 원활한 MCP 서버 통합을 제공합니다.

### MCP란 무엇인가요?

MCP (Model Context Protocol)는 AI 에이전트가 데이터베이스, API, 파일 시스템 및 기타 서비스와 같은 외부 시스템과 상호작용하는 표준화된 방법입니다. 에이전트가 핵심 기능 외의 도구와 리소스에 접근할 수 있는 안전하고 구조화된 방법을 제공합니다.

### 기본 MCP 구성

#### MCP 서버 추가

워크플로우 정의에서 MCP 서버를 구성합니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "MCP 통합 예시"

agents:
  - id: "gmail_agent"
    inline:
      type: "agent"
      model: "google/gemini-2.5-flash"
      system_prompt: |
        당신은 이메일을 검색하고 관리할 수 있는 Gmail 어시스턴트입니다.
        Gmail 기능에 접근하기 위해 MCP 도구("mcp__" 접두사)를 사용하세요.
      mcp: ["gmail"]  # 이름으로 MCP 서버 참조

nodes:
  start:
    type: "agent_task"
    agent: "gmail_agent"
    next: "end"
  
  end:
    type: "end"
```

#### MCP 서버 구성

워크플로우를 생성할 때 MCP 서버 구성을 지정합니다:

```typescript
const workflow = new Workflow({
  mainWorkflow: workflowYaml,
  mcpServers: {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@sowonai/mcp-gmail"]
      "env": {
        "GOOGLE_CLIENT_ID": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN_FROM_INSTALL_STEP"
      }
    }
  }
});
```

### 사용 가능한 MCP 서버

#### Gmail MCP 서버

이메일 관리를 위한 Gmail 기능에 접근합니다:

```yaml
agents:
  - id: "email_assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 이메일 관리 어시스턴트입니다.
        
        사용 가능한 Gmail MCP 도구:
        - mcp__gmail__search_emails: Gmail 구문을 사용하여 이메일 검색
        - mcp__gmail__get_email: 상세한 이메일 내용 가져오기
        - mcp__gmail__send_email: 새 이메일 보내기
        
        Gmail 검색 구문 예시:
        - from:sender@example.com
        - subject:meeting
        - has:attachment
        - after:2024/01/01
        - is:unread
      mcp: ["gmail"]
```

**MCP 서버 설정:**

```typescript
mcpServers: {
  "gmail": {
    "command": "npx",
    "args": ["@gongrzhe/server-gmail-autoauth-mcp"]
  }
}
```

#### 파일 시스템 MCP 서버

로컬 파일 시스템 작업에 접근합니다:

```yaml
agents:
  - id: "file_manager"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 다음을 할 수 있는 파일 관리 어시스턴트입니다:
        - 파일 읽기 및 쓰기
        - 디렉토리 내용 나열
        - 파일 검색
        
        파일 작업을 위해 "mcp__fs__" 접두사가 있는 MCP 도구를 사용하세요.
      mcp: ["filesystem"]
```

#### 데이터베이스 MCP 서버

데이터 작업을 위한 데이터베이스에 연결합니다:

```yaml
agents:
  - id: "data_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 데이터베이스 접근 권한을 가진 데이터 분석가입니다.
        MCP 데이터베이스 도구를 사용하여 데이터를 쿼리하고 분석하세요.
      mcp: ["database"]
```

### 완전한 예시: Gmail 이메일 관리

Gmail MCP를 사용한 이메일 관리를 위한 완전한 워크플로우입니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "이메일 관리 워크플로우"
  description: "Gmail MCP 통합을 사용한 이메일 관리"

agents:
  - id: "email_manager"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        당신은 전문적인 이메일 관리 어시스턴트입니다.
        
        기능:
        - Gmail 검색 구문을 사용하여 이메일 검색
        - 이메일 내용을 자세히 읽기
        - 이메일 분류 (업무, 개인, 홍보)
        - 중요한 커뮤니케이션 요약
        
        가이드라인:
        - 업무 관련 이메일과 개인 이메일을 별도로 처리
        - 홍보/스팸 이메일은 무시
        - 중요한 이메일을 찾으면 전체 내용 검색
        - 주요 정보가 포함된 구조화된 요약 제공
        
        사용 가능한 도구:
        - mcp__gmail__search_emails: Gmail 구문으로 검색
        - mcp__gmail__get_email: 상세한 이메일 내용 가져오기
        
        현재 컨텍스트:
        - 회사: SowonLabs (AI 제품, SowonFlow 개발)
        - 사용자 역할: CEO
        - 현재 날짜: {{{current_time}}}
        
        <document name="Gmail Search Syntax">
        {{{documents.gmail_search_usage.content}}}
        </document>
      mcp: ["gmail"]

nodes:
  start:
    type: "agent_task"
    agent: "email_manager"
    next: "end"
  
  end:
    type: "end"
```

**구현:**

```typescript
const workflow = new Workflow({
  mainWorkflow: emailWorkflow,
  documents: {
    'gmail_search_usage': `
    ## Gmail 검색 구문
    
    ### 일반적인 연산자:
    - from:sender@example.com - 특정 발신자의 이메일 찾기
    - to:recipient@example.com - 특정 수신자에게 보낸 이메일 찾기
    - subject:keyword - 제목에서 검색
    - has:attachment - 첨부파일이 있는 이메일
    - after:2024/01/01 - 특정 날짜 이후의 이메일
    - before:2024/12/31 - 특정 날짜 이전의 이메일
    - is:unread - 읽지 않은 이메일만
    - is:important - 중요한 이메일
    - category:primary - 기본 카테고리 이메일
    
    ### 고급 예시:
    - from:team@company.com after:2024/01/01 has:attachment
    - subject:(meeting OR call) -category:promotions
    - is:unread from:clients after:2024/01/15
    `
  },
  mcpServers: {
    "gmail": {
      "command": "npx",
      "args": ["@gongrzhe/server-gmail-autoauth-mcp"]
    }
  }
});

// 워크플로우 사용
const result = await workflow.ask(
  "최근 업무 관련 이메일을 찾고 중요한 것들을 요약해주세요"
);
```

### MCP 도구 사용 패턴

#### 검색 및 분석 패턴

```yaml
system_prompt: |
  이메일 분석을 위해 다음 패턴을 따르세요:
  
  1. 검색: 관련 기준으로 mcp__gmail__search_emails 사용
  2. 필터링: 검색 결과에서 중요한 이메일 식별
  3. 검색: 상세 내용을 위해 mcp__gmail__get_email 사용
  4. 분석: 발견사항 분류 및 요약
  
  워크플로우 예시:
  - 검색: 최근 읽지 않은 이메일
  - 필터링: 업무 관련 커뮤니케이션
  - 검색: 중요한 이메일의 전체 내용
  - 분석: 구조화된 요약 제공
```

#### 배치 처리 패턴

```yaml
system_prompt: |
  효율성을 위해 작업을 배치로 처리하세요:
  
  권장사항:
  ✓ 포괄적인 기준으로 한 번에 검색
  ✓ 여러 이메일 ID 수집
  ✓ 가능한 경우 단일 도구 호출로 내용 검색
  
  피해야 할 것:
  ✗ 여러 개별 검색
  ✗ 이메일을 하나씩 열기
  ✗ 중복된 API 호출
```

### 고급 MCP 구성

#### 여러 MCP 서버

포괄적인 기능을 위해 여러 MCP 서버를 구성합니다:

```typescript
const workflow = new Workflow({
  mainWorkflow: workflowYaml,
  mcpServers: {
    "gmail": {
      "command": "npx",
      "args": ["@gongrzhe/server-gmail-autoauth-mcp"]
    },
    "calendar": {
      "command": "npx",
      "args": ["@example/calendar-mcp-server"]
    },
    "files": {
      "command": "node",
      "args": ["./servers/file-server.js"]
    }
  }
});
```

#### 여러 MCP 서비스를 사용하는 에이전트

```yaml
agents:
  - id: "assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        당신은 다음에 접근할 수 있는 종합적인 디지털 어시스턴트입니다:
        - Gmail (이메일 관리)
        - 캘린더 (일정 관리)
        - 파일 시스템 (문서 접근)
        
        사용자 요청에 따라 적절한 MCP 도구를 사용하세요.
      mcp: ["gmail", "calendar", "files"]
```

### 오류 처리 및 모범 사례

#### 견고한 오류 처리

```yaml
system_prompt: |
  오류 처리:
  - MCP 도구가 실패하면 문제를 명확히 설명
  - 가능한 경우 대안적 접근법 제안
  - 도구를 호출하기 전에 항상 매개변수 검증
  - 인증 문제를 우아하게 처리
  
  예시:
  Gmail 검색이 실패한 경우:
  1. 검색 구문이 올바른지 확인
  2. 단순화된 검색 기준 시도
  3. 사용자에게 제한사항 알림
```

#### 성능 최적화

```yaml
system_prompt: |
  성능 가이드라인:
  - 결과를 제한하기 위해 특정 검색 기준 사용
  - 가능한 경우 작업을 배치로 처리
  - 적절한 경우 결과 캐싱
  - 합리적인 제한 설정 (maxResults: 10-50)
  
  검색 최적화:
  - 기준 결합: "from:team@company.com after:2024/01/01"
  - 범위 제한을 위한 날짜 범위 사용
  - 관련성이 있을 때 카테고리별 필터링
```

#### 보안 고려사항

```yaml
system_prompt: |
  보안 가이드라인:
  - 불필요하게 민감한 이메일 내용을 노출하지 않음
  - 개인정보 보호 경계 존중
  - 개인 정보를 인용하기보다는 요약
  - 인증 실패를 적절히 처리
```

### MCP 통합 테스트

#### 기본 MCP 테스트

```typescript
describe('MCP Integration Tests', () => {
  it('should connect to Gmail MCP server', async () => {
    const workflow = new Workflow({
      mainWorkflow: gmailWorkflow,
      mcpServers: {
        "gmail": {
          "command": "npx",
          "args": ["@gongrzhe/server-gmail-autoauth-mcp"]
        }
      }
    });

    const result = await workflow.ask("최근 이메일을 확인해주세요");
    expect(result.content).toBeDefined();
  });
});
```

#### 도구 사용 가능성 테스트

```typescript
it('should have MCP tools available', async () => {
  const result = await workflow.ask(
    "사용 가능한 모든 도구와 설명을 나열해주세요"
  );
  
  expect(result.content).toContain('mcp__gmail__search_emails');
  expect(result.content).toContain('mcp__gmail__get_email');
});
```

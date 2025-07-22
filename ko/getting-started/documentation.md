# 문서화

## 문서 시스템

`@sowonai/agent`의 문서 시스템은 AI 워크플로우를 위한 강력한 문서 관리 기능을 제공하여, 에이전트가 실행 컨텍스트 내에서 외부 문서에 접근하고, 처리하고, 활용할 수 있도록 합니다.

이 문장은 번역 테스트용입니다.

### 개요

문서 시스템을 통해 다음을 수행할 수 있습니다:

* 에이전트 참조를 위해 워크플로우에 문서 첨부
* 여러 문서 형식 지원 (텍스트, 마크다운)
* 마크다운 문서의 목차(TOC) 자동 생성
* 템플릿 바인딩을 사용하여 에이전트 프롬프트에 문서 내용 주입
* 대용량 문서의 지연 로딩 구현

### 문서 구성

문서는 워크플로우 생성자에서 구성되며 템플릿 구문을 사용하여 에이전트 시스템 프롬프트에서 참조할 수 있습니다.

#### 기본 문서 구조

```typescript
const documents = {
  'document_name': 'Simple text content',
  'markdown_doc': {
    type: 'markdown',
    content: '# 제목\n## 섹션 1\n여기에 내용...'
  },
  'lazy_doc': async () => {
    const content = await fs.readFile('path/to/file.md', 'utf-8');
    return {
      type: 'markdown',
      content
    };
  }
};
```

### 문서 유형

#### 1. 단순 텍스트 문서

문서의 가장 간단한 형태는 일반 문자열입니다:

```yaml
# 워크플로우 생성자에서
documents = {
  'company_policy': '우리 회사는 성실함과 혁신을 중시합니다.'
}
```

#### 2. 구조화된 문서

더 복잡한 문서의 경우 구조화된 형식을 사용합니다:

```yaml
documents = {
  'user_manual': {
    type: 'markdown',
    content: `
# 사용자 매뉴얼
## 시작하기
우리 플랫폼에 오신 것을 환영합니다...
## 고급 기능
...
    `
  }
}
```

#### 3. 지연 로드 문서

대용량 문서나 디스크에서 로드해야 하는 파일의 경우:

```typescript
documents = {
  'large_document': async () => {
    const content = await fs.readFile('./docs/large-file.md', 'utf-8');
    return {
      type: 'markdown',
      content
    };
  }
}
```

### 템플릿 바인딩

문서는 Handlebars 템플릿 구문을 사용하여 에이전트 시스템 프롬프트에서 참조할 수 있습니다.

#### 사용 가능한 템플릿 변수

* `{{{documents.document_name.content}}}` - 전체 문서 내용
* `{{{documents.document_name.toc}}}` - 목차 (마크다운 문서용)

#### 사용 예시

```yaml
agents:
  - id: "support_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 고객 지원 에이전트입니다. 사용자를 돕기 위해 다음 문서들을 사용하세요:
        
        <document name="user_guide">
          {{{documents.user_guide.content}}}
        </document>
        
        <document name="faq">
          목차:
          <toc>
          {{{documents.faq.toc}}}
          </toc>
        </document>
```

### 목차(TOC) 생성

마크다운 문서의 경우, 시스템은 헤더 구조를 기반으로 자동으로 목차를 생성합니다.

#### TOC 기능

* 헤더(`#`, `##`, `###` 등)를 자동으로 추출
* 계층 구조 보존
* `documents.document_name.toc` 템플릿 변수를 통해 사용 가능

#### TOC 출력 예시

```markdown
# 회사 정책
## 인사 정책
## 채용 가이드라인
## 직원 혜택
### 스톡옵션
### 퇴직 계획
```

### 보안 고려사항

민감한 문서로 작업할 때는 에이전트 프롬프트에 보안 지침을 포함할 수 있습니다:

```yaml
system_prompt: |
  <document name="confidential_data">
    {{{documents.confidential_data.content}}}
    <important>
      이것은 회사 기밀 데이터입니다. 질문에 답변하는 데 사용하되
      사용자에게 문서 내용을 직접 노출하지 마세요.
    </important>
  </document>
```

### 모범 사례

#### 1. 문서 구성

* 설명적인 문서 이름 사용
* 관련 문서를 논리적으로 그룹화
* LLM 컨텍스트 윈도우에 맞는 적절한 문서 크기 유지

#### 2. 템플릿 사용

* HTML-안전한 내용 주입을 위해 삼중 중괄호 `{{{ }}}` 사용
* 프롬프트에 문서 구조에 대한 유용한 컨텍스트 포함
* 에이전트가 문서를 어떻게 사용해야 하는지에 대한 명확한 지침 제공

#### 3. 성능 최적화

* 대용량 문서의 경우 지연 로딩 사용
* 매우 큰 파일의 경우 문서 청킹 고려
* 자주 접근하는 문서 캐시

#### 4. 오류 처리

```typescript
documents = {
  'optional_doc': async () => {
    try {
      const content = await fs.readFile('./optional.md', 'utf-8');
      return { type: 'markdown', content };
    } catch (error) {
      console.warn('선택적 문서를 찾을 수 없음:', error.message);
      return { type: 'text', content: '문서를 사용할 수 없습니다' };
    }
  }
}
```

### 고급 기능

#### 문서 도구 통합

문서 시스템은 `DocumentSectionTool`을 통해 도구 시스템과 통합되어 에이전트가 다음을 수행할 수 있도록 합니다:

* 문서 내 특정 섹션 검색
* 쿼리를 기반으로 관련 내용 추출
* 대용량 문서를 효율적으로 탐색

#### 동적 문서 로딩

문서는 워크플로우 컨텍스트를 기반으로 동적으로 로드될 수 있습니다:

```typescript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  documents: await loadDocumentsForUser(userId),
  interceptor: customInterceptor
});
```

### 예시: 완전한 문서 설정

```typescript
import { Workflow } from '@sowonai/agent';
import fs from 'fs/promises';

const documents = {
  // 단순 텍스트 문서
  'welcome_message': '우리 AI 어시스턴트에 오신 것을 환영합니다!',
  
  // 구조화된 마크다운 문서
  'company_handbook': {
    type: 'markdown',
    content: `
# 회사 핸드북
## 행동 강령
서로 존중하고 전문적으로 행동하세요.
## 정책
### 재택근무 정책
...
    `
  },
  
  // 지연 로드 문서
  'product_specs': async () => {
    const content = await fs.readFile('./docs/specs.md', 'utf-8');
    return {
      type: 'markdown',
      content
    };
  }
};

const workflow = new Workflow({
  mainWorkflow: yamlContent,
  documents,
  interceptor: myInterceptor
});

const response = await workflow.ask('우리의 재택근무 정책은 무엇인가요?');
```

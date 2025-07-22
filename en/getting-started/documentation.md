# Documentation

## document system

The document system of `@sowonai/agent 'provides a powerful document management function for AI workflow, allowing the agent to access, handle and use external documents within the execution context.

This sentence is for translation test.
The third test is conducted.

### outline

You can do the following through the document system:

* Document is attached to workflow for agent reference
* Various document format support (text, markdown)
* Markdown document automatic production of TOC
* Inject document contents into agent prompt using template binding
* Delayed loading of large -capacity documents

### Document composition

The document is configured in the workflow constructor and can be referred to in the agent system prompt using the template syntax.

#### Basic document structure

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

### Document type

#### 1. Simple text documentation

The simplest form of the document is ordinary strings:

```yaml
# 워크플로우 생성자에서
documents = {
  'company_policy': '우리 회사는 성실함과 혁신을 중시합니다.'
}
```

#### 2. structured document

For more complex documents, use a structured format:

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

#### 3. Delayed Road Document

In the case of files that need to be loaded on large documents or disks:

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

### Template Binding

The document can be referred to in the agent system prompt using the handlebars template syntax.

#### Template variable available

* `{{{documents.document_name.content}}}}}
* `{{{documents.document_name.toc}}}}}

#### Examples of use

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

### Create a TOC (TOC)

For the markdown document, the system automatically generates a table of contents based on the header structure.

#### TOC function

* Automatically extracts headers ('#', `` ##`, '###', etc.
* Hierarchical structure preservation
* `` Documents.document_Name.toc '

#### TOC output example

```markdown
# 회사 정책
## 인사 정책
## 채용 가이드라인
## 직원 혜택
### 스톡옵션
### 퇴직 계획
```

### Security consideration

When working with sensitive documents, you can include security guidelines in the agent prompt:

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

### model case

####. Document composition

* Use explanatory document name
* Logically grouping related documents
* Maintain the appropriate document size for LLM context window

#### 2. Using template

* HTML-Use triple braces '{{}}}'
* Including useful contexts for document structure in prompt
* Provide a clear guidelines for how the agent should use the document

#### 3. Performance Optimization

* Use delayed loading for large documents
* In the case of a very large file,
* Doctes that are often approached

#### 4. Processing error

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

### Advanced function

#### Integration of document tools

The document system is integrated with the tool system through 'DocumentSectionTool' so that the agent can follow:

* Search for specific sections in the document
* Extracting related contents based on query
* Efficient exploration of large documents

#### Dynamic document loading

The document can be loaded dynamically based on the workflow context:

```typescript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  documents: await loadDocumentsForUser(userId),
  interceptor: customInterceptor
});
```

### Example: Full document setting

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

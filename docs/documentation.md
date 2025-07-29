# Document System

## Document System

The document system provides powerful document management capabilities for AI workflows, allowing agents to access, process, and utilize external documents within their execution context.

### Overview

The document system allows you to:

* Attach documents to workflows for agent reference
* Support multiple document formats (text, markdown)
* Automatically generate Table of Contents (TOC) for Markdown documents
* Inject document content into agent prompts using template binding
* Implement lazy loading for large documents

### Document Configuration

Documents are configured in the workflow constructor and can be referenced in the agent's system prompt using template syntax.

#### Basic Document Structure

```typescript
const documents = {
  'document_name': 'Simple text content',
  'markdown_doc': {
    type: 'markdown',
    content: '# Title\n## Section 1\nContent here...'
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

### Document Types

#### 1. Simple Text Document

The simplest form of a document is a plain string:

```yaml
# In the workflow constructor
documents = {
  'company_policy': 'Our company values integrity and innovation.'
}
```

#### 2. Structured Document

For more complex documents, use a structured format:

```yaml
documents = {
  'user_manual': {
    type: 'markdown',
    content: `
# User Manual
## Getting Started
Welcome to our platform...
## Advanced Features
...
    `
  }
}
```

#### 3. Lazy-Loaded Document

For large documents or files that need to be loaded from disk:

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

Documents can be referenced in the agent's system prompt using Handlebars template syntax.

#### Available Template Variables

* `{{{documents.document_name.content}}}` - Full document content
* `{{{documents.document_name.toc}}}` - Table of Contents (for Markdown documents)

#### Usage Example

```yaml
agents:
  - id: "support_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a customer support agent. Use the following documents to help the user:
        
        <document name="user_guide">
          {{{documents.user_guide.content}}}
        </document>
        
        <document name="faq">
          Table of Contents:
          <toc>
          {{{documents.faq.toc}}}
          </toc>
        </document>
```

### Table of Contents (TOC) Generation

For Markdown documents, the system automatically generates a Table of Contents based on the header structure.

#### TOC Features

* Automatically extracts headers (`#`, `##`, `###`, etc.)
* Preserves hierarchical structure
* Available via the `documents.document_name.toc` template variable

#### TOC Output Example

```markdown
# company policy
## HR Policy
## Recruitment Guidelines
## Employee Benefits
### Stock Option
### Retirement Plan
```

### Security Considerations

When working with sensitive documents, you can include security guidelines in the agent prompt:

```yaml
system_prompt: |
  <document name="confidential_data">
    {{{documents.confidential_data.content}}}
    <important>
      This is confidential company data. Use it to answer questions, but
      do not directly expose the document content to the user.
    </important>
  </document>
```

### Best Practices

#### 1. Document Organization

* Use descriptive document names
* Logically group related documents
* Maintain appropriate document sizes to fit within the LLM context window

#### 2. Template Usage

* Use triple curly braces `{{{ }}}` for HTML-safe content injection
* Include useful context about the document structure in the prompt
* Provide clear instructions on how the agent should use the documents

#### 3. Performance Optimization

* Use lazy loading for large documents
* Consider document chunking for very large files
* Cache frequently accessed documents

#### 4. Error Handling

```typescript
documents = {
  'optional_doc': async () => {
    try {
      const content = await fs.readFile('./optional.md', 'utf-8');
      return { type: 'markdown', content };
    } catch (error) {
      console.warn('cannot found:', error.message);
      return { type: 'text', content: 'not found!' };
    }
  }
}
```

### Advanced Features

#### Document Tool Integration

The document system integrates with the tool system via `DocumentSectionTool`, allowing agents to:

* Search for specific sections within documents
* Extract relevant content based on queries
* Efficiently navigate large documents

#### Dynamic Document Loading

Documents can be dynamically loaded based on the workflow context:

```typescript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  documents: await loadDocumentsForUser(userId),
  interceptor: customInterceptor
});
```

### Example: Complete Document Setup

```typescript
import { Workflow } from '@sowonai/sowonflow';
import fs from 'fs/promises';

const documents = {
  // Simple text document
  'welcome_message': 'Welcome to our AI assistant!',
  
  // Structured Markdown document
  'company_handbook': {
    type: 'markdown',
    content: `
# Company Handbook
## Code of Conduct
Treat each other with respect and professionalism.
## Policies
### Work-from-home Policy
...
    `
  },
  
  // Lazy-loaded document
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

const response = await workflow.ask('What is our work-from-home policy?');
```
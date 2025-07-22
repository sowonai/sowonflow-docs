# Documentation

## Document System

The Document System in `@sowonai/agent` provides powerful document management capabilities for AI workflows, enabling agents to access, process, and utilize external documents within their execution context.

### Overview

The Document System allows you to:

* Attach documents to workflows for agent reference
* Support multiple document formats (text, markdown)
* Generate table of contents (TOC) automatically for markdown documents
* Use template binding to inject document content into agent prompts
* Implement lazy loading for large documents

### Document Configuration

Documents are configured in the workflow constructor and can be referenced in agent system prompts using template syntax.

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

#### 1. Simple Text Documents

The simplest form of document is a plain string:

```yaml
# In workflow constructor
documents = {
  'company_policy': 'Our company values integrity and innovation.'
}
```

#### 2. Structured Documents

For more complex documents, use the structured format:

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

#### 3. Lazy-Loaded Documents

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

Documents can be referenced in agent system prompts using Handlebars template syntax.

#### Available Template Variables

* `{{{documents.document_name.content}}}` - Full document content
* `{{{documents.document_name.toc}}}` - Table of contents (for markdown documents)

#### Example Usage

```yaml
agents:
  - id: "support_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a customer support agent. Use the following documents to help users:
        
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

For markdown documents, the system automatically generates a table of contents based on header structure.

#### TOC Features

* Automatically extracts headers (`#`, `##`, `###`, etc.)
* Preserves hierarchical structure
* Available via `documents.document_name.toc` template variable

#### Example TOC Output

```markdown
# Company Policies
## HR Policies
## Hiring Guidelines
## Employee Benefits
### Stock Options
### Retirement Plans
```

### Security Considerations

When working with sensitive documents, you can include security instructions in your agent prompts:

```yaml
system_prompt: |
  <document name="confidential_data">
    {{{documents.confidential_data.content}}}
    <important>
      This is confidential company data. Use it to answer questions 
      but never directly expose the document content to users.
    </important>
  </document>
```

### Best Practices

#### 1. Document Organization

* Use descriptive document names
* Group related documents logically
* Keep document sizes reasonable for LLM context windows

#### 2. Template Usage

* Use triple braces `{{{ }}}` for HTML-safe content injection
* Include helpful context about document structure in prompts
* Provide clear instructions on how agents should use documents

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
      console.warn('Optional document not found:', error.message);
      return { type: 'text', content: 'Document not available' };
    }
  }
}
```

### Advanced Features

#### Document Tools Integration

The Document System integrates with the tool system through `DocumentSectionTool`, allowing agents to:

* Search for specific sections within documents
* Extract relevant content based on queries
* Navigate large documents efficiently

#### Dynamic Document Loading

Documents can be loaded dynamically based on workflow context:

```typescript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  documents: await loadDocumentsForUser(userId),
  interceptor: customInterceptor
});
```

### Example: Complete Document Setup

```typescript
import { Workflow } from '@sowonai/agent';
import fs from 'fs/promises';

const documents = {
  // Simple text document
  'welcome_message': 'Welcome to our AI assistant!',
  
  // Structured markdown document
  'company_handbook': {
    type: 'markdown',
    content: `
# Company Handbook
## Code of Conduct
Be respectful and professional.
## Policies
### Remote Work Policy
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

const response = await workflow.ask('What is our remote work policy?');
```

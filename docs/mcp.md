# MCP

## MCP Integration

MCP (Model Context Protocol) integration allows agents to access external systems and services through a standardized protocol. The `@sowonai/agent` package provides smooth MCP server integration for extending agent functionality.

### What is MCP?

MCP (Model Context Protocol) is a standardized way for AI agents to interact with external systems such as databases, APIs, file systems, and other services. It provides a safe and structured method for agents to access tools and resources beyond their core functionality.

### Basic MCP Configuration

#### Adding MCP Server

Configure an MCP server in your workflow definition:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "MCP Integration Example"

agents:
  - id: "gmail_agent"
    inline:
      type: "agent"
      model: "google/gemini-2.5-flash"
      system_prompt: |
        You are a Gmail assistant that can search and manage emails.
        Use MCP tools (with "mcp__" prefix) to access Gmail features.
      mcp: ["gmail"]  # Reference MCP server by name

nodes:
  start:
    type: "agent_task"
    agent: "gmail_agent"
    next: "end"

  end:
    type: "end"
```

#### Configuring MCP Server

Specify MCP server configuration when creating your workflow:

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

### Available MCP Servers

#### Gmail MCP Server

Access Gmail features for email management:

```yaml
agents:
  - id: "email_assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are an email management assistant.

        Available Gmail MCP tools:
        - mcp__gmail__search_emails: Search emails using Gmail syntax
        - mcp__gmail__get_email: Retrieve detailed email content
        - mcp__gmail__send_email: Send new emails

        Gmail search syntax examples:
        - from:sender@example.com
        - subject:meeting
        - has:attachment
        - after:2024/01/01
        - is:unread
      mcp: ["gmail"]
```

**MCP Server Setup:**

```typescript
mcpServers: {
  "gmail": {
    "command": "npx",
    "args": ["@gongrzhe/server-gmail-autoauth-mcp"]
  }
}
```

#### File System MCP Server

Access local file system operations:

```yaml
agents:
  - id: "file_manager"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a file management assistant that can:
        - Read and write files
        - List directory contents
        - Search for files

        Use MCP tools with "mcp__fs__" prefix for file operations.
      mcp: ["filesystem"]
```

#### Database MCP Server

Connect to databases for data operations:

```yaml
agents:
  - id: "data_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a data analyst with database access.
        Use MCP database tools to query and analyze data.
      mcp: ["database"]
```

### Complete Example: Email Management with Gmail

A complete workflow for email management using Gmail MCP:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Email Management Workflow"
  description: "Email management using Gmail MCP integration"

agents:
  - id: "email_manager"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a professional email management assistant.

        Capabilities:
        - Search emails using Gmail search syntax
        - Read detailed email content
        - Categorize emails (work, personal, promotions)
        - Summarize important communications

        Guidelines:
        - Handle work-related and personal emails separately
        - Ignore promotional/spam emails
        - Search full content for important emails
        - Provide structured summaries with key information

        Available tools:
        - mcp__gmail__search_emails: Search using Gmail syntax
        - mcp__gmail__get_email: Retrieve detailed email content

        Current context:
        - Company: SowonLabs (AI products, SowonFlow development)
        - User role: CEO
        - Current date: {{{current_time}}}

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

**Implementation:**

```typescript
const workflow = new Workflow({
  mainWorkflow: emailWorkflow,
  documents: {
    'gmail_search_usage': `
    ## Gmail Search Syntax

    ### Common operators:
    - from:sender@example.com - Find emails from a specific sender
    - to:recipient@example.com - Find emails sent to a specific recipient
    - subject:keyword - Search in subject
    - has:attachment - Emails with attachments
    - after:2024/01/01 - Emails after a specific date
    - before:2024/12/31 - Emails before a specific date
    - is:unread - Only unread emails
    - is:important - Important emails
    - category:primary - Primary category emails

    ### Advanced examples:
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

// Use the workflow
const result = await workflow.ask(
  "Find recent work-related emails and summarize the important ones"
);
```

### MCP Tool Usage Patterns

#### Search and Analysis Pattern

```yaml
system_prompt: |
  Follow this pattern for email analysis:

  1. Search: Use mcp__gmail__search_emails with relevant criteria
  2. Filter: Identify important emails from search results
  3. Retrieve: Use mcp__gmail__get_email for detailed content
  4. Analyze: Categorize and summarize findings

  Workflow example:
  - Search: Recent unread emails
  - Filter: Work-related communications
  - Retrieve: Full content of important emails
  - Analyze: Provide structured summary
```

#### Batch Processing Pattern

```yaml
system_prompt: |
  Process tasks in batches for efficiency:

  Recommendations:
  ✓ Search comprehensively with one call
  ✓ Collect multiple email IDs
  ✓ Retrieve content with single tool call when possible

  Avoid:
  ✗ Multiple individual searches
  ✗ Opening emails one by one
  ✗ Duplicate API calls
```

### Advanced MCP Configuration

#### Multiple MCP Servers

Configure multiple MCP servers for comprehensive functionality:

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

#### Agent Using Multiple MCP Services

```yaml
agents:
  - id: "assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a comprehensive digital assistant with access to:
        - Gmail (email management)
        - Calendar (schedule management)
        - File system (document access)

        Use appropriate MCP tools based on user requests.
      mcp: ["gmail", "calendar", "files"]
```

### Error Handling and Best Practices

#### Robust Error Handling

```yaml
system_prompt: |
  Error handling:
  - Clearly explain problems when MCP tools fail
  - Suggest alternative approaches when possible
  - Always validate parameters before calling tools
  - Gracefully handle authentication issues

  Example:
  When Gmail search fails:
  1. Verify search syntax is correct
  2. Try simplified search criteria
  3. Inform user of limitations
```

#### Performance Optimization

```yaml
system_prompt: |
  Performance guidelines:
  - Use specific search criteria to limit results
  - Process tasks in batches when possible
  - Cache results when appropriate
  - Set reasonable limits (maxResults: 10-50)

  Search optimization:
  - Combine criteria: "from:team@company.com after:2024/01/01"
  - Use date ranges to limit scope
  - Filter by category when relevant
```

#### Security Considerations

```yaml
system_prompt: |
  Security guidelines:
  - Don't expose sensitive email content unnecessarily
  - Respect privacy boundaries
  - Summarize rather than quote personal information
  - Handle authentication failures appropriately
```

### MCP Integration Testing

#### Basic MCP Test

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

    const result = await workflow.ask("Check my recent emails");
    expect(result.content).toBeDefined();
  });
});
```

#### Tool Availability Test

```typescript
it('should have MCP tools available', async () => {
  const result = await workflow.ask(
    "List all available tools with their descriptions"
  );

  expect(result.content).toContain('mcp__gmail__search_emails');
  expect(result.content).toContain('mcp__gmail__get_email');
});
```
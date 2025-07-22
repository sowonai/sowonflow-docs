# MCP

## MCP Integration

MCP (Model Context Protocol) integration allows agents to access external systems and services through standardized protocols. The `@sowonai/agent` package provides seamless MCP server integration for extending agent capabilities.

### What is MCP?

MCP (Model Context Protocol) is a standardized way for AI agents to interact with external systems like databases, APIs, file systems, and other services. It provides a secure and structured method for agents to access tools and resources outside their core capabilities.

### Basic MCP Configuration

#### Adding MCP Servers

Configure MCP servers in your workflow definition:

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
        Use MCP tools (prefixed with "mcp__") to access Gmail functionality.
      mcp: ["gmail"]  # Reference MCP server by name

nodes:
  start:
    type: "agent_task"
    agent: "gmail_agent"
    next: "end"
  
  end:
    type: "end"
```

#### MCP Server Configuration

When creating a workflow, specify MCP server configurations:

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

Access Gmail functionality for email management:

```yaml
agents:
  - id: "email_assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are an email management assistant.
        
        Available Gmail MCP tools:
        - mcp__gmail__search_emails: Search emails using Gmail syntax
        - mcp__gmail__get_email: Get detailed email content
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
      model: "openai/gpt-4"
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
      model: "openai/gpt-4"
      system_prompt: |
        You are a data analyst with database access.
        Use MCP database tools to query and analyze data.
      mcp: ["database"]
```

### Complete Example: Gmail Email Management

Here's a complete workflow for email management using Gmail MCP:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Email Management Workflow"
  description: "Manage emails using Gmail MCP integration"

agents:
  - id: "email_manager"
    inline:
      type: "agent"
      model: "openai/gpt-4o-mini"
      system_prompt: |
        You are a professional email management assistant.
        
        CAPABILITIES:
        - Search emails using Gmail search syntax
        - Read email contents in detail
        - Categorize emails (work, personal, promotional)
        - Summarize important communications
        
        GUIDELINES:
        - Process work-related and personal emails separately
        - Ignore promotional/spam emails
        - When finding important emails, retrieve their full content
        - Provide structured summaries with key information
        
        TOOLS AVAILABLE:
        - mcp__gmail__search_emails: Search with Gmail syntax
        - mcp__gmail__get_email: Get detailed email content
        
        CURRENT CONTEXT:
        - Company: SowonLabs (AI products, SowonFlow development)
        - User Role: CEO
        - Current Date: {{{current_time}}}
        
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
    
    ### Common Operators:
    - from:sender@example.com - Find emails from specific sender
    - to:recipient@example.com - Find emails sent to recipient
    - subject:keyword - Search in subject line
    - has:attachment - Emails with attachments
    - after:2024/01/01 - Emails after specific date
    - before:2024/12/31 - Emails before specific date
    - is:unread - Unread emails only
    - is:important - Important emails
    - category:primary - Primary category emails
    
    ### Advanced Examples:
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
  "Find recent work-related emails and summarize important ones"
);
```

### MCP Tool Usage Patterns

#### Search and Analyze Pattern

```yaml
system_prompt: |
  Follow this pattern for email analysis:
  
  1. SEARCH: Use mcp__gmail__search_emails with relevant criteria
  2. FILTER: Identify important emails from search results
  3. RETRIEVE: Use mcp__gmail__get_email for detailed content
  4. ANALYZE: Categorize and summarize findings
  
  Example workflow:
  - Search: recent unread emails
  - Filter: work-related communications
  - Retrieve: full content of important emails
  - Analyze: provide structured summary
```

#### Batch Processing Pattern

```yaml
system_prompt: |
  For efficiency, batch your operations:
  
  RECOMMENDED:
  ✓ Search once with comprehensive criteria
  ✓ Collect multiple email IDs
  ✓ Retrieve contents in single tool call when possible
  
  AVOID:
  ✗ Multiple individual searches
  ✗ Opening emails one by one
  ✗ Redundant API calls
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

#### Agent with Multiple MCP Services

```yaml
agents:
  - id: "assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a comprehensive digital assistant with access to:
        - Gmail (email management)
        - Calendar (scheduling)
        - File system (document access)
        
        Use appropriate MCP tools based on user requests.
      mcp: ["gmail", "calendar", "files"]
```

### Error Handling and Best Practices

#### Robust Error Handling

```yaml
system_prompt: |
  ERROR HANDLING:
  - If MCP tool fails, explain the issue clearly
  - Suggest alternative approaches when possible
  - Always validate tool parameters before calling
  - Handle authentication issues gracefully
  
  EXAMPLE:
  If Gmail search fails:
  1. Check if search syntax is correct
  2. Try simplified search criteria
  3. Inform user of any limitations
```

#### Performance Optimization

```yaml
system_prompt: |
  PERFORMANCE GUIDELINES:
  - Use specific search criteria to limit results
  - Batch operations when possible
  - Cache results when appropriate
  - Set reasonable limits (maxResults: 10-50)
  
  SEARCH OPTIMIZATION:
  - Combine criteria: "from:team@company.com after:2024/01/01"
  - Use date ranges to limit scope
  - Filter by categories when relevant
```

#### Security Considerations

```yaml
system_prompt: |
  SECURITY GUIDELINES:
  - Never expose sensitive email content unnecessarily
  - Respect privacy boundaries
  - Summarize rather than quote personal information
  - Handle authentication failures appropriately
```

### Testing MCP Integration

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

    const result = await workflow.ask("Check for recent emails");
    expect(result.content).toBeDefined();
  });
});
```

#### Tool Availability Test

```typescript
it('should have MCP tools available', async () => {
  const result = await workflow.ask(
    "List all available tools and their descriptions"
  );
  
  expect(result.content).toContain('mcp__gmail__search_emails');
  expect(result.content).toContain('mcp__gmail__get_email');
});
```

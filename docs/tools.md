# Tools Usage Guide

## Overview

In SowonFlow, tools are core features that extend the capabilities of agents to interact with external systems. Agents can perform tasks such as searching for data, calling APIs, and processing files through tools.

## Understanding the Tool System

### What are Tools?
Tools are functions that agents can call, with the following characteristics:

- **Structured Input**: Parameters defined by a clear schema
- **Asynchronous Execution**: Support for asynchronous operations like external API calls or file processing
- **Error Handling**: Error handling for safe execution
- **Type Safety**: Runtime type verification through Zod schemas

### Supported Tool Formats
- **DynamicStructuredTool**: LangChain compatible tools (recommended)
- **Custom Functions**: User-defined functions
- **MCP Tools**: Model Context Protocol tools

### Differences with MCP

MCP (Model Context Protocol) tools are implemented as separate servers, making them reusable across multiple projects and suitable for complex external system integrations. For more details, refer to the [MCP Guide](./mcp.md).

## Basic Tool Implementation

### Using DynamicStructuredTool

```javascript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const searchTool = new DynamicStructuredTool({
  name: "search_database",
  description: "Searches for information in the database.",
  schema: z.object({
    query: z.string().describe("Search query"),
    category: z.string().optional().describe("Search category (optional)")
  }),
  func: async ({ query, category }) => {
    // Implement actual search logic
    const results = await database.search(query, category);
    return JSON.stringify(results);
  }
});
```

### Connecting Tools to Workflows

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Tool Usage Example"

agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are a research expert. Use tools to search for and analyze information."
      tools: ["search_database", "analyze_data"]

nodes:
  start:
    type: "agent_task"
    agent: "research_agent"
    input:
      template: "Research the following topic: {{user_query}}"
    next: "end"
  end:
    type: "end"
```

```javascript
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  config: config,
  tools: [searchTool, analysisTool] // Pass array of tools
});
```

## Real-world Examples: Business System Tools

### Scheduling Tool

```javascript
const calendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "Searches for schedules on a specific date.",
  schema: z.object({
    date: z.string().describe("Date to search (today, tomorrow, or YYYY-MM-DD)"),
    query: z.string().optional().describe("Search keyword (optional)")
  }),
  func: async ({ date, query }) => {
    try {
      // Connect to Google Calendar API or internal scheduling system
      if (date === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const events = await calendarAPI.getEvents(today);
        return `Today's (${today}) schedule: ${events.map(e => e.summary).join(', ')}`;
      } else if (date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const events = await calendarAPI.getEvents(tomorrowStr);
        return `Tomorrow's (${tomorrowStr}) schedule: ${events.map(e => e.summary).join(', ')}`;
      } else if (date.match(/\d{4}-\d{2}-\d{2}/)) {
        const events = await calendarAPI.getEvents(date);
        return `${date} schedule: ${events.length > 0 ? events.map(e => e.summary).join(', ') : 'No scheduled events.'}`;
      }
      return 'Please enter a valid date format.';
    } catch (error) {
      return `An error occurred while searching for schedules: ${error.message}`;
    }
  }
});
```

### HR Policy Search Tool

```javascript
const hrTool = new DynamicStructuredTool({
  name: "search_hr_policies",
  description: "Searches for HR policies and regulations.",
  schema: z.object({
    topic: z.string().describe("Search topic (e.g., travel expenses, leave, benefits)"),
    department: z.string().optional().describe("Department name (optional)")
  }),
  func: async ({ topic, department }) => {
    try {
      // Connect to HR system or document database
      const policies = await hrSystem.searchPolicies(topic, department);

      if (policies.length === 0) {
        return `No HR policies found for "${topic}".`;
      }

      return policies.map(policy => ({
        title: policy.title,
        summary: policy.summary,
        source: policy.document_name,
        last_updated: policy.updated_date
      }));
    } catch (error) {
      return `An error occurred while searching for HR policies: ${error.message}`;
    }
  }
});
```

### File Processing Tool

```javascript
const fileProcessorTool = new DynamicStructuredTool({
  name: "process_document",
  description: "Processes document files and extracts content.",
  schema: z.object({
    file_path: z.string().describe("File path to process"),
    action: z.enum(["extract_text", "summarize", "analyze"]).describe("Action to perform"),
    options: z.object({
      max_length: z.number().optional().describe("Maximum character length limit"),
      language: z.string().optional().describe("Document language")
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
          return "Unsupported action.";
      }
    } catch (error) {
      return `An error occurred while processing the file: ${error.message}`;
    }
  }
});
```

## Tool Design Best Practices

### 1. Clear Schema Definition

```javascript
// Good example: Clear and specific description
schema: z.object({
  user_id: z.string().describe("User's unique identifier (e.g., emp_12345)"),
  start_date: z.string().describe("Start date (YYYY-MM-DD format)"),
  end_date: z.string().describe("End date (YYYY-MM-DD format)"),
  include_weekends: z.boolean().default(false).describe("Include weekends")
})

// Bad example: Vague description
schema: z.object({
  id: z.string().describe("ID"),
  date: z.string().describe("Date"),
  flag: z.boolean().describe("Flag")
})
```

### 2. Safe Error Handling

```javascript
func: async (params) => {
  try {
    // Input validation
    if (!params.required_field) {
      return "Required field is missing.";
    }

    // Execute business logic
    const result = await externalAPI.call(params);

    // Validate result
    if (!result || result.error) {
      return `API call failed: ${result?.error || 'Unknown error'}`;
    }

    return result.data;
  } catch (error) {
    console.error('Tool execution error:', error);
    return `An error occurred while executing the tool: ${error.message}`;
  }
}
```

### 3. Appropriate Response Format

```javascript
// JSON response needed
func: async (params) => {
  const result = await processData(params);
  return JSON.stringify({
    status: "success",
    data: result,
    timestamp: new Date().toISOString()
  });
}

// Text response appropriate
func: async (params) => {
  const count = await database.count(params.query);
  return `Search results: ${count} items found.`;
}
```

## Advanced Tool Patterns

### Chaining Tools

Link multiple tools to perform complex tasks:

```javascript
const dataProcessingTool = new DynamicStructuredTool({
  name: "process_and_analyze",
  description: "Processes and analyzes data.",
  schema: z.object({
    data_source: z.string().describe("Data source"),
    analysis_type: z.enum(["statistical", "trend", "correlation"])
  }),
  func: async ({ data_source, analysis_type }) => {
    // Step 1: Data collection
    const rawData = await dataCollector.fetch(data_source);

    // Step 2: Data cleaning
    const cleanData = await dataProcessor.clean(rawData);

    // Step 3: Perform analysis
    const analysis = await analyzer.analyze(cleanData, analysis_type);

    return {
      data_points: cleanData.length,
      analysis_result: analysis,
      recommendations: analysis.recommendations
    };
  }
});
```

### Tools with Caching

Implement caching for performance improvement:

```javascript
const cachedSearchTool = new DynamicStructuredTool({
  name: "cached_search",
  description: "Search tool with caching.",
  schema: z.object({
    query: z.string().describe("Search query"),
    cache_duration: z.number().default(300).describe("Cache duration (seconds)")
  }),
  func: async ({ query, cache_duration }) => {
    const cacheKey = `search:${query}`;

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return `[Cached] ${cached}`;
    }

    // Perform actual search
    const result = await searchEngine.search(query);

    // Cache result
    await cache.set(cacheKey, result, cache_duration);

    return result;
  }
});
```

## Integration Example: Complete Multi-tool Workflow

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Comprehensive Business Assistant"
  description: "Multi-agent system utilizing various tools"

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
      system_prompt: "You are a coordinator that analyzes tasks and assigns them to appropriate experts."

  - id: "data_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an expert in data search and analysis."
      tools: ["search_database", "process_document", "cached_search"]

  - id: "business_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an expert in business processes and policies."
      tools: ["search_calendar", "search_hr_policies", "update_employee_info"]

nodes:
  start:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "Determine the task type: {{user_query}}"
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
      template: "Perform data-related tasks: {{user_query}}"
    next: "join_results"

  business_processing:
    type: "agent_task"
    agent: "business_specialist"
    input:
      template: "Perform business-related tasks: {{user_query}}"
    next: "join_results"

  join_results:
    type: "join"
    next: "final_summary"

  final_summary:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "Combine all results and provide a final answer."
    next: "end"

  general_response:
    type: "agent_task"
    agent: "coordinator"
    next: "end"

  end:
    type: "end"
```

## Troubleshooting and Debugging

### Common Issues

1. **Tool Execution Failure**
   - Schema validation errors: Check input parameter types
   - Asynchronous processing errors: Ensure proper use of async/await
   - External API connection failure: Verify network and authentication

2. **Performance Issues**
   - Long execution times: Consider caching and batch processing
   - Memory usage: Stream processing for large data

3. **Error Handling**
   - Return clear error messages that agents can understand
   - Provide useful information even in case of partial failure

### Debugging Tips

```javascript
// Tool execution logging
const debugTool = new DynamicStructuredTool({
  name: "debug_tool",
  description: "Example tool with debugging",
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

// Monitor tool usage in workflow
workflow.addStateListener((state) => {
  console.log("Current state:", state);
  // Check tool execution results
});
```

## Security Considerations

### 1. Input Validation
```javascript
func: async ({ file_path }) => {
  // Path validation
  if (file_path.includes('../') || file_path.startsWith('/')) {
    return "File path not allowed for security reasons.";
  }

  // File extension validation
  const allowedExtensions = ['.txt', '.pdf', '.docx'];
  const ext = path.extname(file_path).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return "Unsupported file format.";
  }

  // Normal processing
  return await processFile(file_path);
}
```

### 2. Permission Management
```javascript
func: async ({ user_id, action }) => {
  // Check user permissions
  const permissions = await getUserPermissions(user_id);
  if (!permissions.includes(action)) {
    return "You do not have permission to perform this action.";
  }

  return await performAction(action);
}
```

Tools are a powerful feature of SowonFlow that, when designed and implemented properly, can significantly enhance the capabilities of agents. Follow the guidelines above to develop safe and efficient tools.
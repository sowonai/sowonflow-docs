# Guide to Using Tools

## Overview

In SowonFlow, Tools are a core feature that extends an agent's capabilities, allowing it to interact with external systems. Through tools, agents can perform tasks such as retrieving data, calling APIs, and processing files.

## Understanding the Tool System

### What are Tools?
A tool is a function that an agent can call, characterized by:

- **Structured Input**: Parameters defined with a clear schema
- **Asynchronous Execution**: Asynchronous support for external API calls or file processing
- **Error Handling**: Error handling for safe execution
- **Type Safety**: Runtime type validation via Zod schema

### Supported Tool Formats
- **DynamicStructuredTool**: LangChain compatible tool (recommended)
- **Custom Functions**: User-defined functions
- **MCP Tools**: Model Context Protocol tools

### Differences from MCP

MCP (Model Context Protocol) tools are implemented as separate servers, allowing for reuse across multiple projects and are suitable for complex external system integrations. For more details, refer to the [MCP Guide](./mcp.md).
Second lesson!

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

### Connecting Tools to a Workflow

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
      system_prompt: "You are a research expert. Use tools to search and analyze information."
      tools: ["search_database", "analyze_data"]

nodes:
  start:
    type: "agent_task"
    agent: "research_agent"
    input:
      template: "Please research the following topic: {{user_query}}"
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

### Calendar Management Tool

```javascript
const calendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "Searches for events on a specific date.",
  schema: z.object({
    date: z.string().describe("Date to search (today, tomorrow, or YYYY-MM-DD)"),
    query: z.string().optional().describe("Search keyword (optional)")
  }),
  func: async ({ date, query }) => {
    try {
      // Integrate with Google Calendar API or internal scheduling system
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
        return `${date} schedule: ${events.length > 0 ? events.map(e => e.summary).join(', ') : 'No events scheduled.'}`;
      }
      return 'Please enter a valid date format.';
    } catch (error) {
      return `An error occurred while searching the calendar: ${error.message}`;
    }
  }
});
```

### HR Policy Search Tool

```javascript
const hrTool = new DynamicStructuredTool({
  name: "search_hr_policies",
  description: "Searches HR policies and regulations.",
  schema: z.object({
    topic: z.string().describe("Search topic (e.g., travel expenses, leave, welfare)"),
    department: z.string().optional().describe("Department name (optional)")
  }),
  func: async ({ topic, department }) => {
    try {
      // Integrate with HR system or document database
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
      return `An error occurred while searching HR policies: ${error.message}`;
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
    file_path: z.string().describe("Path to the file to process"),
    action: z.enum(["extract_text", "summarize", "analyze"]).describe("Action to perform"),
    options: z.object({
      max_length: z.number().optional().describe("Maximum character limit"),
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

## Best Practices for Tool Design

### 1. Clear Schema Definition

```javascript
// Good example: Clear and specific description
schema: z.object({
  user_id: z.string().describe("Unique identifier for the user (e.g., emp_12345)"),
  start_date: z.string().describe("Start date (YYYY-MM-DD format)"),
  end_date: z.string().describe("End date (YYYY-MM-DD format)"),
  include_weekends: z.boolean().default(false).describe("Whether to include weekends")
})

// Bad example: Ambiguous description
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
    
    // Result validation
    if (!result || result.error) {
      return `API call failed: ${result?.error || 'Unknown error'}`;
    }
    
    return result.data;
  } catch (error) {
    console.error('Tool execution error:', error);
    return `An error occurred during tool execution: ${error.message}`;
  }
}
```

### 3. Appropriate Response Format

```javascript
// If JSON response is needed
func: async (params) => {
  const result = await processData(params);
  return JSON.stringify({
    status: "success",
    data: result,
    timestamp: new Date().toISOString()
  });
}

// If text response is appropriate
func: async (params) => {
  const count = await database.count(params.query);
  return `Search results: Found ${count} items.`;
}
```

## Advanced Tool Patterns

### Chaining Tools

Perform complex tasks by linking multiple tools:

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
    
    // Step 2: Data cleansing
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
  description: "A search tool with caching applied.",
  schema: z.object({
    query: z.string().describe("Search query"),
    cache_duration: z.number().default(300).describe("Cache retention time (seconds)")
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

## Integrated Example: Complete Multi-Tool Workflow

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Comprehensive Business Assistant"
  description: "A multi-agent system utilizing various tools"

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
      system_prompt: "You are a coordinator who analyzes tasks and assigns them to the appropriate expert."
      
  - id: "data_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an expert responsible for data retrieval and analysis."
      tools: ["search_database", "process_document", "cached_search"]
      
  - id: "business_specialist"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an expert responsible for business processes and policies."
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
      template: "Consolidate all results and provide a final answer."
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
   - Asynchronous processing errors: Correct use of async/await
   - External API connection failure: Check network and authentication

2. **Performance Issues**
   - Long execution times: Consider caching and batch processing
   - Memory usage: Process large data streams

3. **Error Handling**
   - Return clear error messages that the agent can understand
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

Tools are one of SowonFlow's powerful features, and when designed and implemented appropriately, they can significantly enhance an agent's capabilities. Follow the guidelines above to develop safe and efficient tools.
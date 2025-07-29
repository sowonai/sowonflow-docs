# Multi-Agent Business Query System

This example demonstrates a real-world multi-agent workflow that routes business queries to specialized departments (HR and Scheduling) and combines their responses.

## Use Case

A company wants to create an AI assistant that can handle employee queries such as:
- HR policies (travel expenses, vacation days, etc.)
- Scheduling information (schedules, availability, etc.)
- Complex queries requiring both departments

## Workflow Features

- **Intelligent Routing**: Automatically determines which department to consult.
- **Parallel Processing**: Queries multiple departments simultaneously for faster responses.
- **Result Synthesis**: Combines information from various sources into a coherent answer.

## Full Implementation

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Business Query Multi-Agent System"
  description: "Routes business queries to appropriate experts and combines results"
  version: "0.1.0"

# Workflow state variables
state:
  variables:
    - name: "routing_decision"
      initial_value: null
    - name: "scheduling_response"
      initial_value: null
    - name: "hr_response"
      initial_value: null
  persistence: "session"

# Agent definitions
agents:
  - id: "master_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a master coordinating agent managing multiple specialized agents.
        
        Your tasks are:
        1. Analyze user queries to determine the type of information needed.
        2. Route queries to the appropriate experts.
        3. Synthesize responses from multiple agents into a comprehensive answer.
        
        For routing decisions, respond with exactly one of the following values:
        - scheduling: If only scheduling/calendar information is needed.
        - HR: If only HR policy/benefits information is needed.
        - both: If both scheduling and HR information are needed.
        - none: If neither is needed and you can answer directly.
  
  - id: "scheduling_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are an expert in scheduling and calendar management. You have access to the scheduling system and can:
        - Retrieve schedules for specific dates
        - Check availability
        - Provide schedule-related information
        
        Focus only on the scheduling and calendar aspects of the query.
        Use tools to retrieve relevant scheduling information.
      tools: ["search_calendar"]
  
  - id: "hr_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are an expert in HR policies. You have access to the HR system and can:
        - Search HR policies and regulations
        - Provide information on benefits, allowances, and policies
        - Update employee information if necessary
        
        Focus only on the HR policy and benefits aspects of the query.
        Use tools to retrieve relevant HR information.
      tools: ["search_hr", "update_userinfo"]

# Workflow nodes
nodes:
  start:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: |
        Analyze this user query and determine the type of information needed.
        
        User query: {{user_query}}
        
        Respond with exactly one of the following values:
        - scheduling: If scheduling/calendar information is needed.
        - HR: If HR policy/benefits information is needed.
        - both: If both scheduling and HR information are needed.
        - none: If you can answer directly without expert help.
    output:
      to_state: "routing_decision"
      format: "enum"
      schema:
        type: string
        enum: [both, scheduling, HR, none]
    next: "route_decision"
  
  route_decision:
    type: "branch"
    method: "condition"
    condition: "routing_decision"
    branches:
      "both": "scheduling_hr_parallel"
      "scheduling": "scheduling_task"
      "HR": "hr_task"
    default: "direct_response"
  
  # Parallel processing for queries needing both departments
  scheduling_hr_parallel:
    type: "parallel"
    branches: ["scheduling_task", "hr_task"]
  
  scheduling_task:
    type: "agent_task"
    agent: "scheduling_agent"
    input:
      template: |
        User query: {{user_query}}
        
        You are the scheduling expert. Handle only the scheduling/calendar aspect of this query.
        Retrieve relevant scheduling information and provide the result.
    output:
      to_state: "scheduling_response"
      format: "text"
    next: "join"
  
  hr_task:
    type: "agent_task"
    agent: "hr_agent"
    input:
      template: |
        User query: {{user_query}}
        
        You are the HR expert. Handle only the HR policy/benefits aspect of this query.
        Retrieve relevant HR policies and provide the result.
    output:
      to_state: "hr_response"
      format: "text"
    next: "join"
  
  direct_response:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: "Please answer this query directly: {{user_query}}"
    next: "end"
  
  # Join parallel branches
  join:
    type: "join"
    next: "combine_results"

  # Combine results from experts
  combine_results:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: |
        Original user query: {{user_query}}
        
        Synthesize the following expert responses into a comprehensive answer:
        
        {{#if scheduling_response}}
        Scheduling Information: {{scheduling_response}}
        {{/if}}
        
        {{#if hr_response}}
        HR Information: {{hr_response}}
        {{/if}}
        
        Provide a clear and comprehensive response that answers the user's original question.
    next: "end"
  
  end:
    type: "end"
```

## JavaScript Implementation

```javascript
import { Workflow, createConfig } from '@sowonai/sowonflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Define custom tools for agents
const searchCalendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "Searches for calendar events on a specific date.",
  schema: z.object({
    date: z.string().describe("The date to search (today, tomorrow, or YYYY-MM-DD)"),
    query: z.string().optional().describe("Optional search keyword")
  }),
  func: async ({ date, query }) => {
    // Mock calendar data - replace with actual calendar API
    if (date === 'today') {
      return 'Today\'s schedule: 9 AM Strategy Meeting, 2 PM Product Review';
    } else if (date === 'tomorrow') {
      return 'Tomorrow\'s schedule: 10 AM Team Meeting';
    } else if (date.match(/\d{4}-\d{2}-\d{2}/)) {
      return `${date} schedule: No appointments scheduled.`;
    }
    return 'No events found for the specified date.';
  }
});

const searchHRTool = new DynamicStructuredTool({
  name: "search_hr",
  description: "Searches HR policies and information.",
  schema: z.object({
    query: z.string().describe("Query for HR information")
  }),
  func: async ({ query }) => {
    // Mock HR data - replace with actual HR system API
    if (query.includes('travel') || query.includes('출장')) {
      return 'Travel expenses: 200,000 KRW per day for domestic travel. (Source: Travel Policy.pdf)';
    } else if (query.includes('vacation') || query.includes('휴가')) {
      return 'Annual leave: 15 basic days provided per year.';
    }
    return 'No HR information found for this query.';
  }
});

const updateUserinfoTool = new DynamicStructuredTool({
  name: "update_userinfo",
  description: "Updates user information in the HR system.",
  schema: z.object({
    userId: z.string().describe("User ID"),
    information: z.record(z.any()).describe("Information to update")
  }),
  func: async ({ userId, information }) => {
    return `User ${userId} information updated: ${JSON.stringify(information)}`;
  }
});

// Configuration
const config = createConfig({
  apiKey: process.env.SOWONAI_API_KEY,
  spaceId: process.env.SOWONAI_SPACE_ID,
  baseUrl: process.env.SOWONAI_BASE_URL || 'http://localhost:3030'
});

// Create and run workflow
async function runBusinessQuerySystem() {
  const workflow = new Workflow({
    mainWorkflow: yamlContent, // Use the YAML above
    config: config,
    tools: [searchCalendarTool, searchHRTool, updateUserinfoTool]
  });

  // Add state listener for debugging
  workflow.addStateListener((state) => {
    const { messages, ...otherState } = state;
    console.log("[STATE CHANGE]", otherState);
  });

  // Test queries
  const testQueries = [
    "What is my schedule for today?",
    "How much travel expense can I get?", 
    "I'm planning a business trip to Seoul next Wednesday, how much is the travel expense and are there any conflicts in my schedule that day?"
  ];

  for (const query of testQueries) {
    console.log(`\n=== Query: ${query} ===`);
    
    const result = await workflow.ask(query);
    console.log("Response:", result.content);
    
    // Check final state
    const finalState = workflow.getState();
    console.log("Routing Decision:", finalState.routing_decision);
    console.log("Scheduling Response:", finalState.scheduling_response);
    console.log("HR Response:", finalState.hr_response);
  }
}

// Run the system
runBusinessQuerySystem().catch(console.error);
```

## Expected Results

### Query: "I'm planning a business trip to Seoul next Wednesday, how much is the travel expense and are there any conflicts in my schedule that day?"

**Execution Flow:**
1. **Master Agent** analyzes query → determines `both` (scheduling + HR info needed)
2. **Parallel Processing** executes:
   - Scheduling Agent searches for Wednesday's schedule
   - HR Agent searches for travel policy
3. **Join** waits for both agents to complete
4. **Master Agent** combines responses

**Final Response:**
```
Regarding your business trip to Seoul:

**Schedule**: There are no appointments scheduled for next Wednesday, so your trip should not have any conflicts.

**Travel Expenses**: According to company policy, 200,000 KRW per day is provided for domestic business trips.

You can proceed with your trip without schedule conflicts, and there are clear guidelines for travel expense support.
```

## Demonstrated Key Benefits

1. **Automated Routing**: The system intelligently determines that this query requires both scheduling and HR information.
2. **Parallel Efficiency**: Both departments are consulted simultaneously, reducing response time.
3. **Comprehensive Response**: Information from multiple sources is synthesized into a clear and actionable answer.
4. **Scalability**: Easily expandable by adding more departments (Finance, Legal, etc.) as agents and routing logic.

## Customization Options

### Add New Department
```yaml
agents:
  - id: "finance_agent"
    inline:
      type: "agent"
      system_prompt: "You handle budget and financial queries."
      tools: ["search_budget"]
```

### Complex Routing Logic
```yaml
nodes:
  start:
    input:
      template: |
        Analyze: {{user_query}}
        
        Consider the following departments:
        - HR: Policies, benefits, personnel
        - Scheduling: Calendars, availability
        - Finance: Budgets, expenses, approvals
        - Legal: Contracts, compliance
        
        Respond with a comma-separated list or a single value: HR,Scheduling or Finance
```

### Conditional Processing
```yaml
nodes:
  check_urgency:
    type: "branch"
    condition: "urgency_level" 
    branches:
      "high": "priority_processing"
      "medium": "standard_processing"
```

This example demonstrates how SowonFlow's multi-agent workflow can solve real-world business problems through intelligent routing, parallel processing, and result synthesis.
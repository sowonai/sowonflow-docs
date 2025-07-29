# Multi-Agent Business Query System

This example demonstrates a real-world multi-agent workflow that routes business queries to specialized departments (HR and Scheduling) and combines the responses.

## Use Case

You want to create an AI assistant in your company that can handle employee queries such as:
- HR policies (travel expenses, vacation days, etc.)
- Scheduling information (calendar, availability, etc.)
- Complex queries that require both departments

## Workflow Features

- **Intelligent Routing**: Automatically determines which department to route the query to
- **Parallel Processing**: Queries multiple departments simultaneously for faster responses
- **Result Aggregation**: Combines information from multiple sources into a coherent answer

## Complete Implementation

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Business Query Multi-Agent System"
  description: "Route business queries to appropriate experts and combine results"
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
        You are a master coordinating agent managing multiple specialist agents.

        Your tasks are:
        1. Analyze user queries to determine the required information type
        2. Route the query to the appropriate specialist
        3. Aggregate responses from multiple agents into a comprehensive answer

        For routing decisions, respond with exactly one of these values:
        - Scheduling: Only scheduling/calendar information is needed
        - HR: Only HR policy/benefits information is needed
        - Both: Both scheduling and HR information are needed
        - None: Neither is needed and you can answer directly

  - id: "scheduling_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a scheduling and calendar management expert. You have access to the scheduling system and can:
        - Search for schedules on specific dates
        - Check availability
        - Provide scheduling-related information

        Focus only on the scheduling/calendar aspects of the query.
        Use tools to search for relevant scheduling information.
      tools: ["search_calendar"]

  - id: "hr_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are an HR policy expert. You have access to the HR system and can:
        - Search for HR policies and regulations
        - Provide information about benefits, allowances, and policies
        - Update employee information when needed

        Focus only on the HR policy and benefits aspects of the query.
        Use tools to search for relevant HR information.
      tools: ["search_hr", "update_userinfo"]

# Workflow nodes
nodes:
  start:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: |
        Analyze this user query and determine the required information type.

        User query: {{user_query}}

        Respond with exactly one of these values:
        - Scheduling: Scheduling/calendar information is needed
        - HR: HR policy/benefits information is needed
        - Both: Both scheduling and HR information are needed
        - None: You can answer directly without specialist help
    output:
      to_state: "routing_decision"
      format: "enum"
      schema:
        type: string
        enum: [Both, Scheduling, HR, None]
    next: "route_decision"

  route_decision:
    type: "branch"
    method: "condition"
    condition: "routing_decision"
    branches:
      "Both": "parallel_scheduling_hr"
      "Scheduling": "scheduling_task"
      "HR": "hr_task"
    default: "direct_response"

  # Parallel processing for queries needing both departments
  parallel_scheduling_hr:
    type: "parallel"
    branches: ["scheduling_task", "hr_task"]

  scheduling_task:
    type: "agent_task"
    agent: "scheduling_agent"
    input:
      template: |
        User query: {{user_query}}

        You are the scheduling expert. Handle only the scheduling/calendar aspects of this query.
        Search for relevant scheduling information and provide the results.
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

        You are the HR expert. Handle only the HR policy/benefits aspects of this query.
        Search for relevant HR policies and provide the results.
    output:
      to_state: "hr_response"
      format: "text"
    next: "join"

  direct_response:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: "Answer this query directly: {{user_query}}"
    next: "end"

  # Parallel branch join
  join:
    type: "join"
    next: "aggregate_results"

  # Aggregate expert results
  aggregate_results:
    type: "agent_task"
    agent: "master_agent"
    input:
      template: |
        Original user query: {{user_query}}

        Combine these specialist responses into a comprehensive answer:

        {{#if scheduling_response}}
        Scheduling information: {{scheduling_response}}
        {{/if}}

        {{#if hr_response}}
        HR information: {{hr_response}}
        {{/if}}

        Provide a clear and comprehensive answer to the user's original question.
    next: "end"

  end:
    type: "end"
```

## JavaScript Implementation

```javascript
import { Workflow, createConfig } from '@sowonai/sowonflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Custom tools for agents
const searchCalendarTool = new DynamicStructuredTool({
  name: "search_calendar",
  description: "Search for calendar events on a specific date.",
  schema: z.object({
    date: z.string().describe("Date to search (today, tomorrow, or YYYY-MM-DD)"),
    query: z.string().optional().describe("Optional search keyword")
  }),
  func: async ({ date, query }) => {
    // Mock calendar data - replace with actual calendar API
    if (date === 'today') {
      return 'Today\'s schedule: 9am strategy meeting, 2pm product review';
    } else if (date === 'tomorrow') {
      return 'Tomorrow\'s schedule: 10am team meeting';
    } else if (date.match(/\d{4}-\d{2}-\d{2}/)) {
      return `${date} schedule: No scheduled appointments.`;
    }
    return 'No events found for the specified date.';
  }
});

const searchHRTool = new DynamicStructuredTool({
  name: "search_hr",
  description: "Search for HR policies and information.",
  schema: z.object({
    query: z.string().describe("HR information search query")
  }),
  func: async ({ query }) => {
    // Mock HR data - replace with actual HR system API
    if (query.includes('travel') || query.includes('출장')) {
      return 'Travel expenses: Up to 200,000 KRW per day for domestic travel. (Source: travel_policy.pdf)';
    } else if (query.includes('vacation') || query.includes('휴가')) {
      return 'Vacation: 15 days of paid vacation per year.';
    }
    return 'No HR information found for this query.';
  }
});

const updateUserinfoTool = new DynamicStructuredTool({
  name: "update_userinfo",
  description: "Update user information in the HR system.",
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
    console.log("[State change]", otherState);
  });

  // Test queries
  const testQueries = [
    "What's my schedule for today?",
    "How much travel expense is covered?",
    "I'm planning a trip to Seoul next Wednesday - how much travel expense is covered and do I have any schedule conflicts that day?"
  ];

  for (const query of testQueries) {
    console.log(`\n=== Query: ${query} ===`);

    const result = await workflow.ask(query);
    console.log("Response:", result.content);

    // Check final state
    const finalState = workflow.getState();
    console.log("Routing decision:", finalState.routing_decision);
    console.log("Scheduling response:", finalState.scheduling_response);
    console.log("HR response:", finalState.hr_response);
  }
}

// Run the system
runBusinessQuerySystem().catch(console.error);
```

## Expected Results

### Query: "I'm planning a trip to Seoul next Wednesday - how much travel expense is covered and do I have any schedule conflicts that day?"

**Execution Flow:**
1. **Master Agent** analyzes query → decides `Both` (needs scheduling + HR info)
2. **Parallel Processing** executed:
   - Scheduling agent searches for Wednesday schedule
   - HR agent searches for travel policy
3. **Join** waits for both agents to complete
4. **Master Agent** combines the responses

**Final Response:**
```
Here's the information for your Seoul trip next Wednesday:

**Schedule**: You have no scheduled appointments that day, so there are no conflicts with your trip.

**Travel Expenses**: Company policy provides 200,000 KRW per day for domestic travel.

You can proceed with your trip without schedule conflicts and with clear travel expense guidelines.
```

## Proven Key Benefits

1. **Automatic Routing**: The system intelligently determined this query needs both scheduling and HR information
2. **Parallel Efficiency**: Both departments consulted simultaneously for faster response time
3. **Comprehensive Answer**: Information from multiple sources combined into a clear, actionable answer
4. **Scalability**: Easily extendable by adding more departments (Finance, Legal, etc.) with their agents and routing logic

## Customization Options

### Add New Department
```yaml
agents:
  - id: "finance_agent"
    inline:
      type: "agent"
      system_prompt: "You handle budget and financial queries."
      tools: ["budget_search"]
```

### Complex Routing Logic
```yaml
nodes:
  start:
    input:
      template: |
        Analyze: {{user_query}}

        Consider these departments:
        - HR: policies, benefits, personnel
        - Scheduling: scheduling, availability
        - Finance: budget, costs, approvals
        - Legal: contracts, compliance

        Respond with a comma-separated list or single value: HR,Scheduling or Finance
```

### Conditional Processing
```yaml
nodes:
  urgency_check:
    type: "branch"
    condition: "urgency_level"
    branches:
      "High": "priority_processing"
      "Normal": "standard_processing"
```

This example demonstrates how SowonFlow's multi-agent workflows can solve real business problems through intelligent routing, parallel processing, and result aggregation.
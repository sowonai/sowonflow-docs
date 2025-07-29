# Multi-Agent Workflow

## Overview

SowonFlow supports sophisticated multi-agent workflows that can orchestrate multiple specialist agents to handle complex business scenarios, enabling parallel processing, intelligent routing, and collaborative problem-solving.

## Key Features

### Parallel Processing
Execute multiple agents simultaneously to shorten response times and efficiently handle complex queries.

### Intelligent Routing
Automatically route user queries to the most appropriate agent based on content analysis.

### State Management
Share data and context between agents throughout the workflow execution.

### Result Combination
Combine responses from multiple agents into a consistent and comprehensive answer.

## Basic Multi-Agent Structure

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Multi-Agent Example"
  description: "Orchestrates multiple specialist agents"

state:
  variables:
    - name: "route_decision"
      initial_value: null
    - name: "expert_response"
      initial_value: null

agents:
  - id: "coordinator"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You coordinate multiple specialist agents."

  - id: "expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an expert in a specific domain."
      tools: ["domain_search"]

nodes:
  start:
    type: "agent_task"
    agent: "coordinator"
    output:
      to_state: "route_decision"
    next: "route_check"

  route_check:
    type: "branch"
    method: "condition"
    condition: "route_decision"
    branches:
      "expert": "expert_task"
    default: "direct_answer"

  expert_task:
    type: "agent_task"
    agent: "expert"
    output:
      to_state: "expert_response"
    next: "combine_results"

  combine_results:
    type: "agent_task"
    agent: "coordinator"
    input:
      template: "Combine the results: {{expert_response}}"
    next: "end"

  direct_answer:
    type: "agent_task"
    agent: "coordinator"
    next: "end"

  end:
    type: "end"
```

## Advanced Patterns

### Parallel Execution

```yaml
nodes:
  parallel_processing:
    type: "parallel"
    branches: ["agent_a_task", "agent_b_task"]

  agent_a_task:
    type: "agent_task"
    agent: "agent_a"
    next: "join"

  agent_b_task:
    type: "agent_task"
    agent: "agent_b"
    next: "join"

  join:
    type: "join"
    next: "combine_results"
```

### Conditional Branching

```yaml
nodes:
  decision_point:
    type: "branch"
    method: "condition"
    condition: "analysis_result"
    branches:
      "complex": "expert_team"
      "simple": "single_agent"
      "urgent": "priority_handler"
    default: "general_handler"
```

## Use Case: Business Query Router

Example showing how to route business queries to the appropriate department:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Business Query Router"
  description: "Routes queries to HR, scheduling, or finance experts"

state:
  variables:
    - name: "query_type"
      initial_value: null
    - name: "hr_response"
      initial_value: null
    - name: "calendar_response"
      initial_value: null

agents:
  - id: "router"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "Analyze the query and determine the appropriate department. Respond with HR, scheduling, both, or general."

  - id: "hr_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are an HR expert. Handle queries about policies, benefits, and employees."
      tools: ["HR_policy_search"]

  - id: "calendar_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are a scheduling expert. Handle queries about scheduling and availability."
      tools: ["calendar_search"]

nodes:
  start:
    type: "agent_task"
    agent: "router"
    input:
      template: "Analyze this query and determine the department: {{user_query}}"
    output:
      to_state: "query_type"
      format: "enum"
      schema:
        type: string
        enum: [HR, CALENDAR, BOTH, GENERAL]
    next: "route_query"

  route_query:
    type: "branch"
    method: "condition"
    condition: "query_type"
    branches:
      "BOTH": "parallel_processing"
      "HR": "hr_task"
      "CALENDAR": "calendar_task"
    default: "general_response"

  parallel_processing:
    type: "parallel"
    branches: ["hr_task", "calendar_task"]

  hr_task:
    type: "agent_task"
    agent: "hr_expert"
    input:
      template: "Handle this HR query: {{user_query}}"
    output:
      to_state: "hr_response"
    next: "join_responses"

  calendar_task:
    type: "agent_task"
    agent: "calendar_expert"
    input:
      template: "Handle this scheduling query: {{user_query}}"
    output:
      to_state: "calendar_response"
    next: "join_responses"

  join_responses:
    type: "join"
    next: "combine_responses"

  combine_responses:
    type: "agent_task"
    agent: "router"
    input:
      template: |
        Original query: {{user_query}}

        HR response: {{hr_response}}
        Scheduling response: {{calendar_response}}

        Combine this information to provide a comprehensive response.
    next: "end"

  general_response:
    type: "agent_task"
    agent: "router"
    input:
      template: "Provide a general response to this query: {{user_query}}"
    next: "end"

  end:
    type: "end"
```

## Node Type Reference

### Parallel Node
Execute multiple branches simultaneously:
```yaml
parallel_node:
  type: "parallel"
  branches: ["task1", "task2", "task3"]
```

### Join Node
Wait for all parallel branches to complete:
```yaml
join_node:
  type: "join"
  next: "next_step"
```

### Branch Node
Route execution based on conditions:
```yaml
branch_node:
  type: "branch"
  method: "condition"
  condition: "state_variable"
  branches:
    "value1": "path1"
    "value2": "path2"
  default: "default_path"
```

## Best Practices

### 1. Agent Specialization
Create agents with clear and focused responsibilities:
```yaml
agents:
  - id: "data_analyst"
    system_prompt: "You analyze data and provide insights."
  - id: "report_writer"
    system_prompt: "You write professional reports."
```

### 2. State Management
Use meaningful variable names and proper scoping:
```yaml
state:
  variables:
    - name: "analysis_result"
      initial_value: null
    - name: "report_status"
      initial_value: "pending"
```

### 3. Error Handling
Always provide a default path for branch nodes:
```yaml
decision_node:
  type: "branch"
  branches:
    "success": "continue_processing"
    "error": "error_handler"
  default: "fallback_handler"  # Always include
```

### 4. Performance Optimization
- Use parallel processing for independent tasks
- Keep agent system prompts focused and concise
- Limit the number of parallel branches (recommended: 2-4)

## Common Patterns

### Master-Worker Pattern
One coordinating agent manages multiple worker agents:
```yaml
agents:
  - id: "master"
    system_prompt: "You coordinate and delegate tasks to experts."
  - id: "worker_1"
    system_prompt: "You handle specific task type A."
  - id: "worker_2"
    system_prompt: "You handle specific task type B."
```

### Pipeline Pattern
Sequential processing through specialist agents:
```yaml
nodes:
  extract:
    type: "agent_task"
    agent: "extractor"
    next: "transform"
  transform:
    type: "agent_task"
    agent: "transformer"
    next: "load"
  load:
    type: "agent_task"
    agent: "loader"
    next: "end"
```

### Consensus Pattern
Multiple agents provide input for decision-making:
```yaml
nodes:
  parallel_analysis:
    type: "parallel"
    branches: ["expert_1", "expert_2", "expert_3"]
  # ... individual expert tasks
  consensus:
    type: "agent_task"
    agent: "decision_maker"
    input:
      template: "Make a decision based on the following: {{expert_1_result}}, {{expert_2_result}}, {{expert_3_result}}"
    next: "end"
```

## Troubleshooting

### Common Issues

1. **Parallel branches not completing**: Verify that all parallel branches have proper `next` settings pointing to a join node.

2. **State variables not updating**: Check that `output.to_state` is correctly set in agent tasks.

3. **Branch conditions not working**: Ensure the condition variable exists in the state and holds the expected value.

4. **Performance issues**: Limit parallel branches and optimize agent prompts for faster responses.

### Debugging Tips

1. Monitor execution with a workflow state listener:
```javascript
workflow.addStateListener((state) => {
  console.log("Current state:", state);
});
```

2. Add logging to agent prompts for debugging:
```yaml
system_prompt: "You are an expert. Always start your response with [agent_name] for debugging purposes."
```

3. Test individual agents before integrating them into the workflow.
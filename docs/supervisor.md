# Supervisor

## What is a Supervisor?

A Supervisor is a specialized agent that orchestrates and coordinates multiple agents to handle complex tasks. It analyzes user requests, selects appropriate agents, and creates dynamic workflows to solve multifaceted problems.

### Key Roles

* **Analyzes complex requests** and breaks them down into manageable tasks.
* **Selects appropriate agents** and assigns them from the management team.
* **Generates dynamic workflows** based on the request type.
* **Coordinates execution** among multiple specialized agents.
* **Synthesizes results from various agents** to provide a coherent response.

---

## Simple Supervisor Example

The most basic supervisor definition can be written as follows:

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "parallel"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a project supervisor who coordinates tasks with specialized agents.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

---

## Specifying Workflow Patterns with supervisor_mode

In the supervisor type, you can explicitly specify workflow execution patterns. The `supervisor_mode` property allows you to choose one of the following four patterns:

* `sequential`: Executes agents sequentially.
* `parallel`: Executes agents in parallel and synthesizes results.
* `branch`: Selectively executes specific agent(s) based on conditions (exclusive choice).
* `auto`: AI analyzes the request and automatically selects the optimal mode (default).

---

## Example of Managed Agents

You can define specialized agents that the supervisor can coordinate:

```yaml
agents:
  # Supervisor
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "branch"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a supervisor managing a team of expert consultants.
        Generate an appropriate workflow based on the request and supervisor_mode.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  # Managed Agents
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a legal expert specializing in contract analysis, regulatory compliance, and legal risk assessment.
  
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        You are a technical expert specializing in software architecture, technology evaluation, and implementation planning.
  
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        You are a business analyst specializing in strategic planning, market analysis, and ROI evaluation.
```

---

## supervisor_mode Detailed Specification

In the supervisor type, you can explicitly specify workflow execution patterns. The `supervisor_mode` property allows you to choose one of the following four patterns:

* `sequential`: Executes agents sequentially.
* `parallel`: Executes agents in parallel and synthesizes results.
* `branch`: Selectively executes specific agent(s) based on conditions (exclusive choice).
* `auto`: AI analyzes the request and automatically selects the optimal mode (default).

The workflow execution method varies depending on the `supervisor_mode` value:

* **sequential**: Tasks are executed in order.
  ```
  Request → Legal Review → Technical Evaluation → Business Analysis → Result
  ```

* **parallel**: Multiple experts analyze simultaneously.
  ```
  Request → [Legal Expert, Tech Expert, Business Analyst] → Synthesis → Result
  ```

* **branch**: Only one expert is selectively executed based on the request.
  ```
  Request → Analysis → Branch to appropriate expert → Result
  ```

* **auto**: AI analyzes the request and automatically selects the optimal pattern.
  ```
  Request → Analysis → (one of sequential/parallel/branch) → Result
  ```

## Complete Workflow Example

A complete example of a real workflow is as follows:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Multi-Expert Analysis"
  description: "Supervisor coordinates expert analysis"

agents:
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "auto"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a supervisor coordinating expert analysis.
        Determine the workflow pattern based on supervisor_mode.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a legal expert. Focus on:
        - Regulatory compliance
        - Contract terms and risks
        - Legal implications
  
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        You are a technical expert. Focus on:
        - Implementation feasibility
        - Technical architecture
        - Performance considerations
  
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        You are a business analyst. Focus on:
        - Strategic impact
        - Market considerations
        - ROI and business value

nodes:
  start:
    type: "agent_task"
    agent: "supervisor"
    next: "end"
  
  end:
    type: "end"
```

## Built-in Supervisor Tools

The supervisor can automatically access specialized tools. The behavior of these tools also varies depending on the supervisor_mode.

* **workflow_template_selector**: When supervisor_mode is `auto`, it analyzes user requests and selects an appropriate workflow pattern.
  - Determines whether sequential, parallel, or branch pattern is needed.
  - Selects agents to participate.
  - Provides reasoning for the decision.

* **dynamic_workflow_executor**: Dynamically creates and executes workflows based on the supervisor_mode.
  - Configures the workflow according to the selected pattern (sequential, parallel, branch, auto).
  - Coordinates agent execution.
  - Handles data flow between agents.
  - Synthesizes final results.

## System Prompt Best Practices

Example of writing a system prompt utilizing supervisor_mode:

```yaml
system_prompt: |
  You are a project supervisor managing a team of expert consultants.
  Determine the workflow pattern based on supervisor_mode.
  
  supervisor_mode:
    - sequential: When tasks need to be performed in a specific order.
    - parallel: When diverse perspectives are needed.
    - branch: When only one expert needs to be selected based on conditions.
    - auto: AI determines and selects the optimal pattern.
  
  Available experts:
    - legal_expert: Contract analysis, compliance, legal risks
    - tech_expert: Technical feasibility, architecture, implementation
    - business_analyst: Strategy, market analysis, business impact
  
  Always explain the supervisor_mode and workflow selection, and provide comprehensive results.
```

## Common Use Cases

Here are typical use cases for each supervisor_mode:

#### Product Development Analysis
```
User: "Please evaluate the feasibility of launching a new AI-powered feature."
Supervisor: supervisor_mode: parallel → Simultaneous analysis by Legal (compliance), Tech (implementation), Business (market)
```

#### Contract Review Process
```
User: "Please review this partnership agreement."
Supervisor: supervisor_mode: sequential → Sequential analysis: Legal (terms) → Business (strategic impact) → Tech (integration)
```

#### Strategic Decision Making
```
User: "Should we migrate to cloud infrastructure?"
Supervisor: supervisor_mode: parallel → All experts analyze simultaneously → Synthesis
```

#### When only a specific expert is needed (branch)
```
User: "What are the technical considerations for this feature?"
Supervisor: supervisor_mode: branch → Only tech_expert is executed
```

## Supervisor Testing

You can write test workflows for each supervisor_mode as follows:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Supervisor Test"

agents:
  - id: "test_supervisor"
    inline:
      type: "supervisor"
      model: "google/gemini-2.5-pro"
      supervisor_mode: "parallel"
      system_prompt: |
        You are a test supervisor. Generate a workflow based on supervisor_mode.
      agents: ["expert_a", "expert_b"]
  
  - id: "expert_a"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: "You are Expert A. Provide perspective A on all topics."
  
  - id: "expert_b"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are Expert B. Provide perspective B on all topics."

nodes:
  start:
    type: "agent_task"
    agent: "test_supervisor"
    next: "end"
  
  end:
    type: "end"
```

Test with the following requests:

* supervisor_mode: parallel → "Analyze the pros and cons of remote work."
* supervisor_mode: sequential → "Create a step-by-step plan for project launch."
* supervisor_mode: branch → "What are the technical considerations for this feature?"
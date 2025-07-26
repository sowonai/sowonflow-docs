# Supervisor

## What is a Supervisor?

A supervisor is a specialized agent that coordinates and manages multiple agents to handle complex tasks. It analyzes user requests, selects appropriate agents, and generates dynamic workflows to solve multifaceted problems.

### Key Roles

* **Analyze** and manage complex requests into manageable tasks
* **Select** appropriate agents for assignment from the management team
* **Generate** dynamic workflows based on request types
* **Coordinate** execution among multiple specialist agents
* **Consolidate** results from various agents to provide a consistent response

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
        You are a project supervisor coordinating work with specialist agents.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

---

## Specifying Workflow Patterns with supervisor_mode

In the supervisor type, you can explicitly specify the workflow execution pattern. You can choose one of the following four patterns using the `supervisor_mode` attribute:

* `sequential`: Execute agents sequentially
* `parallel`: Execute agents in parallel and then consolidate results
* `branch`: Select and execute specific agent(s) based on conditions (single choice)
* `auto`: AI automatically selects the optimal mode by analyzing the request (default)

---

## Example of Managed Agents

You can define specialist agents that the supervisor can coordinate together:

```yaml
agents:
  # Supervisor
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "anthropic/claude-sonnet-4"
      supervisor_mode: "branch"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a supervisor managing specialist consultants.
        Generate appropriate workflows based on requests according to supervisor_mode.
      agents: ["legal_expert", "tech_expert", "business_analyst"]

  # Managed agents
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a legal expert specializing in contract analysis, compliance, and legal risk assessment.

  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        You are a technical expert specializing in software architecture, technical evaluation, and implementation plans.

  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        You are a business analyst specializing in strategic planning, market analysis, and ROI evaluation.
```

---

## Detailed Specifications of supervisor_mode

In the supervisor type, you can explicitly specify the workflow execution pattern. You can choose one of the following four patterns using the `supervisor_mode` attribute:

* `sequential`: Execute agents sequentially
* `parallel`: Execute agents in parallel and then consolidate results
* `branch`: Select and execute specific agent(s) based on conditions (single choice)
* `auto`: AI automatically selects the optimal mode by analyzing the request (default)

The workflow execution method changes depending on the `supervisor_mode` value:

* **sequential (Sequential)**: Tasks are executed in order
  ```
  Request → Legal Review → Technical Evaluation → Business Analysis → Result
  ```

* **parallel (Parallel)**: Multiple experts analyze simultaneously
  ```
  Request → [Legal Expert, Technical Expert, Business Analyst] → Consolidation → Result
  ```

* **branch (Branch)**: Selectively execute one expert based on the request
  ```
  Request → Analysis → Branch to appropriate expert → Result
  ```

* **auto (Auto)**: AI analyzes the request and automatically selects the optimal pattern
  ```
  Request → Analysis → (One of sequential/parallel/branch) → Result
  ```

## Complete Workflow Example

A complete example of an actual workflow is as follows:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Multi-expert Analysis"
  description: "Supervisor coordinating expert analysis"

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
        You are a legal expert. Focus on the following:
        - Compliance
        - Contract terms and risks
        - Legal implications

  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        You are a technical expert. Focus on the following:
        - Feasibility of implementation
        - Technical architecture
        - Performance considerations

  - id: "business_analyst"
    inline:
      type: "agent"
      model: "google/gemini-2.5-pro"
      system_prompt: |
        You are a business analyst. Focus on the following:
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

The supervisor can automatically access specialized tools. The way these tools operate also changes depending on the `supervisor_mode`.

* **workflow_template_selector**: When `supervisor_mode` is auto, it analyzes the user request to select the appropriate workflow pattern.
  - Determine which pattern (sequential, parallel, branch) is needed
  - Select the agents that need to participate
  - Provide reasoning for the decision

* **dynamic_workflow_executor**: Dynamically generates and executes workflows based on `supervisor_mode`.
  - Configure workflows based on the selected pattern (sequential, parallel, branch, auto)
  - Coordinate agent execution
  - Handle data flow between agents
  - Consolidate final results

## System Prompt Best Practices

Example of writing a system prompt using `supervisor_mode`:

```yaml
system_prompt: |
  You are a project supervisor managing a team of specialist consultants.
  Determine the workflow pattern based on supervisor_mode.

  supervisor_mode:
    - sequential: When tasks need to be performed in a specific order
    - parallel: When diverse perspectives are needed
    - branch: When only one specialist needs to be selected based on conditions
    - auto: AI makes the judgment and selects the optimal pattern

  Available specialists:
    - legal_expert: Contract analysis, compliance, legal risks
    - tech_expert: Technical feasibility, architecture, implementation
    - business_analyst: Strategy, market analysis, business impact

  Always explain the supervisor_mode and workflow selection, and provide comprehensive results.
```

## Common Use Cases

Representative use cases for each `supervisor_mode` are as follows:

#### Product Development Analysis
```
User: "Please evaluate the feasibility of launching a new AI-based feature"
Supervisor: supervisor_mode: parallel → Legal (compliance), Technical (implementation), Business (market) analysis simultaneously
```

#### Contract Review Process
```
User: "Please review this partnership contract"
Supervisor: supervisor_mode: sequential → Legal (terms) → Business (strategic impact) → Technical (integration) analysis in sequence
```

#### Strategic Decision Making
```
User: "Should we migrate to cloud infrastructure?"
Supervisor: supervisor_mode: parallel → All specialists analyze simultaneously → Consolidation
```

#### Cases requiring only a specific specialist (branch)
```
User: "What are the technical considerations for this feature?"
Supervisor: supervisor_mode: branch → Execute only tech_expert
```

## Supervisor Testing

You can write test workflows for each `supervisor_mode` as follows:

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
        You are a test supervisor. Generate workflows based on supervisor_mode.
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

* supervisor_mode: parallel → "Analyze the pros and cons of remote work"
* supervisor_mode: sequential → "Create a step-by-step plan for project launch"
* supervisor_mode: branch → "What are the technical considerations for this feature?"
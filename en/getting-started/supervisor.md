# Supervisor

## Supervisor

A supervisor is a specialized agent that coordinates and manages multiple agents to handle complex tasks. It analyzes user requests, selects appropriate agents, and generates dynamic workflows to solve multifaceted problems.

### What is a Supervisor?

A supervisor can:

* **Analyze complex requests** and break them down into manageable tasks
* **Select appropriate agents** for assignment from the management team
* **Generate dynamic workflows** based on request types
* **Coordinate execution** among multiple specialist agents
* **Consolidate results** from various agents to provide a consistent response

### supervisor_mode Spec

The supervisor type has an added `supervisor_mode` attribute that explicitly specifies workflow execution patterns.

#### supervisor_mode Attributes

* `sequential`: Execute agents sequentially
* `parallel`: Execute agents in parallel and then consolidate results
* `branch`: Selectively execute certain agent(s) based on conditions (mutually exclusive)
* `auto`: AI automatically selects the optimal mode based on request analysis (default)

#### Example: Simple Supervisor

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4.1"
      supervisor_mode: "parallel"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a project supervisor coordinating work with specialist agents.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

#### Managed Agents

Define specialist agents that the supervisor can coordinate:

```yaml
agents:
  # Supervisor
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4.1"
      supervisor_mode: "branch"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a supervisor managing specialist consultants.
        Generate appropriate workflows based on requests and supervisor_mode.
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

### Workflow Patterns and supervisor_mode

The workflow pattern is determined by the supervisor_mode:

#### sequential (Sequential)
Tasks are executed in order:
```
Request → Legal Review → Technical Evaluation → Business Analysis → Result
```

#### parallel (Parallel)
Multiple specialists analyze simultaneously:
```
Request → [Legal Expert, Technical Expert, Business Analyst] → Consolidation → Result
```

#### branch (Branch)
Selectively execute one specialist based on the request:
```
Request → Analysis → Branch to appropriate specialist → Result
```

#### auto (Auto)
AI analyzes the request and automatically selects the optimal pattern:
```
Request → Analysis → (One of sequential/parallel/branch) → Result
```

### Complete Workflow Example (supervisor_mode Applied)

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Multi-Specialist Analysis"
  description: "Supervisor coordinating specialist analysis"

agents:
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4.1"
      supervisor_mode: "auto"  # Choose from sequential, parallel, branch, auto
      system_prompt: |
        You are a supervisor coordinating specialist analysis.
        Determine the workflow pattern based on supervisor_mode.
      agents: ["legal_expert", "tech_expert", "business_analyst"]

  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a legal expert. Focus on:
        - Compliance
        - Contract terms and risks
        - Legal implications

  - id: "tech_expert"
    inline:
      type: "agent"
      model: "anthropic/claude-sonnet-4"
      system_prompt: |
        You are a technical expert. Focus on:
        - Feasibility
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

### Built-in Supervisor Tools

Supervisors automatically have access to specialized tools. The behavior of these tools also changes based on supervisor_mode.

#### workflow_template_selector
Analyzes user requests and selects appropriate workflow patterns when supervisor_mode is auto.
* Determines which pattern is needed (sequential, parallel, branch)
* Selects agents that need to participate
* Provides reasoning for the decision

#### dynamic_workflow_executor
Dynamically generates and executes workflows based on supervisor_mode.
* Configures workflow based on selected pattern (sequential, parallel, branch, auto)
* Coordinates agent execution
* Handles data flow between agents
* Consolidates final results

### System Prompt Best Practices (Reflecting supervisor_mode)

#### Mandatory Instructions
1. **Tool Usage Requirement**: Always require the supervisor to use tools
2. **Clear Process**: Define workflow generation process based on supervisor_mode
3. **Agent Awareness**: List of available agents and their capabilities
4. **Pattern Guidance**: Explanation of workflow patterns based on supervisor_mode

#### Example: Comprehensive System Prompt
```yaml
system_prompt: |
  You are a project supervisor managing a team of specialist consultants.
  Determine the workflow pattern based on supervisor_mode.

  supervisor_mode:
    - sequential: When tasks need to be performed in a specific order
    - parallel: When diverse perspectives are needed
    - branch: When only one specialist should be selected based on conditions
    - auto: Let AI judge and select the optimal pattern

  Available specialists:
    - legal_expert: Contract analysis, compliance, legal risks
    - tech_expert: Technical feasibility, architecture, implementation
    - business_analyst: Strategy, market analysis, business impact

  Always explain your supervisor_mode and workflow selection, and provide comprehensive results.
```

### Common Use Cases (supervisor_mode Examples)

#### Product Development Analysis
```
User: "Evaluate the feasibility of launching a new AI-based feature"
Supervisor: supervisor_mode: parallel → Legal (compliance), Tech (implementation), Business (market) analyze simultaneously
```

#### Contract Review Process
```
User: "Review this partnership contract"
Supervisor: supervisor_mode: sequential → Legal (terms) → Business (strategic impact) → Tech (integration) analyze in sequence
```

#### Strategic Decision Making
```
User: "Should we migrate to cloud infrastructure?"
Supervisor: supervisor_mode: parallel → All specialists analyze simultaneously → Consolidate
```

#### Cases Requiring Only One Specialist (branch)
```
User: "What are the technical considerations for this feature?"
Supervisor: supervisor_mode: branch → Only tech_expert executes
```

### Supervisor Testing (supervisor_mode Applied)

#### Simple Test
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
# Supervisor

## Supervisor

A supervisor is a specialized agent that coordinates and manages multiple agents to handle complex tasks. It analyzes user requests, selects appropriate agents, and creates dynamic workflows to solve multifaceted problems.

### What is a Supervisor?

A supervisor is an agent that can:

* **Analyze complex requests** and break them down into manageable tasks
* **Select appropriate agents** for assignment from the management team
* **Create dynamic workflows** based on request types
* **Coordinate execution** among multiple specialist agents
* **Consolidate results** from various agents to provide a consistent response

### Basic Supervisor Configuration

#### Simple Supervisor

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        You are a project supervisor coordinating work with specialist agents.

        Important: Always use tools for workflow management:
        1. Use 'workflow_template_selector' for request analysis
        2. Use 'dynamic_workflow_executor' for workflow creation and execution

        Available agents: legal_expert, tech_expert, business_analyst
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
      model: "openai/gpt-4"
      system_prompt: |
        You are a supervisor managing specialist consultants.
        Use tools to create appropriate workflows based on requests.
      agents: ["legal_expert", "tech_expert", "business_analyst"]

  # Managed agents
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a legal expert specializing in contract analysis,
        compliance, and legal risk assessment.

  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a technical expert specializing in software architecture,
        technical assessments, and implementation plans.

  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a business analyst specializing in strategic planning,
        market analysis, and ROI assessment.
```

### Workflow Patterns

Supervisors can create various workflow patterns based on requests:

#### Sequential Pattern

Tasks are executed in order:

```
Request → Legal Review → Technical Assessment → Business Analysis → Result
```

#### Parallel Review Pattern

Multiple specialists analyze simultaneously:

```
Request → [Legal Expert, Technical Expert, Business Analyst] → Consolidation → Result
```

#### Conditional Pattern

Dynamic routing based on request type:

```
Request → Analysis → Routing to appropriate specialist(s) → Result
```

### Complete Workflow Example

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
      model: "openai/gpt-4"
      system_prompt: |
        You are a supervisor coordinating specialist analysis.

        Workflow patterns:
        - Sequential: Step-by-step process (Legal → Technical → Business)
        - Parallel Review: Comprehensive multi-angle analysis
        - Single Specialist: Domain-specific questions

        Important: Always use tools:
        1. 'workflow_template_selector' - Analyze request and select pattern
        2. 'dynamic_workflow_executor' - Create and execute workflow

        Team members: legal_expert, tech_expert, business_analyst
      agents: ["legal_expert", "tech_expert", "business_analyst"]

  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a legal expert. Focus on:
        - Compliance
        - Contract terms and risks
        - Legal implications

  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a technical expert. Focus on:
        - Feasibility
        - Technical architecture
        - Performance considerations

  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
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

Supervisors automatically have access to specialized tools:

#### workflow_template_selector

Analyzes user requests and selects appropriate workflow patterns:

* Determines if sequential, parallel, or conditional pattern is needed
* Selects agents that should participate
* Provides rationale for decisions

#### dynamic_workflow_executor

Dynamically creates and executes workflows:

* Configures workflow based on selected template
* Coordinates agent execution
* Handles data flow between agents
* Consolidates final results

### System Prompt Best Practices

#### Mandatory Instructions

1. **Tool Usage Requirement**: Require supervisor to always use tools
2. **Clear Process**: Define step-by-step workflow creation process
3. **Agent Awareness**: List of available agents and their capabilities
4. **Pattern Guidance**: Explain when to use different workflow patterns

#### Example: Comprehensive System Prompt

```yaml
system_prompt: |
  You are a project supervisor managing a team of specialist consultants.

  Mandatory process:
  1. Always first use 'workflow_template_selector' to analyze request
  2. Always use 'dynamic_workflow_executor' to create and execute workflow
  3. Prohibit providing manual responses without tool usage

  Available specialists:
  - legal_expert: Contract analysis, compliance, legal risks
  - tech_expert: Technical feasibility, architecture, implementation
  - business_analyst: Strategy, market analysis, business impact

  Workflow patterns:
  - Sequential: When tasks need to be performed in specific order
  - Parallel Review: When multiple perspectives are needed
  - Single Specialist: For domain-specific questions
  - Parallel Review: When comprehensive multi-angle analysis is needed
  - Sequential: For implementation plans (Legal → Technical → Business)
  - Single Specialist: When specific expertise is needed
  - Parallel Review: For comprehensive multi-angle analysis

  Always explain workflow selection and provide comprehensive results.
```

### Common Use Cases

#### Product Development Analysis

```
User: "Evaluate the feasibility of launching a new AI-based feature"
Supervisor: Parallel Review → Legal (compliance), Technical (implementation), Business (market)
```

#### Contract Review Process

```
User: "Review this partnership contract"
Supervisor: Sequential → Legal (terms) → Business (strategic impact) → Technical (integration)
```

#### Strategic Decision Making

```
User: "Should we migrate to cloud infrastructure?"
Supervisor: Parallel Review → All specialists analyze simultaneously → Consolidation
```

### Supervisor Testing

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
      model: "openai/gpt-4"
      system_prompt: |
        You are a test supervisor. Use tools to analyze the request
        and create an appropriate workflow with your team.
      agents: ["expert_a", "expert_b"]

  - id: "expert_a"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: "You are Expert A. Provide perspective A on all topics."

  - id: "expert_b"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: "You are Expert B. Provide perspective B on all topics."

nodes:
  start:
    type: "agent_task"
    agent: "test_supervisor"
    next: "end"

  end:
    type: "end"
```

Test with requests like:

* "Analyze the pros and cons of remote work" (Parallel Review)
* "Create a step-by-step plan for project launch" (Sequential)
* "What are the technical considerations for this feature?" (Single Specialist)
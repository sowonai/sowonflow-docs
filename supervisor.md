# Supervisor

## Supervisors

Supervisors are specialized agents that orchestrate and coordinate multiple agents to handle complex tasks. They analyze user requests, select appropriate agents, and create dynamic workflows to solve multi-faceted problems.

### What is a Supervisor?

A supervisor is an agent that can:

* **Analyze complex requests** and break them into manageable tasks
* **Select appropriate agents** from their managed team
* **Create dynamic workflows** based on the request type
* **Coordinate execution** across multiple specialized agents
* **Synthesize results** from different agents into coherent responses

### Basic Supervisor Configuration

#### Simple Supervisor

```yaml
agents:
  - id: "project_supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        You are a project supervisor responsible for orchestrating 
        tasks with specialized agents.
        
        CRITICAL: Always use your tools for workflow management:
        1. Use 'workflow_template_selector' to analyze requests
        2. Use 'dynamic_workflow_executor' to create and run workflows
        
        Available agents: legal_expert, tech_expert, business_analyst
      agents: ["legal_expert", "tech_expert", "business_analyst"]
```

#### Managed Agents

Define the specialized agents that the supervisor can coordinate:

```yaml
agents:
  # Supervisor
  - id: "supervisor"
    inline:
      type: "supervisor"
      model: "openai/gpt-4"
      system_prompt: |
        You are a supervisor managing expert consultants.
        Use your tools to create appropriate workflows based on requests.
      agents: ["legal_expert", "tech_expert", "business_analyst"]
  
  # Managed agents
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a legal expert specializing in contract analysis,
        regulatory compliance, and legal risk assessment.
        
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a technical expert specializing in software
        architecture, technology assessment, and implementation planning.
        
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a business analyst specializing in strategic
        planning, market analysis, and ROI assessment.
```

### Workflow Patterns

Supervisors can create different workflow patterns based on the request:

#### Sequential Pattern

Tasks executed one after another:

```
Request → Legal Review → Technical Assessment → Business Analysis → Result
```

#### Parallel Review Pattern

Multiple experts analyze simultaneously:

```
Request → [Legal Expert, Tech Expert, Business Analyst] → Synthesis → Result
```

#### Conditional Pattern

Dynamic routing based on request type:

```
Request → Analysis → Route to Appropriate Expert(s) → Result
```

### Complete Workflow Example

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
      model: "openai/gpt-4"
      system_prompt: |
        You are a supervisor responsible for coordinating expert analysis.
        
        WORKFLOW PATTERNS:
        - Sequential: For step-by-step processes (legal → tech → business)
        - Parallel Review: For comprehensive multi-perspective analysis
        - Single Expert: For domain-specific questions
        
        CRITICAL: Always use your tools:
        1. 'workflow_template_selector' - analyze request and select pattern
        2. 'dynamic_workflow_executor' - create and execute workflow
        
        Your team: legal_expert, tech_expert, business_analyst
      agents: ["legal_expert", "tech_expert", "business_analyst"]
        
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a legal expert. Focus on:
        - Regulatory compliance
        - Contract terms and risks
        - Legal implications
        
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a technical expert. Focus on:
        - Implementation feasibility
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

#### workflow\_template\_selector

Analyzes user requests and selects appropriate workflow patterns:

* Determines if sequential, parallel, or conditional pattern is needed
* Selects which agents should be involved
* Provides reasoning for the decision

#### dynamic\_workflow\_executor

Creates and executes workflows dynamically:

* Builds workflow based on selected template
* Coordinates agent execution
* Handles data flow between agents
* Synthesizes final results

### System Prompt Best Practices

#### Essential Instructions

1. **Tool Usage Mandate**: Always require supervisors to use their tools
2. **Clear Process**: Define step-by-step workflow creation process
3. **Agent Awareness**: List available agents and their capabilities
4. **Pattern Guidance**: Explain when to use different workflow patterns

#### Example: Comprehensive System Prompt

```yaml
system_prompt: |
  You are a project supervisor managing a team of expert consultants.
  
  MANDATORY PROCESS:
  1. ALWAYS use 'workflow_template_selector' first to analyze the request
  2. ALWAYS use 'dynamic_workflow_executor' to create and run workflows
  3. NEVER provide manual responses without using tools
  
  AVAILABLE EXPERTS:
  - legal_expert: Contract analysis, compliance, legal risks
  - tech_expert: Technical feasibility, architecture, implementation
  - business_analyst: Strategy, market analysis, business impact
  
  WORKFLOW PATTERNS:
  - Sequential: Use when tasks must be done in specific order
  - Parallel Review: Use when multiple perspectives are needed
  - Single Expert: Use for domain-specific questions
  
  DECISION GUIDELINES:
  - Complex projects → Parallel review with synthesis
  - Implementation planning → Sequential (legal → tech → business)
  - Specific expertise needed → Single expert
  - Multi-faceted analysis → Parallel review
  
  Always explain your workflow choice and provide comprehensive results.
```

### Common Use Cases

#### Product Development Analysis

```
User: "Evaluate feasibility of launching a new AI-powered feature"
Supervisor: Parallel review → Legal (compliance), Tech (implementation), Business (market)
```

#### Contract Review Process

```
User: "Review this partnership agreement"
Supervisor: Sequential → Legal (terms) → Business (strategic impact) → Tech (integration)
```

#### Strategic Decision Making

```
User: "Should we migrate to cloud infrastructure?"
Supervisor: Parallel review → All experts analyze simultaneously → Synthesis
```

### Testing Your Supervisor

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
        You are a test supervisor. Use your tools to analyze
        requests and create appropriate workflows with your team.
      agents: ["expert_a", "expert_b"]
        
  - id: "expert_a"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: "You are Expert A. Provide perspective A on any topic."
        
  - id: "expert_b"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: "You are Expert B. Provide perspective B on any topic."

nodes:
  start:
    type: "agent_task"
    agent: "test_supervisor"
    next: "end"
  
  end:
    type: "end"
```

Test with requests like:

* "Analyze the pros and cons of remote work" (parallel review)
* "Create a step-by-step plan for project launch" (sequential)
* "What are the technical considerations for this feature?" (single expert)

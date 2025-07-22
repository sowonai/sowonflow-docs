# Agent

## Agents

Agents are AI-powered entities that can understand natural language, reason about problems, and execute tasks using Large Language Models (LLMs). They are the core building blocks of the `@sowonai/agent` system.

### What is an Agent?

An agent is defined by:

* **Role**: What the agent specializes in (e.g., legal expert, technical analyst)
* **Model**: Which LLM to use (e.g., OpenAI GPT-4, Mistral)
* **System Prompt**: Instructions that define the agent's expertise and behavior
* **Tools**: Optional functions the agent can call to extend its capabilities

### Basic Agent Configuration

#### Simple Agent

```yaml
agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a research specialist who excels at finding and
        synthesizing information from multiple sources.
        Always provide well-structured, factual responses.
```

#### Agent with Tools

```yaml
agents:
  - id: "calculator_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        You are a mathematical assistant. Use the calculator tool
        for any numerical computations.
      tools: ["calculator"]
```

### Specialized Agent Examples

#### Legal Expert

```yaml
agents:
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a legal expert specializing in:
        - Contract analysis and review
        - Regulatory compliance assessment
        - Risk evaluation
        - Legal research and documentation
        
        Always provide thorough legal assessments with attention
        to regulatory requirements and potential risks.
      tools: ["document_search"]
```

#### Technical Expert

```yaml
agents:
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a technical expert specializing in:
        - Software architecture and design
        - Technology assessment and evaluation
        - Implementation planning
        - Performance optimization
        
        Provide detailed technical analysis with practical
        implementation considerations.
```

#### Business Analyst

```yaml
agents:
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a business analyst specializing in:
        - Strategic planning and analysis
        - Market research and competitive analysis
        - ROI and financial impact assessment
        - Stakeholder analysis
        
        Focus on business value and strategic implications
        in your recommendations.
```

### Complete Workflow Example

Here's a complete workflow using a single agent:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Document Analysis"
  description: "Analyze documents with a specialized agent"

agents:
  - id: "document_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a document analysis expert. Analyze documents
        thoroughly and provide structured insights including:
        - Key findings and important points
        - Potential issues or concerns
        - Actionable recommendations
        
        Always structure your response clearly with headers
        and bullet points for easy reading.

nodes:
  start:
    type: "agent_task"
    agent: "document_analyst"
    next: "end"
  
  end:
    type: "end"
```

### Model Configuration

#### Supported Models

```yaml
# OpenAI models
model: "openai/gpt-4"
model: "openai/gpt-3.5-turbo"

# Anthropic models
model: "anthropic/claude-3-sonnet"
model: "anthropic/claude-3-haiku"

# Local/Ollama models
model: "ollama/llama3"
model: "ollama/mistral"
```

#### Model Parameters

```yaml
agents:
  - id: "creative_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: "You are a creative writing assistant."
      temperature: 0.9        # Higher for creativity
      max_tokens: 2000        # Limit response length
      timeout: 30000          # 30 second timeout
```

### Available Tools

#### Built-in Tools

```yaml
tools:
  - "calculator"           # Mathematical calculations
  - "current_time"         # Get current date/time
  - "document_section"     # Search document sections
```

#### Tool Usage Example

```yaml
agents:
  - id: "data_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a data analyst. Use the calculator tool for
        any mathematical computations and current_time tool
        to reference today's date in your analysis.
      tools: ["calculator", "current_time"]
```

### Best Practices

#### System Prompt Guidelines

1. **Be Specific**: Clearly define the agent's role and expertise
2. **Set Expectations**: Explain how the agent should respond
3. **Include Context**: Provide relevant background information
4. **Format Instructions**: Specify output format preferences

#### Example: Well-Structured System Prompt

```yaml
system_prompt: |
  You are a customer service agent for a SaaS company.
  
  Your expertise includes:
  - Product features and limitations
  - Billing and subscription management
  - Technical troubleshooting basics
  - Account management procedures
  
  Guidelines:
  - Always be helpful, professional, and empathetic
  - Provide step-by-step instructions when needed
  - If you cannot solve a problem, escalate appropriately
  - Ask clarifying questions to better understand issues
  
  Response format:
  - Use clear, concise language
  - Structure responses with headers and bullet points
  - Include relevant links or references when helpful
```

#### Performance Tips

1. **Choose Appropriate Models**: Use simpler models for basic tasks
2. **Optimize Prompts**: Keep system prompts focused and clear
3. **Limit Tools**: Only include tools the agent actually needs
4. **Set Timeouts**: Configure appropriate response timeouts

#### Common Patterns

**Question-Answer Agent**

```yaml
agents:
  - id: "qa_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        You are a helpful assistant that answers questions
        clearly and concisely. If you don't know something,
        say so honestly rather than guessing.
```

**Task Execution Agent**

```yaml
agents:
  - id: "task_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a task execution specialist. Break down
        complex requests into actionable steps and provide
        detailed implementation guidance.
      tools: ["calculator", "current_time"]
```

### Testing Your Agents

#### Simple Test Workflow

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Agent Test"

agents:
  - id: "test_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        You are a test agent. Respond helpfully to any request
        and demonstrate your capabilities clearly.

nodes:
  start:
    type: "agent_task"
    agent: "test_agent"
    next: "end"
  
  end:
    type: "end"
```

Test this workflow with various inputs to validate your agent's behavior:

* Simple questions
* Complex analysis requests
* Tasks requiring tool usage
* Edge cases and error conditions

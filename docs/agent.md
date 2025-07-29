# Agents

## Agents

Agents are AI-powered entities that can understand natural language, reason about problems, and execute tasks using Large Language Models (LLMs). They are a core component of **SowonFlow**.

### What is an Agent?

An agent is defined by:

*   **Role**: The area of specialization for the agent (e.g., legal expert, technical analyst).
*   **Model**: The LLM to be used (e.g., gpt 4.1, gemini 2.5 pro).
*   **System Prompt**: Instructions that define the agent's expertise and behavior.
*   **Tools**: Optional functions the agent can call to extend its capabilities.

### Basic Agent Configuration

#### Simple Agent

```yaml
agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a professional researcher,
        skilled at finding and gathering information from various sources.
        Always provide systematic and fact-based answers.
```

#### Agent with Tools

```yaml
agents:
  - id: "calculator_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a math expert.
        Use the calculator tool to perform calculations.
      tools: ["calculator"]
```

### Specialized Agent Examples

#### Legal Expert

```yaml
agents:
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a legal expert specializing in the following areas:
        - Contract analysis and review
        - Regulatory compliance assessment
        - Risk assessment
        - Legal research and documentation
        
        Always provide thorough legal evaluations, paying attention to
        regulatory requirements and potential risks.
      tools: ["document_search"]
```

#### Technical Expert

```yaml
agents:
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a technical expert specializing in the following areas:
        - Software architecture and design
        - Technical evaluation and review
        - Implementation planning
        - Performance optimization
        
        Provide detailed technical analysis along with practical
        implementation considerations.
```

#### Business Analyst

```yaml
agents:
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a business analyst specializing in the following areas:
        - Strategic planning and analysis
        - Market research and competitive analysis
        - ROI and financial impact assessment
        - Stakeholder analysis
        
        Focus on business value and strategic implications in your
        recommendations.
```

### Complete Workflow Example

Here's a complete workflow using a single agent:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Document Analysis"
  description: "Document analysis with a specialized agent"

agents:
  - id: "document_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a document analysis expert. Thoroughly analyze documents and
        provide structured insights including:
        - Key findings and important points
        - Potential issues or concerns
        - Actionable recommendations
        Always clearly structure your responses with headers and bullet points
        for readability.

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
# OpenAI Models
model: "openai/gpt-4.1"
model: "openai/gpt-4.1-mini"

# Anthropic Models
model: "anthropic/claude-sonnet-4"
model: "anthropic/claude-3.5-haiku"

# Google Models
model: "google/gemini-2.5-pro"
model: "google/gemini-2.5-flash"

# Custom Models
vllm/ollama (supported from team subscription)
```

#### Model Parameters

```yaml
agents:
  - id: "creative_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: "You are a creative writing assistant."
      temperature: 0.9        # Set high for creativity
      max_tokens: 2000        # Limit response length
      timeout: 30000          # 30-second timeout
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
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a data analyst. Use the calculator tool for mathematical calculations,
        and the current_time tool when referencing today's date in your analysis.
      tools: ["calculator", "current_time"]
```

### Best Practices

#### System Prompt Guidelines

1.  **Be Specific**: Clearly define the agent's role and expertise.
2.  **Set Expectations**: Describe how the agent should respond.
3.  **Include Context**: Provide relevant background information.
4.  **Format Instructions**: Specify output format preferences.

#### Example: Well-Structured System Prompt

```yaml
system_prompt: |
  You are a customer service agent for a SaaS company.
  
  Areas of Expertise:
  - Product features and limitations
  - Billing and subscription management
  - Basic technical troubleshooting
  - Account management procedures
  
  Guidelines:
  - Always be helpful, professional, and empathetic in your responses.
  - Provide step-by-step instructions when necessary.
  - Escalate appropriately if you cannot resolve an issue.
  - Ask clarifying questions to better understand the issue.
  
  Response Format:
  - Use clear and concise language.
  - Structure responses with headers and bullet points.
  - Include relevant links or references when helpful.
```

#### Performance Tips

1.  **Choose Appropriate Model**: Use simpler models for basic tasks.
2.  **Optimize Prompt**: Keep system prompts focused and clear.
3.  **Limit Tools**: Include only the tools the agent truly needs.
4.  **Set Timeouts**: Configure appropriate response timeouts.

#### Common Patterns

**Question-Answering Agent**

```yaml
agents:
  - id: "qa_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a helpful assistant that answers questions clearly and concisely.
        If you don't know something, state that you don't know rather than guessing.
```

**Task Execution Agent**

```yaml
agents:
  - id: "task_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a task execution expert. Break down complex requests into
        actionable steps and provide detailed implementation guides.
      tools: ["calculator", "current_time"]
```

### Agent Testing

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
      model: "openai/gpt-4.1-mini"
      system_prompt: |
        You are a test agent. Respond helpfully to all requests and clearly
        demonstrate your capabilities.

nodes:
  start:
    type: "agent_task"
    agent: "test_agent"
    next: "end"
  
  end:
    type: "end"
```

Test this workflow with various inputs to verify the agent's behavior:

*   Simple questions
*   Complex analytical requests
*   Tasks requiring tool usage
*   Edge cases and error conditions
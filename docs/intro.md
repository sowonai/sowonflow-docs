# Introduction

## SowonFlow - The Missing Link in AI Transformation

### What is SowonFlow?

SowonFlow is an innovative YAML-based AI workflow engine that bridges the gap between business requirements and AI implementation. We solve a critical **missing link** in enterprise AI adoption – the disconnect between business teams who understand the problem and technical teams who implement the solution.

### Problems We Solve

Enterprise AI adoption faces significant bottlenecks:

*   **Business teams** know the workflows but cannot implement AI solutions.
*   **Technical teams** can build AI systems but lack deep domain knowledge.
*   **Existing solutions** require extensive coding or expensive experts.
*   **Complex workflows** take months to develop and maintain.

Most companies struggle with AI transformation despite having clear use cases and budgets.

### Our Solution: YAML-based AI Workflows

SowonFlow translates complex AI orchestration into human-readable YAML configurations. Workflows defined by business analysts can be immediately implemented and maintained by developers.

**Core Package**: `@sowonai/sowonflow` - The main SowonFlow runtime library for creating and executing AI workflows.

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Email Agent"
  description: "An agent that can perform mail-related functions using the gmail mcp server."

agents:
  - id: "email_agent"
    inline:
      type: "agent"
      model: "google/gemini-2.5-flash"
      system_prompt: "You are an email agent."
      mcp: ["gmail"]

nodes:
  start:
    type: "agent_task"
    agent: "email_agent"
    next: "end"
  end:
    type: "end"
```

## Quick Start

### Installation

```bash
npm install @sowonai/sowonflow
```

### Basic Configuration

Before using SowonFlow, you need to configure access to AI models:

```javascript
import { Workflow, createConfig } from '@sowonai/sowonflow';

// Create configuration
const config = createConfig({
  apiKey: 'your-api-key',
  spaceId: 'your-space-id'
});
```

### Basic Usage

```javascript
import { Workflow } from '@sowonai/sowonflow';

// Define YAML workflow
const yamlContent = `
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Simple Example"
  description: "Example of basic usage"

agents:
  - id: "assistant"
    inline:
      type: "agent"
      model: "openai/gpt-4.1-mini"
      system_prompt: "You are a helpful AI assistant."

nodes:
  start:
    type: "agent_task"
    agent: "assistant"
    next: "end"
  end:
    type: "end"
`;

// Execute workflow
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  config: config
});

const result = await workflow.ask("Enter your question here");
console.log(result.content);
```

### Using Environment Variables

For production environments, it is recommended to use environment variables:

```javascript
const config = createConfig({
  apiKey: 'your-api-key',
  spaceId: 'your-space-id'
});
```
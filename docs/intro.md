# Introduction

## SowonFlow - The Missing Link in AI Transformation

### What is SowonFlow?

SowonFlow is an innovative YAML-based AI workflow engine that bridges the gap between business requirements and AI implementation. We address the critical **missing link** in enterprise AI adoption - the disconnect between business teams that understand the problems and technical teams that implement the solutions.

### The Problems We Solve

Enterprise AI adoption faces significant bottlenecks:

* **Business teams** know the workflows but can't implement AI solutions
* **Technical teams** can build AI systems but lack deep domain knowledge
* **Existing solutions** require extensive coding or expensive specialists
* **Complex workflows** take months to develop and maintain

Most companies struggle with AI transformation despite having clear use cases and budgets.

### Our Solution: YAML-based AI Workflows

SowonFlow transforms complex AI orchestration into human-readable YAML configurations. Business analysts can define workflows that developers can immediately implement and maintain.

**Core Package**: `sowonflow` - The main SowonFlow runtime library for creating and executing AI workflows.

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Email Agent"
  description: "Agent that can perform email-related functions using gmail mcp server."

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
npm install sowonflow
```

### Basic Usage

```javascript
import { Workflow } from 'sowonflow';

const workflow = new Workflow({
  mainWorkflow: yamlContent
});

const result = await workflow.ask("Your question here");
```
# Introduction

> 🌏 **Language**: English | [한국어로 보기](../ko/README.md)

## SowonFlow - The Missing Link in AI Transformation

### What is SowonFlow?

SowonFlow is a revolutionary YAML-based AI workflow engine that bridges the gap between business requirements and AI implementation. We solve the critical "missing link" in enterprise AI adoption - the disconnect between business teams who understand the problems and technical teams who implement the solutions.

### The Problem We Solve

Enterprise AI adoption faces a critical bottleneck:

* **Business teams** know their workflows but can't implement AI solutions
* **Technical teams** can build AI systems but lack deep domain knowledge
* **Existing solutions** require extensive coding or expensive specialists
* **Complex workflows** take months to develop and maintain

Result? Most companies struggle with AI transformation, despite having clear use cases and budgets.

### Our Solution: YAML-Powered AI Workflows

SowonFlow transforms complex AI orchestration into human-readable YAML configurations. Business analysts can define workflows that developers can immediately implement and maintain.

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "Email Assistant"
  description: "Automated email processing and response"

agents:
  - id: "email_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4o-mini"
      system_prompt: "You are an email assistant..."
      mcp: ["gmail"]

nodes:
  start:
    type: "agent_task"
    agent: "email_agent"
    next: "end"
  end:
    type: "end"
```

# Introduction

## SowonFlow -Missing Link of AI transformation

### What is SowonFlow?

SowonFlow is an innovative YAML -based AI workflow engine that breaks down the gap between business requirements and AI implementation. We solve the important "missing link ", which is an introduction of corporate AI -disconnection between business teams that understand the problem and technology teams that implement solutions.

This is a translation test sentence.
This is the eighth test. Did the translation quality improve?

### The problem we solve

Corporate AI adoption is faced with important bottlenecks:

* **Business Team** knows a workflow but cannot implement AI solutions.
* **Technology team** can build an AI system, but lacks deep domain knowledge.
* **Existing solution** requires a wide range of coding or expensive experts.
* **Complex workflow** takes a few months to develop and maintain

result? Most companies are having difficulty in AI transformation despite the clear use and budget.

### Our solution: YAML -based AI Workflow

SowonFlow converts complex AI orchestrations into a YAML configuration that a person can read. Developers can immediately implement and maintain workflows defined by business analysts.

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "이메일 어시스턴트"
  description: "자동화된 이메일 처리 및 응답"

agents:
  - id: "email_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4o-mini"
      system_prompt: "당신은 이메일 어시스턴트입니다..."
      mcp: ["gmail"]

nodes:
  start:
    type: "agent_task"
    agent: "email_agent"
    next: "end"
  end:
    type: "end"
```

# Introduction

## SowonFlow -Missing Link of AI Transformation

### What is SowonFlow?

SowonFlow is an innovative YAML -based AI workflow engine that breaks down the gap between business requirements and AI implementation. We solve the important ** missing link **, which is important in the introduction of corporate AI -breaks between business teams that understand the problem and technology teams implementing solutions.

### The problem we solve

Corporate AI adoption is faced with important bottlenecks:

* **Business Team** knows a workflow but cannot implement AI solutions.
* **Technology team** can build an AI system, but lacks deep domain knowledge.
* **Existing solution** requires a wide range of coding or expensive experts.
* **Complex workflow** takes a few months to develop and maintain

Most companies are having difficulty in AI transformation despite the clear use and budget.

### Our solution: YAML -based AI Workflow

SowonFlow converts complex AI orchestrations into a YAML configuration that a person can read. Developers can immediately implement and maintain workflows defined by business analysts.

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "email agent"
  description: "Automated email processing and response"

agents:
  - id: "email_agent"
    inline:
      type: "agent"
      model: "google/gemini-2.5-flash"
      system_prompt: "You are email assistance..."
      mcp: ["gmail"]

nodes:
  start:
    type: "agent_task"
    agent: "email_agent"
    next: "end"
  end:
    type: "end"
```

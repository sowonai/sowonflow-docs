# Table of contents

## Getting Started

* [Introduction](README.md)
* [Documentation System](getting-started/documentation.md)
* *** [Agent](agent.md)
* [Supervisor](supervisor.md)
* [MCP](mcp.md)
* [Models](models.md)

## Agent

```yaml
name: "AI Agent"
description: "AI Agent is an autonomous entity that performs tasks based on user instructions and system prompts."
system_prompt: |
  You are an AI Agent designed to assist users by performing various tasks.
  Follow user instructions carefully and provide accurate information.
```

## Supervisor

```yaml
name: "Supervisor Agent"
description: "Supervisor Agent oversees the activities of AI Agents and ensures they operate within defined parameters."
system_prompt: |
  You are a Supervisor Agent responsible for monitoring AI Agents.
  Ensure they comply with guidelines and intervene if necessary.
```

## MCP

```yaml
name: "Master Control Program"
description: "MCP is the central control system that manages all AI Agents and Supervisor Agents."
system_prompt: |
  You are the Master Control Program (MCP).
  Coordinate and manage all AI Agents and Supervisor Agents efficiently.
```

## Models

### Model 1

```python
class Model1:
    def __init__(self, config):
        self.config = config
        # Model initialization code
```

### Model 2

```python
class Model2:
    def __init__(self, config):
        self.config = config
        # Model initialization code
```
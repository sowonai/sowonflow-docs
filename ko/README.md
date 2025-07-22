# 소개

## SowonFlow - AI 변혁의 미싱링크

### SowonFlow란 무엇인가요?

SowonFlow는 비즈니스 요구사항과 AI 구현 사이의 격차를 해소하는 혁신적인 YAML 기반 AI 워크플로우 엔진입니다. 우리는 기업 AI 도입에서 중요한 **미싱링크**를 해결합니다 - 문제를 이해하는 비즈니스 팀과 솔루션을 구현하는 기술 팀 사이의 단절 말입니다.

### 우리가 해결하는 문제

기업 AI 도입은 중요한 병목 현상에 직면해 있습니다:

* **비즈니스 팀**은 워크플로우를 알지만 AI 솔루션을 구현할 수 없습니다
* **기술 팀**은 AI 시스템을 구축할 수 있지만 깊은 도메인 지식이 부족합니다
* **기존 솔루션**은 광범위한 코딩이나 비용이 많이 드는 전문가가 필요합니다
* **복잡한 워크플로우**는 개발하고 유지하는 데 몇 달이 걸립니다

결과? 대부분의 회사들은 명확한 사용 사례와 예산이 있음에도 불구하고 AI 변혁에 어려움을 겪고 있습니다.

### 우리의 솔루션: YAML 기반 AI 워크플로우

SowonFlow는 복잡한 AI 오케스트레이션을 사람이 읽을 수 있는 YAML 구성으로 변환합니다. 비즈니스 분석가가 정의한 워크플로우를 개발자가 즉시 구현하고 유지할 수 있습니다.

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

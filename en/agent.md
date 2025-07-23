# Agent

## Agent

Agents are AI -based entities that can understand natural language, reasoning of problems, and run tasks using large language models (LLM). These are the core components of ** SowonFlow **.

### What is an agent?

The agent is defined as follows:

* **Role**: A field that agents specialize (e.g., legal expert, technical analyst)
* **Model**: LLM to use (e.g. GPT 4.1, Gemini 2.5 Pro)
* **System Prompt**: Guidelines to define agent's expertise and behavior
* **Tool**: optional functions that agents can be called to expand their functions

### Basic agent configuration

#### Simple agent

```yaml
agents:
  - id: "research_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are an expert researcher, 
        excellent at finding and compiling information from various sources. 
        Always provide well-structured and factual responses.
```

#### 도구를 사용하는 에이전트

```yaml
agents:
  - id: "calculator_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4.1"
      system_prompt: |
        You are a math assistant. 
        Use a calculator tool for all numerical calculations.
      tools: ["calculator"]
```

### Example of specialized agent

#### Law expert

```yaml
agents:
  - id: "legal_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 법률 전문가입니다:
        -Conalization and review of contracts
        -Recision compliance evaluation
        -Riocession evaluation
        -Legal research and documentation
        
        Always pay attention to the requirements and potential risks.
        Provide a thorough legal evaluation.
      tools: ["document_search"]
```

#### 기술 전문가

```yaml
agents:
  - id: "tech_expert"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 기술 전문가입니다:
        - 소프트웨어 아키텍처 및 설계
        - 기술 평가 및 검토
        - 구현 계획
        - 성능 최적화
        
        실용적인 구현 고려사항과 함께 상세한 기술 분석을
        제공하세요.
```

#### Business analyst

```yaml
agents:
  - id: "business_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 다음 분야를 전문으로 하는 비즈니스 분석가입니다:
        -Tragon plan and analysis
        -Market research and competition analysis
        -ROI and financial impact assessment
        -An analysis of stakeholders
        
        In the recommendation, business value and strategic implications
        Focus on.
```

### 완전한 워크플로우 예시

다음은 단일 에이전트를 사용하는 완전한 워크플로우입니다:

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "문서 분석"
  description: "전문 에이전트로 문서 분석"

agents:
  - id: "document_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 문서 분석 전문가입니다. 문서를 철저히 분석하고
        다음을 포함한 구조화된 인사이트를 제공하세요:
        - 주요 발견사항 및 중요한 포인트
        - 잠재적 이슈나 우려사항
        - 실행 가능한 권장사항
        항상 읽기 쉽도록 헤더와 불릿 포인트로
        응답을 명확하게 구조화하세요.

nodes:
  start:
    type: "agent_task"
    agent: "document_analyst"
    next: "end"
  
  end:
    type: "end"
```

### Model configuration

#### Supported model

```yaml
# OpenAI 모델
model: "openai/gpt-4"
model: "openai/gpt-3.5-turbo"

# Anthropic 모델
model: "anthropic/claude-3-sonnet"
model: "anthropic/claude-3-haiku"

# 로컬/Ollama 모델
model: "ollama/llama3"
model: "ollama/mistral"
```

#### 모델 매개변수

```yaml
agents:
  - id: "creative_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: "당신은 창의적 글쓰기 어시스턴트입니다."
      temperature: 0.9        # 창의성을 위해 높게 설정
      max_tokens: 2000        # 응답 길이 제한
      timeout: 30000          # 30초 타임아웃
```

### I can use

#### Built -in tool

```yaml
tools:
  - "Calculator " # Mathematical calculation
  - "Current_Time " #The current date/time brings
  - "Document_section " # Document section search
```

#### 도구 사용 예시

```yaml
agents:
  - id: "data_analyst"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        당신은 데이터 분석가입니다. 수학적 계산에는 계산기 도구를,
        분석에서 오늘 날짜를 참조할 때는 current_time 도구를
        사용하세요.
      tools: ["calculator", "current_time"]
```

### model case

#### System Prompt Guidelines

1. ** Specifically written **: Clearly defines the role and expertise of agents
2. ** Setting expectations **: Describe how the agent should respond
3. ** Including context **: Provides relevant background information
4. ** Type Guidelines **: Output format preference

#### Example: Good structured system prompt

```yaml
system_prompt: |
  You are a customer service agent of SaaS company.
  
  전문 분야:
  -Product function and restrictions
  -Bill and subscription management
  -Solving basic technology problems
  -A account management procedure
  
  가이드라인:
  -Doardly help, professional, and sympathetic
  -If you provide step -by -step guidelines when necessary
  -If you can't solve the problem, properly escalation
  -In order to better understand the issues, ask a clear question
  
  응답 형식:
  -Use clear and concise language
  -Chizards and Bullet points
  -Including related links or references when helping
```

#### 성능 팁

1. **적절한 모델 선택**: Use a simpler model for basic work
2. **프롬프트 최적화**: Maintain system prompt intensively and clearly
3. **도구 제한**: Including only tools that agents actually need
4. **타임아웃 설정**: Proper response timeout configuration

#### 일반적인 패턴

** Question-answer agent **

```yaml
agents:
  - id: "qa_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        당신은 질문에 명확하고 간결하게 답변하는 도움이 되는
        어시스턴트입니다. 모르는 것이 있으면 추측하기보다는
        솔직하게 모른다고 하세요.
```

** Occupation Agent **

```yaml
agents:
  - id: "task_agent"
    inline:
      type: "agent"
      model: "openai/gpt-4"
      system_prompt: |
        You are a work executive. Complex requests
        Divide into an executable stage and give a detailed implementation guide.
        Provide it.
      tools: ["calculator", "current_time"]
```

### 에이전트 테스트

#### 간단한 테스트 워크플로우

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "에이전트 테스트"

agents:
  - id: "test_agent"
    inline:
      type: "agent"
      model: "openai/gpt-3.5-turbo"
      system_prompt: |
        당신은 테스트 에이전트입니다. 모든 요청에 도움이 되도록
        응답하고 당신의 능력을 명확하게 보여주세요.

nodes:
  start:
    type: "agent_task"
    agent: "test_agent"
    next: "end"
  
  end:
    type: "end"
```

Test the workflow with various inputs to verify the behavior of the agent:

* Simple questions
* Complex analysis request
* Tasks that need to be used
* Edge case and error conditions

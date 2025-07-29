# 커스텀 노드(Custom Node) 가이드

## 개요

SowonFlow의 커스텀 노드는 에이전트나 기본 제공 노드 타입으로는 구현하기 어려운 복잡한 비즈니스 로직을 직접 구현할 수 있는 강력한 기능입니다. 커스텀 노드를 통해 개발자는 워크플로우에 특별한 처리 로직을 삽입하고, 완전한 제어권을 가지고 워크플로우를 확장할 수 있습니다.

## 커스텀 노드의 이해

### 커스텀 노드란?
커스텀 노드는 사용자가 직접 정의한 핸들러 함수로 구현되는 노드입니다:

- **완전한 제어**: 워크플로우 상태에 대한 완전한 읽기/쓰기 권한
- **비동기 지원**: 외부 API 호출, 파일 처리, 복잡한 계산 등
- **유연한 입출력**: 메시지, 상태 변수, 커스텀 데이터 처리
- **병렬 처리 호환**: `parallel`과 `join` 노드와 완벽 연동

### 커스텀 노드 vs 에이전트 vs 도구

| 구분 | 커스텀 노드 | 에이전트 | 도구 |
|------|-------------|----------|------|
| **사용 목적** | 복잡한 워크플로우 로직 | AI 추론 및 의사결정 | 특정 기능 실행 |
| **제어 수준** | 완전한 제어 | AI 모델에 의존 | 함수 수준 제어 |
| **워크플로우 통합** | 직접 노드로 통합 | 노드 내에서 실행 | 에이전트가 호출 |
| **상태 접근** | 전체 상태 읽기/쓰기 | 제한적 | 매개변수만 |
| **실행 시점** | 워크플로우 흐름에 따라 | 노드 실행 시 | 에이전트 요청 시 |

## 기본 커스텀 노드 구현

### 간단한 커스텀 노드

```typescript
import { WorkflowState } from 'sowonflow';
import { SystemMessage } from '@langchain/core/messages';

const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    // 간단한 처리 로직
    simpleProcessor: async (state: WorkflowState) => {
      console.log('커스텀 노드 실행 시작');
      
      // 비즈니스 로직 처리
      const result = await processData(state.variables);
      
      console.log('커스텀 노드 실행 완료');
      
      return { 
        messages: [new SystemMessage(`처리 완료: ${result}`)] 
      };
    }
  }
});
```

### YAML 워크플로우 정의

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "커스텀 노드 예제"

nodes:
  start:
    type: "custom"
    handler: "simpleProcessor"  # 핸들러 이름 지정
    next: "end"
  
  end:
    type: "end"
```

## 실제 예제: 병렬 커스텀 노드

### 병렬 처리를 활용한 워크플로우

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "병렬 커스텀 워크플로우"

state:
  variables:
    - name: "userId"
      initial_value: null
    - name: "results"
      initial_value: {}

nodes:
  start:
    type: "custom"
    handler: "initializeData"
    next: "parallelProcessing"
  
  parallelProcessing:
    type: "parallel"
    branches: ["dataValidation", "userLookup", "permissionCheck"]

  dataValidation:
    type: "custom"
    handler: "validateInput"
    next: "joinResults"

  userLookup:
    type: "custom"
    handler: "fetchUserInfo"
    next: "joinResults"
  
  permissionCheck:
    type: "custom"
    handler: "checkPermissions"
    next: "joinResults"

  joinResults:
    type: "join"
    next: "finalProcessing"

  finalProcessing:
    type: "custom"
    handler: "processResults"
    next: "end"

  end:
    type: "end"
```

### 핸들러 구현

```typescript
import { WorkflowState } from 'sowonflow';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    // 초기화 핸들러
    initializeData: async (state: WorkflowState) => {
      console.log('데이터 초기화 시작');
      
      // 사용자 ID 추출 (메시지나 입력에서)
      const userInput = state.messages?.[0]?.content || '';
      const userId = extractUserIdFromInput(userInput);
      
      // 상태 변수 업데이트
      state.variables.userId = userId;
      
      console.log(`사용자 ID 설정: ${userId}`);
      
      return { 
        messages: [new SystemMessage(`초기화 완료 - 사용자: ${userId}`)] 
      };
    },

    // 데이터 검증 (병렬 실행 1)
    validateInput: async (state: WorkflowState) => {
      console.log('입력 데이터 검증 시작');
      await delay(1500); // 검증 시뮬레이션
      
      const userId = state.variables.userId;
      const isValid = userId && userId.length > 0;
      
      // 결과를 상태에 저장
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.validation = {
        valid: isValid,
        message: isValid ? '유효한 입력' : '잘못된 입력'
      };
      
      console.log('입력 데이터 검증 완료');
      
      return { 
        messages: [new SystemMessage(`검증 결과: ${isValid ? '성공' : '실패'}`)] 
      };
    },

    // 사용자 정보 조회 (병렬 실행 2)
    fetchUserInfo: async (state: WorkflowState) => {
      console.log('사용자 정보 조회 시작');
      await delay(2000); // API 호출 시뮬레이션
      
      const userId = state.variables.userId;
      
      // 외부 API 호출 시뮬레이션
      const userInfo = await mockUserAPI.getUserInfo(userId);
      
      // 결과 저장
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.userInfo = userInfo;
      
      console.log('사용자 정보 조회 완료');
      
      return { 
        messages: [new SystemMessage(`사용자 정보: ${userInfo.name}`)] 
      };
    },

    // 권한 확인 (병렬 실행 3)
    checkPermissions: async (state: WorkflowState) => {
      console.log('권한 확인 시작');
      await delay(1000); // 권한 시스템 조회 시뮬레이션
      
      const userId = state.variables.userId;
      
      // 권한 확인 로직
      const permissions = await mockPermissionAPI.checkPermissions(userId);
      
      // 결과 저장
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.permissions = permissions;
      
      console.log('권한 확인 완료');
      
      return { 
        messages: [new SystemMessage(`권한: ${permissions.join(', ')}`)] 
      };
    },

    // 최종 처리 (조인 후 실행)
    processResults: async (state: WorkflowState) => {
      console.log('최종 결과 처리 시작');
      
      const results = state.variables.results;
      
      // 모든 병렬 작업 결과 통합
      const summary = {
        validation: results.validation,
        user: results.userInfo,
        permissions: results.permissions,
        status: results.validation?.valid ? 'approved' : 'rejected'
      };
      
      console.log('최종 처리 완료:', summary);
      
      return { 
        messages: [new SystemMessage(`처리 완료: ${JSON.stringify(summary, null, 2)}`)] 
      };
    }
  }
});

// 모킹 함수들
const mockUserAPI = {
  getUserInfo: async (userId: string) => {
    await delay(100);
    return {
      id: userId,
      name: `User_${userId}`,
      email: `${userId}@example.com`,
      department: 'Engineering'
    };
  }
};

const mockPermissionAPI = {
  checkPermissions: async (userId: string) => {
    await delay(100);
    return ['read', 'write', 'admin'];
  }
};

const extractUserIdFromInput = (input: string): string => {
  // 간단한 사용자 ID 추출 로직
  const match = input.match(/user[_\s]*(\w+)/i);
  return match ? match[1] : 'default_user';
};
```

## 고급 패턴: 중첩된 병렬 처리

### 복잡한 워크플로우 구조

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "중첩 병렬 커스텀 워크플로우"

state:
  variables:
    - name: "taskType"
      initial_value: null
    - name: "phase1Results"
      initial_value: {}
    - name: "phase2Results"
      initial_value: {}

nodes:
  start:
    type: "custom"
    handler: "analyzeTask"
    next: "phase1Parallel"
  
  # 1단계 병렬 처리
  phase1Parallel:
    type: "parallel"
    branches: ["dataCollection", "resourceCheck", "dependencyAnalysis"]

  dataCollection:
    type: "custom"
    handler: "collectData"
    next: "phase1Join"

  resourceCheck:
    type: "custom"
    handler: "checkResources"
    next: "phase1Join"
  
  dependencyAnalysis:
    type: "custom"
    handler: "analyzeDependencies"
    next: "phase1Join"

  phase1Join:
    type: "join"
    next: "evaluatePhase1"

  evaluatePhase1:
    type: "custom"
    handler: "evaluateFirstPhase"
    next: "phase2Parallel"

  # 2단계 병렬 처리
  phase2Parallel:
    type: "parallel"
    branches: ["executionBranch1", "executionBranch2", "monitoringBranch"]

  executionBranch1:
    type: "custom"
    handler: "executeTaskA"
    next: "phase2Join"

  executionBranch2:
    type: "custom"
    handler: "executeTaskB"
    next: "phase2Join"
  
  monitoringBranch:
    type: "custom"
    handler: "monitorProgress"
    next: "phase2Join"

  phase2Join:
    type: "join"
    next: "finalSummary"

  finalSummary:
    type: "custom"
    handler: "generateSummary"
    next: "end"

  end:
    type: "end"
```

## 커스텀 노드 모범 사례

### 1. 상태 관리

```typescript
// 좋은 예시: 안전한 상태 업데이트
const safeHandler = async (state: WorkflowState) => {
  // 상태 변수 존재 확인
  if (!state.variables) {
    state.variables = {};
  }
  
  // 중첩 객체 안전 생성
  if (!state.variables.results) {
    state.variables.results = {};
  }
  
  // 데이터 업데이트
  state.variables.results.timestamp = new Date().toISOString();
  state.variables.results.status = 'completed';
  
  return { messages: [new SystemMessage('상태 업데이트 완료')] };
};

// 나쁜 예시: 안전하지 않은 접근
const unsafeHandler = async (state: WorkflowState) => {
  // 오류 가능성: state.variables가 undefined일 수 있음
  state.variables.results.data = 'some value';
  
  return { messages: [] };
};
```

### 2. 에러 처리

```typescript
const robustHandler = async (state: WorkflowState) => {
  try {
    console.log('처리 시작');
    
    // 입력 검증
    if (!state.variables?.userId) {
      throw new Error('사용자 ID가 필요합니다');
    }
    
    // 비즈니스 로직 실행
    const result = await externalAPI.processUser(state.variables.userId);
    
    // 결과 저장
    state.variables.apiResult = result;
    
    console.log('처리 완료');
    
    return { 
      messages: [new SystemMessage(`성공: ${result.status}`)] 
    };
  } catch (error) {
    console.error('처리 중 오류:', error);
    
    // 오류 상태 저장
    state.variables.error = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    return { 
      messages: [new SystemMessage(`오류 발생: ${error.message}`)] 
    };
  }
};
```

### 3. 비동기 처리 및 성능 최적화

```typescript
// 병렬 처리 최적화
const optimizedHandler = async (state: WorkflowState) => {
  const userId = state.variables.userId;
  
  // 여러 비동기 작업을 병렬로 실행
  const [userInfo, permissions, settings] = await Promise.all([
    userService.getInfo(userId),
    permissionService.getPermissions(userId),
    settingsService.getUserSettings(userId)
  ]);
  
  // 결과 통합
  state.variables.userData = {
    info: userInfo,
    permissions: permissions,
    settings: settings,
    loadedAt: new Date().toISOString()
  };
  
  return { 
    messages: [new SystemMessage('사용자 데이터 로드 완료')] 
  };
};

// 캐싱을 활용한 성능 향상
const cache = new Map();

const cachedHandler = async (state: WorkflowState) => {
  const cacheKey = `user_${state.variables.userId}`;
  
  // 캐시 확인
  if (cache.has(cacheKey)) {
    console.log('캐시에서 데이터 반환');
    state.variables.userInfo = cache.get(cacheKey);
    return { messages: [new SystemMessage('캐시된 데이터 사용')] };
  }
  
  // 새로운 데이터 조회
  const userInfo = await userService.getInfo(state.variables.userId);
  
  // 캐시 저장 (5분 TTL)
  cache.set(cacheKey, userInfo);
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  state.variables.userInfo = userInfo;
  
  return { messages: [new SystemMessage('새로운 데이터 조회 완료')] };
};
```

## 실제 사용 사례

### 1. 파일 처리 워크플로우

```typescript
const fileProcessingHandlers = {
  scanDirectory: async (state: WorkflowState) => {
    const directory = state.variables.targetDirectory;
    const files = await fs.readdir(directory);
    
    state.variables.fileList = files;
    state.variables.totalFiles = files.length;
    
    return { messages: [new SystemMessage(`${files.length}개 파일 발견`)] };
  },

  processImages: async (state: WorkflowState) => {
    const imageFiles = state.variables.fileList.filter(f => 
      f.match(/\.(jpg|jpeg|png|gif)$/i)
    );
    
    const results = await Promise.all(
      imageFiles.map(file => imageProcessor.optimize(file))
    );
    
    state.variables.processedImages = results;
    
    return { messages: [new SystemMessage(`${results.length}개 이미지 처리 완료`)] };
  },

  processDocuments: async (state: WorkflowState) => {
    const docFiles = state.variables.fileList.filter(f => 
      f.match(/\.(pdf|docx|txt)$/i)
    );
    
    const extracted = await Promise.all(
      docFiles.map(file => documentProcessor.extractText(file))
    );
    
    state.variables.extractedText = extracted;
    
    return { messages: [new SystemMessage(`${extracted.length}개 문서 처리 완료`)] };
  }
};
```

### 2. 데이터 파이프라인

```typescript
const dataPipelineHandlers = {
  extractData: async (state: WorkflowState) => {
    const sources = state.variables.dataSources;
    const rawData = [];
    
    for (const source of sources) {
      const data = await dataExtractor.extract(source);
      rawData.push(...data);
    }
    
    state.variables.rawData = rawData;
    
    return { messages: [new SystemMessage(`${rawData.length}개 레코드 추출`)] };
  },

  transformData: async (state: WorkflowState) => {
    const rawData = state.variables.rawData;
    
    // 데이터 변환 로직
    const transformed = rawData.map(record => ({
      ...record,
      normalizedAt: new Date().toISOString(),
      processed: true
    }));
    
    state.variables.transformedData = transformed;
    
    return { messages: [new SystemMessage('데이터 변환 완료')] };
  },

  loadData: async (state: WorkflowState) => {
    const transformedData = state.variables.transformedData;
    
    // 배치로 데이터베이스에 저장
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      await database.insertBatch(batch);
      inserted += batch.length;
    }
    
    state.variables.insertedCount = inserted;
    
    return { messages: [new SystemMessage(`${inserted}개 레코드 저장 완료`)] };
  }
};
```

## 디버깅 및 모니터링

### 실행 상태 추적

```typescript
const debugHandler = async (state: WorkflowState) => {
  const startTime = Date.now();
  
  console.log('=== 커스텀 노드 실행 시작 ===');
  console.log('현재 상태:', JSON.stringify(state.variables, null, 2));
  console.log('메시지 개수:', state.messages?.length || 0);
  
  try {
    // 비즈니스 로직 실행
    const result = await complexBusinessLogic(state);
    
    const endTime = Date.now();
    console.log(`실행 시간: ${endTime - startTime}ms`);
    console.log('실행 결과:', result);
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    console.error(`실행 실패 (${endTime - startTime}ms):`, error);
    throw error;
  }
};
```

### 성능 모니터링

```typescript
const performanceWrapper = (handlerName: string, handler: Function) => {
  return async (state: WorkflowState) => {
    const metrics = {
      startTime: Date.now(),
      memoryBefore: process.memoryUsage(),
      handlerName: handlerName
    };
    
    try {
      const result = await handler(state);
      
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.memoryAfter = process.memoryUsage();
      metrics.success = true;
      
      // 메트릭 로깅
      console.log('성능 메트릭:', metrics);
      
      return result;
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.success = false;
      metrics.error = error.message;
      
      console.error('실행 실패 메트릭:', metrics);
      throw error;
    }
  };
};

// 사용 예시
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    dataProcessor: performanceWrapper('dataProcessor', async (state) => {
      // 실제 처리 로직
      return await processData(state);
    })
  }
});
```

## 주의사항 및 제한사항

### 1. 메모리 관리
- 대용량 데이터 처리 시 메모리 사용량 주의
- 스트림 처리나 배치 처리 고려
- 불필요한 데이터는 상태에서 제거

### 2. 병렬 처리 시 고려사항
- 공유 리소스 접근 시 동시성 문제
- 상태 변수 업데이트 시 경합 조건 방지
- 외부 API 호출 시 rate limiting 고려

### 3. 에러 복구
- 부분 실패 시 복구 전략 구현
- 재시도 로직 및 백오프 전략
- 실패한 작업의 상태 정보 보존

커스텀 노드는 SowonFlow의 가장 강력한 기능 중 하나로, 복잡한 비즈니스 로직을 워크플로우에 직접 통합할 수 있게 해줍니다. 적절한 설계와 구현을 통해 확장 가능하고 유지보수가 쉬운 워크플로우를 만들 수 있습니다.

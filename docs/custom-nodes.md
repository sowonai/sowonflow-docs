# Custom Nodes Guide

## Overview

Custom nodes in SowonFlow are a powerful feature that allows you to directly implement complex business logic that is difficult to achieve with agents or built-in node types. Through custom nodes, developers can insert special processing logic into workflows and extend workflows with complete control.

## Understanding Custom Nodes

### What are Custom Nodes?
Custom nodes are nodes implemented with user-defined handler functions:

- **Complete Control**: Full read/write access to workflow state
- **Asynchronous Support**: External API calls, file processing, complex calculations, etc.
- **Flexible I/O**: Message, state variables, custom data processing
- **Parallel Processing Compatibility**: Fully integrated with `parallel` and `join` nodes

### Custom Nodes vs. Agents vs. Tools

| Category | Custom Node | Agent | Tool |
|---|---|---|---|
| **Purpose** | Complex workflow logic | AI inference and decision-making | Execute specific functions |
| **Control Level** | Complete control | Relies on AI model | Function-level control |
| **Workflow Integration** | Directly integrated as a node | Executed within a node | Called by an agent |
| **State Access** | Full state read/write | Limited | Parameters only |
| **Execution Time** | According to workflow flow | Upon node execution | Upon agent request |

## Basic Custom Node Implementation

### Simple Custom Node

```typescript
import { WorkflowState } from 'sowonflow';
import { SystemMessage } from '@langchain/core/messages';

const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    // Simple processing logic
    simpleProcessor: async (state: WorkflowState) => {
      console.log('Custom node execution started');
      
      // Process business logic
      const result = await processData(state.variables);
      
      console.log('Custom node execution completed');
      
      return { 
        messages: [new SystemMessage(`Processing complete: ${result}`)] 
      };
    }
  }
});
```

### YAML Workflow Definition

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "커스텀 노드 예제" # Custom Node Example

nodes:
  start:
    type: "custom"
    handler: "simpleProcessor"  # Specify handler name
    next: "end"
  
  end:
    type: "end"
```

## Real Example: Parallel Custom Nodes

### Workflow Utilizing Parallel Processing

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "병렬 커스텀 워크플로우" # Parallel Custom Workflow

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

### Handler Implementation

```typescript
import { WorkflowState } from 'sowonflow';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    // Initialization handler
    initializeData: async (state: WorkflowState) => {
      console.log('Data initialization started');
      
      // Extract user ID (from message or input)
      const userInput = state.messages?.[0]?.content || '';
      const userId = extractUserIdFromInput(userInput);
      
      // Update state variable
      state.variables.userId = userId;
      
      console.log(`User ID set: ${userId}`);
      
      return { 
        messages: [new SystemMessage(`Initialization complete - User: ${userId}`)] 
      };
    },

    // Data validation (parallel execution 1)
    validateInput: async (state: WorkflowState) => {
      console.log('Input data validation started');
      await delay(1500); // Simulate validation
      
      const userId = state.variables.userId;
      const isValid = userId && userId.length > 0;
      
      // Store results in state
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.validation = {
        valid: isValid,
        message: isValid ? 'Valid input' : 'Invalid input'
      };
      
      console.log('Input data validation completed');
      
      return { 
        messages: [new SystemMessage(`Validation Result: ${isValid ? 'Success' : 'Failure'}`)] 
      };
    },

    // Fetch user information (parallel execution 2)
    fetchUserInfo: async (state: WorkflowState) => {
      console.log('Fetching user information started');
      await delay(2000); // Simulate API call
      
      const userId = state.variables.userId;
      
      // Simulate external API call
      const userInfo = await mockUserAPI.getUserInfo(userId);
      
      // Store results
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.userInfo = userInfo;
      
      console.log('User information fetch completed');
      
      return { 
        messages: [new SystemMessage(`User Info: ${userInfo.name}`)] 
      };
    },

    // Check permissions (parallel execution 3)
    checkPermissions: async (state: WorkflowState) => {
      console.log('Permission check started');
      await delay(1000); // Simulate permission system lookup
      
      const userId = state.variables.userId;
      
      // Permission check logic
      const permissions = await mockPermissionAPI.checkPermissions(userId);
      
      // Store results
      if (!state.variables.results) {
        state.variables.results = {};
      }
      state.variables.results.permissions = permissions;
      
      console.log('Permission check completed');
      
      return { 
        messages: [new SystemMessage(`Permissions: ${permissions.join(', ')}`)] 
      };
    },

    // Final processing (executed after join)
    processResults: async (state: WorkflowState) => {
      console.log('Final result processing started');
      
      const results = state.variables.results;
      
      // Integrate results of all parallel tasks
      const summary = {
        validation: results.validation,
        user: results.userInfo,
        permissions: results.permissions,
        status: results.validation?.valid ? 'approved' : 'rejected'
      };
      
      console.log('Final processing completed:', summary);
      
      return { 
        messages: [new SystemMessage(`Processing complete: ${JSON.stringify(summary, null, 2)}`)] 
      };
    }
  }
});

// Mock functions
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
  // Simple user ID extraction logic
  const match = input.match(/user[_\s]*(\w+)/i);
  return match ? match[1] : 'default_user';
};
```

## Advanced Patterns: Nested Parallel Processing

### Complex Workflow Structure

```yaml
version: "agentflow/v1"
kind: "WorkflowSpec"
metadata:
  name: "중첩 병렬 커스텀 워크플로우" # Nested Parallel Custom Workflow

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
  
  # Phase 1 Parallel Processing
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

  # Phase 2 Parallel Processing
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

## Custom Node Best Practices

### 1. State Management

```typescript
// Good example: Safe state update
const safeHandler = async (state: WorkflowState) => {
  // Check for existence of state variables
  if (!state.variables) {
    state.variables = {};
  }
  
  // Safely create nested object
  if (!state.variables.results) {
    state.variables.results = {};
  }
  
  // Update data
  state.variables.results.timestamp = new Date().toISOString();
  state.variables.results.status = 'completed';
  
  return { messages: [new SystemMessage('State update complete')] };
};

// Bad example: Unsafe access
const unsafeHandler = async (state: WorkflowState) => {
  // Potential error: state.variables might be undefined
  state.variables.results.data = 'some value';
  
  return { messages: [] };
};
```

### 2. Error Handling

```typescript
const robustHandler = async (state: WorkflowState) => {
  try {
    console.log('Processing started');
    
    // Input validation
    if (!state.variables?.userId) {
      throw new Error('User ID is required');
    }
    
    // Execute business logic
    const result = await externalAPI.processUser(state.variables.userId);
    
    // Save result
    state.variables.apiResult = result;
    
    console.log('Processing completed');
    
    return { 
      messages: [new SystemMessage(`Success: ${result.status}`)] 
    };
  } catch (error) {
    console.error('Error during processing:', error);
    
    // Save error state
    state.variables.error = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
    
    return { 
      messages: [new SystemMessage(`Error occurred: ${error.message}`)] 
    };
  }
};
```

### 3. Asynchronous Processing and Performance Optimization

```typescript
// Parallel processing optimization
const optimizedHandler = async (state: WorkflowState) => {
  const userId = state.variables.userId;
  
  // Execute multiple asynchronous tasks in parallel
  const [userInfo, permissions, settings] = await Promise.all([
    userService.getInfo(userId),
    permissionService.getPermissions(userId),
    settingsService.getUserSettings(userId)
  ]);
  
  // Integrate results
  state.variables.userData = {
    info: userInfo,
    permissions: permissions,
    settings: settings,
    loadedAt: new Date().toISOString()
  };
  
  return { 
    messages: [new SystemMessage('User data loaded')] 
  };
};

// Performance improvement using caching
const cache = new Map();

const cachedHandler = async (state: WorkflowState) => {
  const cacheKey = `user_${state.variables.userId}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    console.log('Returning data from cache');
    state.variables.userInfo = cache.get(cacheKey);
    return { messages: [new SystemMessage('Using cached data')] };
  }
  
  // Fetch new data
  const userInfo = await userService.getInfo(state.variables.userId);
  
  // Store in cache (5 minute TTL)
  cache.set(cacheKey, userInfo);
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  state.variables.userInfo = userInfo;
  
  return { messages: [new SystemMessage('New data fetched')] };
};
```

## Real-world Use Cases

### 1. File Processing Workflow

```typescript
const fileProcessingHandlers = {
  scanDirectory: async (state: WorkflowState) => {
    const directory = state.variables.targetDirectory;
    const files = await fs.readdir(directory);
    
    state.variables.fileList = files;
    state.variables.totalFiles = files.length;
    
    return { messages: [new SystemMessage(`${files.length} files found`)] };
  },

  processImages: async (state: WorkflowState) => {
    const imageFiles = state.variables.fileList.filter(f => 
      f.match(/\.(jpg|jpeg|png|gif)$/i)
    );
    
    const results = await Promise.all(
      imageFiles.map(file => imageProcessor.optimize(file))
    );
    
    state.variables.processedImages = results;
    
    return { messages: [new SystemMessage(`${results.length} images processed`)] };
  },

  processDocuments: async (state: WorkflowState) => {
    const docFiles = state.variables.fileList.filter(f => 
      f.match(/\.(pdf|docx|txt)$/i)
    );
    
    const extracted = await Promise.all(
      docFiles.map(file => documentProcessor.extractText(file))
    );
    
    state.variables.extractedText = extracted;
    
    return { messages: [new SystemMessage(`${extracted.length} documents processed`)] };
  }
};
```

### 2. Data Pipeline

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
    
    return { messages: [new SystemMessage(`${rawData.length} records extracted`)] };
  },

  transformData: async (state: WorkflowState) => {
    const rawData = state.variables.rawData;
    
    // Data transformation logic
    const transformed = rawData.map(record => ({
      ...record,
      normalizedAt: new Date().toISOString(),
      processed: true
    }));
    
    state.variables.transformedData = transformed;
    
    return { messages: [new SystemMessage('Data transformation complete')] };
  },

  loadData: async (state: WorkflowState) => {
    const transformedData = state.variables.transformedData;
    
    // Save to database in batches
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      await database.insertBatch(batch);
      inserted += batch.length;
    }
    
    state.variables.insertedCount = inserted;
    
    return { messages: [new SystemMessage(`${inserted} records saved`)] };
  }
};
```

## Debugging and Monitoring

### Tracking Execution Status

```typescript
const debugHandler = async (state: WorkflowState) => {
  const startTime = Date.now();
  
  console.log('=== Custom Node Execution Started ===');
  console.log('Current State:', JSON.stringify(state.variables, null, 2));
  console.log('Message Count:', state.messages?.length || 0);
  
  try {
    // Execute business logic
    const result = await complexBusinessLogic(state);
    
    const endTime = Date.now();
    console.log(`Execution Time: ${endTime - startTime}ms`);
    console.log('Execution Result:', result);
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    console.error(`Execution Failed (${endTime - startTime}ms):`, error);
    throw error;
  }
};
```

### Performance Monitoring

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
      
      // Log metrics
      console.log('Performance Metrics:', metrics);
      
      return result;
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.success = false;
      metrics.error = error.message;
      
      console.error('Execution Failure Metrics:', metrics);
      throw error;
    }
  };
};

// Usage example
const workflow = new Workflow({
  mainWorkflow: yamlContent,
  handlers: {
    dataProcessor: performanceWrapper('dataProcessor', async (state) => {
      // Actual processing logic
      return await processData(state);
    })
  }
});
```

## Caveats and Limitations

### 1. Memory Management
- Be mindful of memory usage when processing large datasets
- Consider stream processing or batch processing
- Remove unnecessary data from state

### 2. Considerations for Parallel Processing
- Concurrency issues when accessing shared resources
- Prevent race conditions when updating state variables
- Consider rate limiting when making external API calls

### 3. Error Recovery
- Implement recovery strategies for partial failures
- Retry logic and backoff strategies
- Preserve state information of failed tasks

Custom nodes are one of SowonFlow's most powerful features, allowing direct integration of complex business logic into workflows. With proper design and implementation, you can create scalable and maintainable workflows.
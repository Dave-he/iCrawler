<template>
  <div class="workflow-editor">
    <div class="editor-header">
      <div class="header-left">
        <h2>{{ workflow.name || 'New Workflow' }}</h2>
        <div class="workflow-actions">
          <el-button type="primary" @click="executeWorkflow">
            <el-icon><Play /></el-icon>
            Execute
          </el-button>
          <el-button @click="saveWorkflow">
            <el-icon><Save /></el-icon>
            Save
          </el-button>
          <el-button @click="exportWorkflow">
            <el-icon><Download /></el-icon>
            Export
          </el-button>
        </div>
      </div>
      <div class="header-right">
        <el-switch
          v-model="isRunning"
          active-text="Running"
          inactive-text="Stopped"
          disabled
        />
      </div>
    </div>

    <div class="editor-content">
      <div class="sidebar">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="Nodes" name="nodes">
            <div class="node-list">
              <div class="node-category" v-for="(nodes, category) in nodeCategories" :key="category">
                <h4>{{ category }}</h4>
                <draggable
                  :list="nodes"
                  :group="{ name: 'nodes', pull: 'clone', put: false }"
                  class="node-items"
                >
                  <div
                    v-for="node in nodes"
                    :key="node.name"
                    class="node-item"
                    draggable
                  >
                    <el-icon><component :is="node.icon" /></el-icon>
                    <span>{{ node.displayName }}</span>
                  </div>
                </draggable>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Properties" name="properties">
            <div v-if="selectedNode" class="node-properties">
              <h4>{{ selectedNode.data.label }}</h4>
              <el-form :model="selectedNode.data" label-width="120px">
                <el-form-item
                  v-for="prop in nodeProperties"
                  :key="prop.name"
                  :label="prop.displayName"
                >
                  <component
                    :is="getFormComponent(prop.type)"
                    v-model="selectedNode.data[prop.name]"
                    v-bind="prop.options"
                  />
                </el-form-item>
              </el-form>
            </div>
            <div v-else class="no-selection">
              Select a node to edit its properties
            </div>
          </el-tab-pane>
          <el-tab-pane label="Data" name="data">
            <div class="data-view">
              <h4>Execution Data</h4>
              <pre>{{ JSON.stringify(executionData, null, 2) }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="canvas-container">
        <VueFlow
          v-model="nodes"
          v-model:edges="edges"
          :min-zoom="0.1"
          :max-zoom="4"
          :default-viewport="{ zoom: 1 }"
          class="vue-flow"
          @node-click="onNodeClick"
          @connect="onConnect"
        >
          <!-- 自定义节点渲染 -->
          <template #node-browserAction="nodeProps">
            <div class="custom-node browser-action-node">
              <div class="node-header">
                <el-icon><Pointer /></el-icon>
                <span>Browser Action</span>
              </div>
              <div class="node-content">
                <div class="node-label">{{ nodeProps.data.label }}</div>
                <div class="node-type">{{ nodeProps.data.action }}</div>
              </div>
            </div>
          </template>

          <template #node-dataMapper="nodeProps">
            <div class="custom-node data-mapper-node">
              <div class="node-header">
                <el-icon><DataAnalysis /></el-icon>
                <span>Data Mapper</span>
              </div>
              <div class="node-content">
                <div class="node-label">{{ nodeProps.data.label }}</div>
              </div>
            </div>
          </template>
        </VueFlow>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Play, Save, Download, Pointer, DataAnalysis } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

// 模拟节点数据
const nodeCategories = ref({
  Browser: [
    { name: 'browserAction', displayName: 'Browser Action', icon: 'Pointer' },
    { name: 'elementExists', displayName: 'Element Exists', icon: 'Search' }
  ],
  Data: [
    { name: 'dataMapper', displayName: 'Data Mapper', icon: 'DataAnalysis' },
    { name: 'variableManager', displayName: 'Variable Manager', icon: 'Setting' }
  ],
  Control: [
    { name: 'ifElse', displayName: 'If/Else', icon: 'Branches' },
    { name: 'loop', displayName: 'Loop', icon: 'Refresh' }
  ]
})

const nodes = ref([])
const edges = ref([])
const selectedNode = ref(null)
const activeTab = ref('nodes')
const isRunning = ref(false)
const executionData = ref({})

// 模拟工作流数据
const workflow = ref({
  name: 'My Browser Automation Workflow',
  nodes: [],
  edges: []
})

// 节点属性配置
const nodeProperties = computed(() => {
  if (!selectedNode.value) return []
  
  const nodeType = selectedNode.value.type
  switch (nodeType) {
    case 'browserAction':
      return [
        { name: 'action', displayName: 'Action', type: 'select', options: { 
          options: [
            { label: 'Navigate', value: 'navigate' },
            { label: 'Click', value: 'click' },
            { label: 'Type', value: 'type' }
          ]
        }},
        { name: 'selector', displayName: 'Selector', type: 'input', options: {} },
        { name: 'url', displayName: 'URL', type: 'input', options: {} }
      ]
    case 'dataMapper':
      return [
        { name: 'mappingRules', displayName: 'Mapping Rules', type: 'json', options: {} },
        { name: 'keepOriginal', displayName: 'Keep Original', type: 'boolean', options: {} }
      ]
    default:
      return []
  }
})

function getFormComponent(type: string) {
  switch (type) {
    case 'select': return 'el-select'
    case 'input': return 'el-input'
    case 'json': return 'el-input'
    case 'boolean': return 'el-switch'
    default: return 'el-input'
  }
}

function onNodeClick(event: any) {
  selectedNode.value = event.node
}

function onConnect(connection: any) {
  edges.value.push({
    id: `e-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle
  })
}

async function executeWorkflow() {
  isRunning.value = true
  try {
    // 这里调用后端API执行工作流
    console.log('Executing workflow...')
    // 模拟执行
    await new Promise(resolve => setTimeout(resolve, 2000))
    isRunning.value = false
  } catch (error) {
    isRunning.value = false
    console.error('Workflow execution failed:', error)
  }
}

function saveWorkflow() {
  console.log('Saving workflow...')
}

function exportWorkflow() {
  const workflowData = {
    nodes: nodes.value,
    edges: edges.value
  }
  const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'workflow.json'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  // 初始化画布
  nodes.value = [
    {
      id: '1',
      type: 'browserAction',
      position: { x: 100, y: 100 },
      data: { label: 'Navigate to Website', action: 'navigate', url: 'https://example.com' }
    },
    {
      id: '2',
      type: 'dataMapper',
      position: { x: 400, y: 100 },
      data: { label: 'Map Data', mappingRules: {}, keepOriginal: false }
    }
  ]
  
  edges.value = [
    {
      id: 'e-1-2',
      source: '1',
      target: '2',
      sourceHandle: 'output',
      targetHandle: 'input'
    }
  ]
})
</script>

<style scoped>
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.workflow-actions {
  display: flex;
  gap: 1rem;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.node-list {
  padding: 1rem;
  overflow-y: auto;
}

.node-category {
  margin-bottom: 2rem;
}

.node-category h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #606266;
  text-transform: uppercase;
}

.node-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
  background: white;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.vue-flow {
  height: 100%;
  width: 100%;
}

.custom-node {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 1rem;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #303133;
}

.node-content {
  font-size: 0.875rem;
  color: #606266;
}

.node-label {
  font-weight: 500;
}

.node-type {
  font-size: 0.75rem;
  color: #909399;
  margin-top: 0.25rem;
}

.browser-action-node {
  border-left: 4px solid #409eff;
}

.data-mapper-node {
  border-left: 4px solid #67c23a;
}

.node-properties {
  padding: 1rem;
}

.no-selection {
  padding: 1rem;
  color: #909399;
  text-align: center;
}

.data-view {
  padding: 1rem;
}

.data-view h4 {
  margin-top: 0;
}

.data-view pre {
  background: #f5f7fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
}
</style>
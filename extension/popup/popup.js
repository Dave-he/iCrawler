/**
 * iCrawler Popup Script
 * 处理popup界面的交互逻辑
 */

let workflows = [];
let selectedWorkflow = null;
let isExecuting = false;

// DOM元素
const elements = {
  status: document.getElementById('status'),
  workflowList: document.getElementById('workflow-list'),
  mainView: document.getElementById('main-view'),
  newWorkflowView: document.getElementById('new-workflow-view'),
  
  // 按钮
  btnNewWorkflow: document.getElementById('btn-new-workflow'),
  btnExecute: document.getElementById('btn-execute'),
  btnStop: document.getElementById('btn-stop'),
  btnQuickScrape: document.getElementById('btn-quick-scrape'),
  btnScreenshot: document.getElementById('btn-screenshot'),
  btnSaveWorkflow: document.getElementById('btn-save-workflow'),
  btnCancel: document.getElementById('btn-cancel'),
  
  // 输入框
  workflowName: document.getElementById('workflow-name'),
  workflowDescription: document.getElementById('workflow-description'),
  workflowJson: document.getElementById('workflow-json'),
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadWorkflows();
  setupEventListeners();
});

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  elements.btnNewWorkflow.addEventListener('click', showNewWorkflowView);
  elements.btnExecute.addEventListener('click', executeWorkflow);
  elements.btnStop.addEventListener('click', stopWorkflow);
  elements.btnQuickScrape.addEventListener('click', quickScrape);
  elements.btnScreenshot.addEventListener('click', takeScreenshot);
  elements.btnSaveWorkflow.addEventListener('click', saveWorkflow);
  elements.btnCancel.addEventListener('click', showMainView);
}

/**
 * 加载工作流列表
 */
async function loadWorkflows() {
  try {
    const response = await sendMessage({ type: 'GET_WORKFLOWS' });
    
    if (response.success) {
      workflows = response.workflows;
      renderWorkflowList();
    }
  } catch (error) {
    console.error('Failed to load workflows:', error);
    setStatus('Error loading workflows', 'error');
  }
}

/**
 * 渲染工作流列表
 */
function renderWorkflowList() {
  if (workflows.length === 0) {
    elements.workflowList.innerHTML = `
      <div class="empty-state">
        No workflows yet<br>
        <small>Create your first workflow</small>
      </div>
    `;
    return;
  }

  elements.workflowList.innerHTML = workflows.map(workflow => `
    <div class="workflow-item ${selectedWorkflow?.id === workflow.id ? 'active' : ''}" 
         data-id="${workflow.id}">
      <div class="workflow-name">${workflow.name}</div>
      <div class="workflow-info">
        ${workflow.nodes?.length || 0} nodes | 
        ${new Date(workflow.updatedAt).toLocaleDateString()}
      </div>
    </div>
  `).join('');

  // 添加点击事件
  document.querySelectorAll('.workflow-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      selectWorkflow(id);
    });
  });
}

/**
 * 选择工作流
 */
function selectWorkflow(id) {
  selectedWorkflow = workflows.find(w => w.id === id);
  renderWorkflowList();
  elements.btnExecute.disabled = !selectedWorkflow;
}

/**
 * 显示新建工作流视图
 */
function showNewWorkflowView() {
  elements.mainView.classList.add('hidden');
  elements.newWorkflowView.classList.remove('hidden');
  elements.workflowName.value = '';
  elements.workflowDescription.value = '';
  elements.workflowJson.value = '';
}

/**
 * 显示主视图
 */
function showMainView() {
  elements.mainView.classList.remove('hidden');
  elements.newWorkflowView.classList.add('hidden');
}

/**
 * 保存工作流
 */
async function saveWorkflow() {
  const name = elements.workflowName.value.trim();
  const description = elements.workflowDescription.value.trim();
  const jsonStr = elements.workflowJson.value.trim();

  if (!name) {
    alert('Please enter a workflow name');
    return;
  }

  let workflowData = {
    nodes: [],
    edges: []
  };

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      workflowData = { ...workflowData, ...parsed };
    } catch (error) {
      alert('Invalid JSON format');
      return;
    }
  }

  const workflow = {
    id: Date.now().toString(),
    name,
    description,
    ...workflowData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const response = await sendMessage({
      type: 'SAVE_WORKFLOW',
      data: workflow
    });

    if (response.success) {
      setStatus('Workflow saved successfully', 'success');
      await loadWorkflows();
      showMainView();
    } else {
      setStatus('Failed to save workflow', 'error');
    }
  } catch (error) {
    console.error('Failed to save workflow:', error);
    setStatus('Error saving workflow', 'error');
  }
}

/**
 * 执行工作流
 */
async function executeWorkflow() {
  if (!selectedWorkflow) {
    alert('Please select a workflow');
    return;
  }

  if (isExecuting) {
    alert('A workflow is already executing');
    return;
  }

  try {
    isExecuting = true;
    elements.btnExecute.disabled = true;
    elements.btnStop.disabled = false;
    setStatus('Executing workflow...', 'running');

    const response = await sendMessage({
      type: 'EXECUTE_WORKFLOW',
      data: selectedWorkflow
    });

    if (response.success) {
      setStatus('Workflow completed successfully', 'success');
      console.log('Workflow results:', response.results);
    } else {
      setStatus(`Workflow failed: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Workflow execution error:', error);
    setStatus('Workflow execution error', 'error');
  } finally {
    isExecuting = false;
    elements.btnExecute.disabled = false;
    elements.btnStop.disabled = true;
  }
}

/**
 * 停止工作流执行
 */
async function stopWorkflow() {
  try {
    const response = await sendMessage({ type: 'STOP_WORKFLOW' });
    
    if (response.success) {
      setStatus('Workflow stopped', 'idle');
      isExecuting = false;
      elements.btnExecute.disabled = false;
      elements.btnStop.disabled = true;
    }
  } catch (error) {
    console.error('Failed to stop workflow:', error);
  }
}

/**
 * 快速抓取
 */
async function quickScrape() {
  const selector = prompt('Enter CSS selector to scrape:', '.item');
  
  if (!selector) return;

  try {
    setStatus('Scraping data...', 'running');

    const quickWorkflow = {
      id: 'quick-scrape',
      name: 'Quick Scrape',
      nodes: [
        {
          type: 'dataCollector',
          data: {
            collectionMode: 'multiple',
            rootSelector: selector,
            dataSchema: JSON.stringify({
              text: selector
            }),
            maxItems: 100,
            cleanData: true
          }
        }
      ]
    };

    const response = await sendMessage({
      type: 'EXECUTE_WORKFLOW',
      data: quickWorkflow
    });

    if (response.success) {
      const data = response.results[0]?.collectedData || [];
      console.log('Scraped data:', data);
      alert(`Scraped ${data.length} items. Check console for details.`);
      setStatus(`Scraped ${data.length} items`, 'success');
    } else {
      setStatus('Scraping failed', 'error');
    }
  } catch (error) {
    console.error('Quick scrape error:', error);
    setStatus('Scraping error', 'error');
  }
}

/**
 * 截图
 */
async function takeScreenshot() {
  try {
    setStatus('Taking screenshot...', 'running');

    const quickWorkflow = {
      id: 'quick-screenshot',
      name: 'Quick Screenshot',
      nodes: [
        {
          type: 'screenshot',
          data: {
            screenshotType: 'viewport',
            format: 'png',
            outputMode: 'base64'
          }
        }
      ]
    };

    const response = await sendMessage({
      type: 'EXECUTE_WORKFLOW',
      data: quickWorkflow
    });

    if (response.success) {
      const screenshot = response.results[0]?.screenshot;
      if (screenshot) {
        // 下载截图
        const link = document.createElement('a');
        link.href = screenshot;
        link.download = `screenshot-${Date.now()}.png`;
        link.click();
        setStatus('Screenshot saved', 'success');
      }
    } else {
      setStatus('Screenshot failed', 'error');
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    setStatus('Screenshot error', 'error');
  }
}

/**
 * 设置状态
 */
function setStatus(message, type = 'idle') {
  elements.status.textContent = message;
  elements.status.className = `status status-${type}`;
}

/**
 * 发送消息到background
 */
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

console.log('iCrawler popup loaded');

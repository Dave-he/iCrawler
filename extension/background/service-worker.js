/**
 * iCrawler Background Service Worker
 * 处理扩展的后台逻辑和消息通信
 */

// 工作流存储
let workflows = new Map();
let currentWorkflow = null;
let isExecuting = false;

// 扩展安装时
chrome.runtime.onInstalled.addListener((details) => {
  console.log('iCrawler installed:', details);
  
  // 初始化存储
  chrome.storage.local.set({
    workflows: [],
    settings: {
      autoSave: true,
      debugMode: false,
    }
  });
});

// 监听来自popup和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'GET_WORKFLOWS':
      handleGetWorkflows(sendResponse);
      return true;

    case 'SAVE_WORKFLOW':
      handleSaveWorkflow(message.data, sendResponse);
      return true;

    case 'EXECUTE_WORKFLOW':
      handleExecuteWorkflow(message.data, sender.tab, sendResponse);
      return true;

    case 'STOP_WORKFLOW':
      handleStopWorkflow(sendResponse);
      return true;

    case 'GET_CURRENT_TAB':
      handleGetCurrentTab(sendResponse);
      return true;

    case 'EXECUTE_NODE':
      handleExecuteNode(message.data, sender.tab, sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

/**
 * 获取所有工作流
 */
async function handleGetWorkflows(sendResponse) {
  try {
    const result = await chrome.storage.local.get('workflows');
    sendResponse({ success: true, workflows: result.workflows || [] });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 保存工作流
 */
async function handleSaveWorkflow(workflow, sendResponse) {
  try {
    const result = await chrome.storage.local.get('workflows');
    const workflows = result.workflows || [];
    
    // 查找是否已存在
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    if (index >= 0) {
      workflows[index] = workflow;
    } else {
      workflows.push(workflow);
    }
    
    await chrome.storage.local.set({ workflows });
    sendResponse({ success: true, workflow });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 执行工作流
 */
async function handleExecuteWorkflow(workflowData, tab, sendResponse) {
  if (isExecuting) {
    sendResponse({ success: false, error: 'Another workflow is executing' });
    return;
  }

  try {
    isExecuting = true;
    currentWorkflow = workflowData;

    console.log('Executing workflow:', workflowData);

    // 按顺序执行节点
    const results = [];
    let currentData = {};

    for (const node of workflowData.nodes) {
      console.log('Executing node:', node);

      const result = await executeNode(node, currentData, tab);
      results.push(result);

      // 将结果传递给下一个节点
      currentData = { ...currentData, ...result };

      // 检查是否被停止
      if (!isExecuting) {
        break;
      }
    }

    isExecuting = false;
    currentWorkflow = null;

    sendResponse({ 
      success: true, 
      results,
      message: 'Workflow executed successfully'
    });

  } catch (error) {
    isExecuting = false;
    currentWorkflow = null;
    console.error('Workflow execution error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 停止工作流执行
 */
function handleStopWorkflow(sendResponse) {
  isExecuting = false;
  currentWorkflow = null;
  sendResponse({ success: true, message: 'Workflow stopped' });
}

/**
 * 获取当前标签页信息
 */
async function handleGetCurrentTab(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sendResponse({ success: true, tab });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 执行单个节点
 */
async function handleExecuteNode(nodeData, tab, sendResponse) {
  try {
    const result = await executeNode(nodeData.node, nodeData.inputData, tab);
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 执行节点逻辑
 */
async function executeNode(node, inputData, tab) {
  console.log('Executing node type:', node.type);

  switch (node.type) {
    case 'browserAction':
      return await executeBrowserAction(node, inputData, tab);

    case 'elementExists':
      return await executeElementExists(node, inputData, tab);

    case 'executeJavaScript':
      return await executeJavaScript(node, inputData, tab);

    case 'screenshot':
      return await executeScreenshot(node, inputData, tab);

    case 'dataCollector':
      return await executeDataCollector(node, inputData, tab);

    case 'loopElements':
      return await executeLoopElements(node, inputData, tab);

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * 执行浏览器操作节点
 */
async function executeBrowserAction(node, inputData, tab) {
  const { action } = node.data;

  switch (action) {
    case 'navigate': {
      const { url } = node.data;
      await chrome.tabs.update(tab.id, { url });
      // 等待页面加载
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
      });
      return { action: 'navigate', url };
    }

    case 'click':
    case 'type':
    case 'getText':
    case 'waitForElement': {
      // 通过content script执行
      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'BROWSER_ACTION',
        action,
        data: node.data
      });
      return result;
    }

    default:
      throw new Error(`Unknown browser action: ${action}`);
  }
}

/**
 * 执行元素存在检查
 */
async function executeElementExists(node, inputData, tab) {
  const result = await chrome.tabs.sendMessage(tab.id, {
    type: 'ELEMENT_EXISTS',
    data: node.data
  });
  return result;
}

/**
 * 执行JavaScript代码
 */
async function executeJavaScript(node, inputData, tab) {
  const { jsCode, passInputData } = node.data;
  
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (code, data) => {
      const func = new Function('inputData', code);
      return func(data);
    },
    args: [jsCode, passInputData ? inputData : undefined]
  });

  return { scriptResult: result[0].result };
}

/**
 * 执行截图
 */
async function executeScreenshot(node, inputData, tab) {
  const { screenshotType, format } = node.data;
  
  let screenshot;
  
  if (screenshotType === 'viewport') {
    screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: format || 'png'
    });
  } else {
    // 全页面截图需要通过content script
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: 'SCREENSHOT',
      data: node.data
    });
    screenshot = result.screenshot;
  }

  return { screenshot, format };
}

/**
 * 执行数据收集
 */
async function executeDataCollector(node, inputData, tab) {
  const result = await chrome.tabs.sendMessage(tab.id, {
    type: 'DATA_COLLECTOR',
    data: node.data
  });
  return result;
}

/**
 * 执行元素循环
 */
async function executeLoopElements(node, inputData, tab) {
  const result = await chrome.tabs.sendMessage(tab.id, {
    type: 'LOOP_ELEMENTS',
    data: node.data
  });
  return result;
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
});

console.log('iCrawler background service worker loaded');

/**
 * iCrawler Content Script
 * 在网页中执行的脚本，用于DOM操作和数据提取
 */

console.log('iCrawler content script loaded');

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.type) {
    case 'BROWSER_ACTION':
      handleBrowserAction(message.action, message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'ELEMENT_EXISTS':
      handleElementExists(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'DATA_COLLECTOR':
      handleDataCollector(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'LOOP_ELEMENTS':
      handleLoopElements(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'SCREENSHOT':
      handleScreenshot(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

/**
 * 处理浏览器操作
 */
async function handleBrowserAction(action, data) {
  const { selector, text, timeout = 5000 } = data;

  switch (action) {
    case 'click': {
      const element = await waitForElement(selector, timeout);
      element.click();
      return { action: 'click', selector };
    }

    case 'type': {
      const element = await waitForElement(selector, timeout);
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { action: 'type', selector, text };
    }

    case 'getText': {
      const element = await waitForElement(selector, timeout);
      const text = element.textContent?.trim() || '';
      return { action: 'getText', selector, text };
    }

    case 'waitForElement': {
      await waitForElement(selector, timeout);
      return { action: 'waitForElement', selector, found: true };
    }

    default:
      throw new Error(`Unknown browser action: ${action}`);
  }
}

/**
 * 检查元素是否存在
 */
async function handleElementExists(data) {
  const { selector, timeout = 5000, invert = false } = data;

  try {
    await waitForElement(selector, timeout);
    const exists = !invert;
    return { elementExists: exists, selector };
  } catch (error) {
    const exists = invert;
    return { elementExists: exists, selector };
  }
}

/**
 * 数据收集
 */
async function handleDataCollector(data) {
  const { collectionMode, rootSelector, dataSchema, maxItems = 100, cleanData = true } = data;

  let collectedData = [];

  switch (collectionMode) {
    case 'single': {
      const element = document.querySelector(rootSelector);
      if (element) {
        const data = extractDataFromElement(element, JSON.parse(dataSchema), cleanData);
        collectedData = [data];
      }
      break;
    }

    case 'multiple': {
      const elements = document.querySelectorAll(rootSelector);
      const elementsArray = Array.from(elements).slice(0, maxItems);
      
      for (const element of elementsArray) {
        const data = extractDataFromElement(element, JSON.parse(dataSchema), cleanData);
        collectedData.push(data);
      }
      break;
    }

    case 'table': {
      const table = document.querySelector(rootSelector);
      if (table) {
        collectedData = extractTableData(table);
      }
      break;
    }

    case 'schema': {
      const data = extractDataFromElement(document.body, JSON.parse(dataSchema), cleanData);
      collectedData = [data];
      break;
    }

    default:
      throw new Error(`Unknown collection mode: ${collectionMode}`);
  }

  return {
    collectedData,
    totalItems: collectedData.length,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

/**
 * 元素循环处理
 */
async function handleLoopElements(data) {
  const { selector, action, maxElements = 100, dataRules, attributeName } = data;

  const elements = document.querySelectorAll(selector);
  const elementsArray = Array.from(elements).slice(0, maxElements);
  const results = [];

  for (let i = 0; i < elementsArray.length; i++) {
    const element = elementsArray[i];

    try {
      let result;

      switch (action) {
        case 'getText':
          result = element.textContent?.trim() || '';
          break;

        case 'getAttribute':
          result = element.getAttribute(attributeName);
          break;

        case 'getHTML':
          result = element.innerHTML;
          break;

        case 'clickAll':
          element.click();
          result = { clicked: true, index: i };
          break;

        case 'getData':
          result = extractDataFromElement(element, JSON.parse(dataRules), true);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      results.push({ index: i, data: result });
    } catch (error) {
      results.push({ index: i, error: error.message });
    }
  }

  return {
    loopResults: results,
    totalElements: elements.length,
    processedElements: elementsArray.length,
    selector,
    action
  };
}

/**
 * 截图（全页面）
 */
async function handleScreenshot(data) {
  // 全页面截图需要滚动并拼接
  // 这里返回一个简单的实现
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = document.documentElement.scrollWidth;
  canvas.height = document.documentElement.scrollHeight;

  // 注意：实际的全页面截图需要更复杂的实现
  // 这里只是一个占位符
  return {
    screenshot: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * 等待元素出现
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not found: ${selector}`));
    }, timeout);
  });
}

/**
 * 从元素中提取数据
 */
function extractDataFromElement(element, schema, cleanData) {
  const result = {};

  for (const [key, config] of Object.entries(schema)) {
    try {
      let value;

      if (typeof config === 'string') {
        // 简单选择器
        const targetEl = element.querySelector(config);
        value = targetEl?.textContent || '';
      } else if (typeof config === 'object' && config.selector) {
        // 带属性的选择器
        const targetEl = element.querySelector(config.selector);
        if (config.attribute) {
          value = targetEl?.getAttribute(config.attribute) || '';
        } else {
          value = targetEl?.textContent || '';
        }
      }

      result[key] = cleanData && typeof value === 'string' ? value.trim() : value;
    } catch (error) {
      result[key] = null;
    }
  }

  return result;
}

/**
 * 提取表格数据
 */
function extractTableData(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  
  if (rows.length === 0) return [];

  // 获取表头
  const headers = Array.from(rows[0].querySelectorAll('th, td'))
    .map(th => th.textContent?.trim() || '');

  // 提取数据行
  return rows.slice(1).map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const rowData = {};
    
    cells.forEach((cell, index) => {
      const header = headers[index] || `column_${index}`;
      rowData[header] = cell.textContent?.trim() || '';
    });
    
    return rowData;
  });
}

/**
 * 高亮元素（用于调试）
 */
function highlightElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.outline = '2px solid red';
    setTimeout(() => {
      element.style.outline = '';
    }, 2000);
  }
}

// 通知background script内容脚本已加载
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });

# iCrawler 节点开发指南

## 节点类型概览

iCrawler提供了丰富的节点类型，用于构建强大的浏览器自动化工作流。

## 浏览器自动化节点

### 1. BrowserAction

**用途**: 执行各种浏览器操作

**支持的操作**:
- `navigate`: 导航到URL
- `click`: 点击元素
- `type`: 输入文本
- `waitForElement`: 等待元素出现
- `getText`: 获取元素文本
- `executeScript`: 执行JavaScript代码
- `screenshot`: 截图

**示例配置**:
```json
{
  "type": "browserAction",
  "data": {
    "action": "navigate",
    "url": "https://example.com"
  }
}
```

### 2. ElementExists

**用途**: 检查页面元素是否存在

**参数**:
- `selector`: CSS选择器
- `timeout`: 超时时间（毫秒）
- `invert`: 是否反转结果

**示例配置**:
```json
{
  "type": "elementExists",
  "data": {
    "selector": ".product-list",
    "timeout": 5000,
    "invert": false
  }
}
```

### 3. LoopElements

**用途**: 循环处理页面上的多个元素

**支持的操作**:
- `getText`: 获取每个元素的文本
- `getAttribute`: 获取元素属性
- `getHTML`: 获取HTML内容
- `clickAll`: 点击所有元素
- `getData`: 使用自定义规则提取数据

**示例配置**:
```json
{
  "type": "loopElements",
  "data": {
    "selector": ".product-item",
    "action": "getData",
    "dataRules": {
      "title": ".title",
      "price": ".price",
      "image": {
        "selector": "img",
        "attribute": "src"
      }
    },
    "maxElements": 20
  }
}
```

### 4. ExecuteJavaScript

**用途**: 在页面上下文中执行自定义JavaScript代码

**参数**:
- `jsCode`: JavaScript代码
- `passInputData`: 是否传递输入数据
- `timeout`: 超时时间
- `returnType`: 返回类型（auto/json/string/number）

**示例配置**:
```json
{
  "type": "executeJavaScript",
  "data": {
    "jsCode": "return document.querySelectorAll('.item').length;",
    "passInputData": false,
    "returnType": "number"
  }
}
```

### 5. Screenshot

**用途**: 对页面或元素进行截图

**截图类型**:
- `fullPage`: 完整页面
- `viewport`: 可见区域
- `element`: 特定元素

**支持格式**:
- PNG (无损)
- JPEG (有损)
- WebP (现代格式)

**输出模式**:
- `base64`: Base64编码字符串
- `binary`: 二进制数据
- `dataUrl`: Data URL格式

**示例配置**:
```json
{
  "type": "screenshot",
  "data": {
    "screenshotType": "fullPage",
    "format": "png",
    "outputMode": "base64",
    "fileName": "screenshot.png"
  }
}
```

## 数据处理节点

### 1. DataMapper

**用途**: 数据映射和转换

**参数**:
- `mappingRules`: JSON映射规则
- `keepOriginal`: 是否保留原始数据

**示例配置**:
```json
{
  "type": "dataMapper",
  "data": {
    "mappingRules": {
      "productName": "title",
      "productPrice": "price",
      "timestamp": "new Date().toISOString()"
    },
    "keepOriginal": false
  }
}
```

### 2. DataCollector

**用途**: 从页面中提取和收集结构化数据

**收集模式**:
- `single`: 单个元素
- `multiple`: 多个元素
- `table`: 表格数据
- `schema`: 自定义模式

**示例配置**:
```json
{
  "type": "dataCollector",
  "data": {
    "collectionMode": "multiple",
    "rootSelector": ".product",
    "dataSchema": {
      "title": ".title",
      "price": ".price",
      "description": ".description"
    },
    "maxItems": 100,
    "includeMetadata": true,
    "cleanData": true
  }
}
```

### 3. ExportData

**用途**: 将数据导出为各种格式

**支持格式**:
- `json`: JSON文件
- `csv`: CSV文件
- `txt`: 文本文件
- `jsonl`: JSON Lines格式

**示例配置**:
```json
{
  "type": "exportData",
  "data": {
    "format": "json",
    "filePath": "./output/data.json",
    "dataField": "collectedData",
    "prettyPrint": true,
    "createDirectory": true
  }
}
```

## BrowserWorkflowService API参考

### 页面管理

```typescript
// 创建新页面
const page = await browserService.createPage();

// 获取当前页面
const currentPage = await browserService.getCurrentPage();

// 切换页面
await browserService.switchToPage(tabId);

// 关闭页面
await browserService.closePage(tabId);
```

### 导航操作

```typescript
// 导航到URL
await browserService.navigateTo('https://example.com');

// 刷新页面
await browserService.reload();

// 返回上一页
await browserService.goBack();

// 前进到下一页
await browserService.goForward();
```

### 元素操作

```typescript
// 等待元素
await browserService.waitForElement('.selector', 5000);

// 点击元素
await browserService.clickElement('.button');

// 输入文本
await browserService.typeText('input', 'text');

// 获取元素文本
const text = await browserService.getElementText('.element');

// 获取元素HTML
const html = await browserService.getElementHTML('.element');

// 获取元素属性
const attr = await browserService.getElementAttribute('.element', 'href');

// 鼠标悬停
await browserService.hoverElement('.element');

// 滚动到元素
await browserService.scrollToElement('.element');
```

### 元素查询

```typescript
// 获取多个元素
const elements = await browserService.getElements('.items');

// 检查元素是否存在
const exists = await browserService.elementExists('.element', 5000);
```

### 页面信息

```typescript
// 获取当前URL
const url = await browserService.getCurrentUrl();

// 获取页面标题
const title = await browserService.getPageTitle();
```

### Cookie管理

```typescript
// 设置Cookie
await browserService.setCookies([
  { name: 'token', value: 'abc123', domain: 'example.com' }
]);

// 获取Cookie
const cookies = await browserService.getCookies();

// 清除Cookie
await browserService.clearCookies();
```

### 其他功能

```typescript
// 执行JavaScript
const result = await browserService.executeScript('return document.title');

// 截图
const screenshot = await browserService.takeScreenshot({ fullPage: true });

// 选择下拉框选项
await browserService.selectOption('select', 'value');

// 等待指定时间
await browserService.wait(1000);
```

## 工作流示例

### 基础抓取工作流

```json
{
  "name": "Basic Scraping",
  "nodes": [
    {
      "id": "1",
      "type": "browserAction",
      "data": {
        "action": "navigate",
        "url": "https://example.com"
      }
    },
    {
      "id": "2",
      "type": "dataCollector",
      "data": {
        "collectionMode": "multiple",
        "rootSelector": ".item",
        "dataSchema": {
          "title": ".title",
          "price": ".price"
        }
      }
    },
    {
      "id": "3",
      "type": "exportData",
      "data": {
        "format": "json",
        "filePath": "./output/data.json"
      }
    }
  ],
  "edges": [
    { "source": "1", "target": "2" },
    { "source": "2", "target": "3" }
  ]
}
```

### 高级抓取工作流

查看 `examples/advanced-scraping-example.json` 获取包含以下功能的完整示例：
- 页面导航和验证
- 元素循环处理
- 数据收集和转换
- JavaScript执行
- 截图
- 多格式数据导出

## 最佳实践

### 1. 错误处理

始终使用 `continueOnFail` 选项来处理可能的错误：

```typescript
if (this.continueOnFail()) {
  returnData.push({
    json: {
      ...items[itemIndex].json,
      error: error.message,
    },
  });
} else {
  throw error;
}
```

### 2. 等待策略

合理设置等待时间，避免过长或过短：

```typescript
// 等待元素出现
await browserService.waitForElement('.element', 5000);

// 等待导航完成
await browserService.waitForNavigation({ waitUntil: 'networkidle2' });
```

### 3. 数据清理

使用 `cleanData` 选项清理提取的数据：

```json
{
  "type": "dataCollector",
  "data": {
    "cleanData": true
  }
}
```

### 4. 资源管理

确保在工作流结束时清理浏览器资源：

```typescript
try {
  // 执行工作流
} finally {
  await browserService.cleanup();
}
```

## 调试技巧

### 1. 使用日志

```typescript
import { Logger } from '@icrawler/core';

Logger.info('Starting workflow');
Logger.debug('Processing item', item);
Logger.error('Error occurred', error);
```

### 2. 截图调试

在关键步骤添加截图节点，帮助调试：

```json
{
  "type": "screenshot",
  "data": {
    "screenshotType": "fullPage",
    "fileName": "debug-step-1.png"
  }
}
```

### 3. 数据检查

使用 `executeJavaScript` 节点检查页面状态：

```json
{
  "type": "executeJavaScript",
  "data": {
    "jsCode": "console.log(document.body.innerHTML); return true;"
  }
}
```

## 性能优化

### 1. 限制元素数量

```json
{
  "type": "loopElements",
  "data": {
    "maxElements": 50
  }
}
```

### 2. 使用选择器缓存

避免重复查询相同的元素。

### 3. 并行处理

利用n8n的并行执行能力处理独立的任务。

### 4. 合理使用截图

只在必要时使用截图功能，避免性能开销。

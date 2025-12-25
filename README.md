# iCrawler - 浏览器自动化工作流引擎

基于n8n架构重构的浏览器自动化工具，保留automa核心功能，使用n8n的节点系统和工作流引擎。

## 项目特色

- 🚀 **n8n核心引擎**: 使用企业级工作流执行引擎
- 🌐 **浏览器自动化**: 专为网页自动化设计的节点系统
- 🔧 **模块化架构**: 可扩展的节点插件系统
- 📊 **数据流管理**: 强大的数据处理和状态管理
- 🎯 **向后兼容**: 保持automa的核心功能和用户体验

## 架构概览

```
icrawler/
├── packages/
│   ├── core/                 # 核心工作流引擎（基于n8n）
│   ├── nodes-browser/        # 浏览器自动化节点
│   ├── nodes-data/          # 数据处理节点
│   ├── frontend/            # 用户界面
│   └── cli/                 # 命令行工具
├── docs/                    # 文档
└── examples/               # 示例工作流
```

## 核心节点类型

### 浏览器自动化节点

#### BrowserAction
执行各种浏览器操作：
- **Navigate**: 导航到URL
- **Click**: 点击元素
- **Type**: 输入文本
- **Wait For Element**: 等待元素出现
- **Get Text**: 获取元素文本
- **Execute Script**: 执行JavaScript代码
- **Screenshot**: 截图

#### ElementExists
检查页面元素是否存在，支持超时和结果反转。

#### LoopElements
循环处理页面上的多个元素：
- **Get Text**: 获取每个元素的文本
- **Get Attribute**: 获取元素属性
- **Get HTML**: 获取HTML内容
- **Click All**: 点击所有元素
- **Get Data**: 使用自定义规则提取结构化数据

#### ExecuteJavaScript
在页面上下文中执行自定义JavaScript代码：
- 支持传递输入数据
- 多种返回类型（Auto、JSON、String、Number）
- 完整的页面DOM访问

#### Screenshot
专业的截图节点：
- **Full Page**: 完整页面截图
- **Viewport**: 可见区域截图
- **Element**: 特定元素截图
- 支持PNG、JPEG、WebP格式
- 多种输出模式（Base64、Binary、Data URL）

### 数据处理节点

#### DataMapper
数据映射和转换，支持JSON映射规则和保留原始数据选项。

#### DataCollector
从页面中提取和收集结构化数据：
- **Single Element**: 单个元素数据提取
- **Multiple Elements**: 批量元素数据提取
- **Table**: 表格数据提取
- **Custom Schema**: 自定义数据模式提取
- 支持元数据和数据清理

#### ExportData
数据导出节点：
- **JSON**: 导出为JSON文件（支持格式化）
- **CSV**: 导出为CSV文件（可自定义分隔符）
- **TXT**: 导出为文本文件
- **JSONL**: 导出为JSON Lines格式
- 支持追加模式和自动创建目录

### 控制流节点
- **IfElse**: 条件分支（复用n8n）
- **Loop**: 循环控制
- **Wait**: 等待和延迟
- **Trigger**: 工作流触发器

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建项目
```bash
pnpm build
```

## 使用示例

### 基础网页抓取工作流

```json
{
  "name": "Basic Web Scraping",
  "nodes": [
    {
      "type": "browserAction",
      "data": {
        "action": "navigate",
        "url": "https://example.com"
      }
    },
    {
      "type": "dataCollector",
      "data": {
        "collectionMode": "multiple",
        "rootSelector": ".product",
        "dataSchema": {
          "title": ".title",
          "price": ".price"
        }
      }
    },
    {
      "type": "exportData",
      "data": {
        "format": "json",
        "filePath": "./output/products.json"
      }
    }
  ]
}
```

### 高级数据提取工作流

查看 `examples/advanced-scraping-example.json` 获取完整示例，包括：
- 页面导航和元素检查
- 循环处理多个元素
- 数据收集和转换
- JavaScript执行和计算
- 截图和数据导出

## BrowserWorkflowService API

核心浏览器服务提供了丰富的API：

### 页面管理
- `createPage()`: 创建新页面
- `getCurrentPage()`: 获取当前页面
- `switchToPage(tabId)`: 切换页面
- `closePage(tabId)`: 关闭页面

### 导航操作
- `navigateTo(url)`: 导航到URL
- `reload()`: 刷新页面
- `goBack()`: 返回上一页
- `goForward()`: 前进到下一页

### 元素操作
- `waitForElement(selector)`: 等待元素
- `clickElement(selector)`: 点击元素
- `typeText(selector, text)`: 输入文本
- `getElementText(selector)`: 获取元素文本
- `getElementHTML(selector)`: 获取元素HTML
- `getElementAttribute(selector, attr)`: 获取元素属性
- `hoverElement(selector)`: 鼠标悬停
- `scrollToElement(selector)`: 滚动到元素

### 元素查询
- `getElements(selector)`: 获取多个元素
- `elementExists(selector)`: 检查元素是否存在

### 页面信息
- `getCurrentUrl()`: 获取当前URL
- `getPageTitle()`: 获取页面标题

### Cookie管理
- `setCookies(cookies)`: 设置Cookie
- `getCookies()`: 获取Cookie
- `clearCookies()`: 清除Cookie

### 其他功能
- `executeScript(script)`: 执行JavaScript
- `takeScreenshot(options)`: 截图
- `selectOption(selector, value)`: 选择下拉框选项
- `wait(milliseconds)`: 等待指定时间

## 开发指南

### 创建新节点

1. 在 `packages/nodes-browser` 或 `packages/nodes-data` 中创建节点文件
2. 实现 `INodeType` 接口
3. 在对应的 `index.ts` 中导出节点

```typescript
import type {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
} from 'n8n-workflow';

export class MyCustomNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Custom Node',
    name: 'myCustomNode',
    group: ['browser'],
    version: 1,
    description: 'Custom browser automation node',
    defaults: {
      name: 'My Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      // 节点属性配置
    ],
  };

  async execute(this: IExecuteFunctions) {
    // 节点执行逻辑
  }
}
```

### 使用浏览器服务

```typescript
import { BrowserWorkflowService } from '@icrawler/core';

class MyBrowserNode {
  async execute(this: IExecuteFunctions) {
    const browserService = new BrowserWorkflowService(this.getWorkflowData());
    
    // 执行浏览器操作
    await browserService.navigateTo('https://example.com');
    await browserService.clickElement('.button');
    const text = await browserService.getElementText('.result');
    
    return items;
  }
}
```

## 与automa的对比

| 特性 | automa | iCrawler |
|------|--------|----------|
| 工作流引擎 | 自定义引擎 | n8n企业级引擎 |
| 节点系统 | 块处理器 | 标准化节点接口 |
| 扩展性 | 有限 | 高度可扩展 |
| 数据处理 | 基础 | 强大 |
| 错误处理 | 简单 | 完善 |
| 并行执行 | 不支持 | 支持 |
| 企业功能 | 无 | 完整支持 |
| 数据导出 | 基础 | 多格式支持 |
| JavaScript执行 | 有限 | 完整支持 |

## 项目状态

### ✅ 已完成功能

- [x] 核心工作流引擎（基于n8n）
- [x] BrowserAction节点（导航、点击、输入等）
- [x] ElementExists节点（元素检查）
- [x] LoopElements节点（元素循环）
- [x] ExecuteJavaScript节点（脚本执行）
- [x] Screenshot节点（截图）
- [x] DataMapper节点（数据映射）
- [x] DataCollector节点（数据收集）
- [x] ExportData节点（数据导出）
- [x] BrowserWorkflowService（浏览器服务）
- [x] 完整的示例工作流

### 📝 待实现功能

- [ ] 前端可视化编辑器
- [ ] CLI命令行工具
- [ ] 工作流调度功能
- [ ] 更多集成节点
- [ ] 插件系统
- [ ] 云部署支持

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页: [https://github.com/heyongxian/iCrawler](https://github.com/heyongxian/iCrawler)
- 问题反馈: [Issues](https://github.com/heyongxian/iCrawler/issues)

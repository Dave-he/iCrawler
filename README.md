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
- **BrowserAction**: 浏览器操作（点击、输入、导航等）
- **ElementExists**: 元素存在性检查
- **LoopElements**: 元素循环处理
- **ExecuteJavaScript**: 执行JavaScript代码
- **ElementSelector**: 元素选择器
- **Screenshot**: 截图功能

### 数据处理节点
- **DataMapper**: 数据映射和转换
- **VariableManager**: 变量管理
- **DataCollector**: 数据收集
- **ExportData**: 数据导出

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

## 开发指南

### 创建新节点

1. 在 `packages/nodes-browser` 或 `packages/nodes-data` 中创建节点文件
2. 实现 `INodeType` 接口
3. 导出节点配置

```typescript
import { INodeType, INodeTypeDescription } from 'n8n-workflow';

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

### 浏览器API集成

使用专门的浏览器服务来处理浏览器操作：

```typescript
import { BrowserAPIService } from './services/browser-api';

class BrowserActionNode {
  async execute(this: IExecuteFunctions) {
    const browser = new BrowserAPIService();
    
    // 执行浏览器操作
    await browser.click(selector);
    await browser.type(selector, text);
    
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
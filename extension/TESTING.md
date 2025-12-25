# iCrawler 浏览器扩展安装和测试指南

## 快速开始

### 1. 生成图标文件

1. 在浏览器中打开 `extension/generate-icons.html`
2. 点击"下载所有图标"按钮
3. 将下载的4个PNG文件保存到 `extension/icons/` 目录

或者使用命令行（需要安装ImageMagick）：
```bash
cd extension/icons
# 如果有convert命令
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

### 2. 在Chrome中加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择 `iCrawler/extension` 文件夹
6. 点击"选择文件夹"

### 3. 验证安装

扩展应该出现在扩展列表中，显示：
- 名称: iCrawler - Browser Automation
- 版本: 1.0.0
- 状态: 已启用

### 4. 固定到工具栏

1. 点击浏览器工具栏右侧的拼图图标（扩展）
2. 找到"iCrawler - Browser Automation"
3. 点击图钉图标将其固定到工具栏

## 测试扩展功能

### 测试1: 打开Popup界面

1. 点击工具栏中的iCrawler图标
2. 应该看到一个弹出窗口，显示：
   - 标题: "🤖 iCrawler"
   - 状态: "Ready"
   - 按钮: New Workflow, Execute Workflow等

### 测试2: 创建工作流

1. 点击"New Workflow"按钮
2. 输入工作流名称，例如: "Test Workflow"
3. 输入描述: "My first workflow"
4. 点击"Save Workflow"
5. 应该看到成功提示，并返回主界面
6. 工作流列表中应该显示新创建的工作流

### 测试3: 快速截图

1. 打开任意网页（例如: https://example.com）
2. 点击iCrawler图标打开popup
3. 点击"Take Screenshot"按钮
4. 应该自动下载一个PNG截图文件
5. 状态显示"Screenshot saved"

### 测试4: 快速抓取

1. 打开一个包含列表的网页（例如: https://news.ycombinator.com）
2. 点击iCrawler图标
3. 点击"Quick Scrape"按钮
4. 在弹出的对话框中输入CSS选择器，例如: `.titleline`
5. 点击确定
6. 打开浏览器控制台（F12）查看抓取的数据
7. 应该看到类似 "Scraped X items" 的提示

### 测试5: 执行工作流

1. 创建一个简单的工作流JSON:
```json
{
  "nodes": [
    {
      "type": "browserAction",
      "data": {
        "action": "getText",
        "selector": "h1",
        "timeout": 5000
      }
    }
  ]
}
```

2. 在"New Workflow"界面粘贴上述JSON
3. 保存工作流
4. 打开任意网页
5. 在工作流列表中选择该工作流
6. 点击"Execute Workflow"
7. 查看执行结果

## 调试技巧

### 查看Background Script日志

1. 访问 `chrome://extensions/`
2. 找到iCrawler扩展
3. 点击"service worker"链接
4. 在打开的DevTools中查看日志

### 查看Content Script日志

1. 在任意网页按F12打开DevTools
2. 切换到Console标签
3. 应该看到 "iCrawler content script loaded" 消息

### 查看Popup日志

1. 右键点击iCrawler图标
2. 选择"检查弹出内容"
3. 在DevTools中查看日志

## 常见问题

### Q: 扩展无法加载
A: 
- 确保已启用开发者模式
- 检查是否有图标文件缺失
- 查看Chrome扩展页面的错误信息

### Q: 点击图标没有反应
A: 
- 检查popup/index.html是否存在
- 查看是否有JavaScript错误
- 尝试重新加载扩展

### Q: 工作流执行失败
A:
- 打开DevTools查看错误信息
- 确保CSS选择器正确
- 检查网页是否完全加载

### Q: 快速抓取返回空数据
A:
- 验证CSS选择器是否匹配页面元素
- 在DevTools中手动测试选择器: `document.querySelectorAll('selector')`
- 确认页面内容不是动态加载的

## 测试用例

### 测试用例1: 基础导航
```json
{
  "name": "Navigate Test",
  "nodes": [
    {
      "type": "browserAction",
      "data": {
        "action": "navigate",
        "url": "https://example.com"
      }
    }
  ]
}
```

### 测试用例2: 数据抓取
```json
{
  "name": "Data Collection Test",
  "nodes": [
    {
      "type": "dataCollector",
      "data": {
        "collectionMode": "single",
        "rootSelector": "body",
        "dataSchema": "{\"title\": \"h1\", \"text\": \"p\"}",
        "cleanData": true
      }
    }
  ]
}
```

### 测试用例3: 元素循环
```json
{
  "name": "Loop Test",
  "nodes": [
    {
      "type": "loopElements",
      "data": {
        "selector": "a",
        "action": "getAttribute",
        "attributeName": "href",
        "maxElements": 10
      }
    }
  ]
}
```

## 性能测试

1. **内存使用**: 
   - 打开Chrome任务管理器（Shift+Esc）
   - 查看iCrawler扩展的内存占用

2. **执行速度**:
   - 测试简单工作流的执行时间
   - 应该在1秒内完成

3. **并发测试**:
   - 在多个标签页中同时使用扩展
   - 验证不会相互干扰

## 下一步

扩展安装成功后，你可以：

1. 创建更复杂的工作流
2. 测试所有节点类型
3. 在实际网站上进行抓取测试
4. 根据需要调整和优化代码

## 反馈和改进

如果发现问题或有改进建议：
1. 记录错误信息和复现步骤
2. 在GitHub Issues中提交
3. 或直接修改代码并测试

祝测试顺利！🎉

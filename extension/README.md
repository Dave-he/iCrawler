# iCrawler Browser Extension

## 安装说明

### 方法一：开发者模式加载（推荐用于测试）

1. **打开Chrome扩展管理页面**
   - 在Chrome浏览器中访问 `chrome://extensions/`
   - 或者点击菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 在页面右上角打开"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"按钮
   - 选择 `iCrawler/extension` 文件夹
   - 点击"选择文件夹"

4. **验证安装**
   - 扩展应该出现在扩展列表中
   - 点击浏览器工具栏中的拼图图标，找到iCrawler
   - 点击图钉图标将其固定到工具栏

### 方法二：打包安装

1. **打包扩展**
   ```bash
   cd iCrawler/extension
   # Chrome会自动打包，或使用以下命令
   zip -r icrawler-extension.zip . -x "*.git*" -x "node_modules/*"
   ```

2. **在Chrome中安装**
   - 访问 `chrome://extensions/`
   - 启用开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择extension文件夹

## 目录结构

```
extension/
├── manifest.json           # 扩展配置文件
├── background/
│   └── service-worker.js  # 后台服务脚本
├── content/
│   └── content-script.js  # 内容脚本
├── popup/
│   ├── index.html         # 弹出窗口HTML
│   └── popup.js           # 弹出窗口脚本
└── icons/
    ├── icon.svg           # SVG图标
    ├── icon-16.png        # 16x16图标（需要生成）
    ├── icon-32.png        # 32x32图标（需要生成）
    ├── icon-48.png        # 48x48图标（需要生成）
    └── icon-128.png       # 128x128图标（需要生成）
```

## 生成PNG图标

由于manifest.json需要PNG格式的图标，你需要将SVG转换为PNG：

### 使用在线工具
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传 `icons/icon.svg`
3. 分别生成 16x16、32x32、48x48、128x128 尺寸的PNG
4. 保存到 `icons/` 目录

### 使用命令行工具（需要安装ImageMagick）
```bash
cd extension/icons
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

## 使用指南

### 1. 打开扩展
- 点击浏览器工具栏中的iCrawler图标
- 弹出窗口会显示扩展界面

### 2. 创建工作流
- 点击"New Workflow"按钮
- 输入工作流名称和描述
- （可选）粘贴工作流JSON配置
- 点击"Save Workflow"保存

### 3. 执行工作流
- 在工作流列表中选择一个工作流
- 点击"Execute Workflow"按钮
- 等待执行完成，查看状态提示

### 4. 快速操作

#### 快速抓取
- 点击"Quick Scrape"按钮
- 输入CSS选择器（如 `.item`）
- 扩展会自动抓取页面数据
- 结果会显示在浏览器控制台

#### 快速截图
- 点击"Take Screenshot"按钮
- 扩展会自动截取当前可见区域
- 截图会自动下载

## 工作流JSON格式

```json
{
  "name": "My Workflow",
  "description": "Workflow description",
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
        "rootSelector": ".item",
        "dataSchema": "{\"title\": \".title\", \"price\": \".price\"}",
        "maxItems": 100
      }
    }
  ]
}
```

## 支持的节点类型

### browserAction
浏览器操作节点
- `navigate`: 导航到URL
- `click`: 点击元素
- `type`: 输入文本
- `getText`: 获取文本
- `waitForElement`: 等待元素

### elementExists
检查元素是否存在

### dataCollector
数据收集节点
- `single`: 单个元素
- `multiple`: 多个元素
- `table`: 表格数据
- `schema`: 自定义模式

### loopElements
元素循环处理
- `getText`: 获取文本
- `getAttribute`: 获取属性
- `getHTML`: 获取HTML
- `clickAll`: 点击所有
- `getData`: 提取数据

### executeJavaScript
执行JavaScript代码

### screenshot
截图功能
- `fullPage`: 全页面
- `viewport`: 可见区域
- `element`: 特定元素

## 调试

### 查看日志
1. 打开Chrome开发者工具（F12）
2. 切换到"Console"标签
3. 查看扩展输出的日志

### 调试Background Script
1. 访问 `chrome://extensions/`
2. 找到iCrawler扩展
3. 点击"service worker"链接
4. 在打开的开发者工具中查看日志

### 调试Content Script
1. 在任意网页上按F12打开开发者工具
2. 在Console中查看content script的日志
3. 日志会以"iCrawler"开头

### 调试Popup
1. 右键点击扩展图标
2. 选择"检查弹出内容"
3. 在打开的开发者工具中调试

## 权限说明

扩展需要以下权限：
- `storage`: 存储工作流数据
- `tabs`: 访问标签页信息
- `activeTab`: 访问当前活动标签页
- `scripting`: 在页面中注入脚本
- `webNavigation`: 监听页面导航
- `cookies`: 访问Cookie
- `downloads`: 下载文件（截图等）
- `<all_urls>`: 在所有网站上运行

## 故障排除

### 扩展无法加载
- 确保已启用开发者模式
- 检查manifest.json格式是否正确
- 查看Chrome扩展页面的错误信息

### 工作流执行失败
- 检查浏览器控制台的错误信息
- 确保目标网站已完全加载
- 验证CSS选择器是否正确

### 数据抓取为空
- 检查CSS选择器是否匹配页面元素
- 确认页面是否使用动态加载
- 尝试增加等待时间

### 截图功能不工作
- 确保已授予必要的权限
- 检查是否有其他扩展冲突
- 尝试刷新页面后重试

## 更新扩展

1. 修改代码后，访问 `chrome://extensions/`
2. 找到iCrawler扩展
3. 点击刷新图标（🔄）重新加载扩展

## 卸载扩展

1. 访问 `chrome://extensions/`
2. 找到iCrawler扩展
3. 点击"移除"按钮

## 技术支持

- GitHub Issues: https://github.com/heyongxian/iCrawler/issues
- 文档: https://github.com/heyongxian/iCrawler/docs

## 许可证

MIT License

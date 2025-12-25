import { BrowserAction } from './nodes/BrowserAction.node';
import { ElementExists } from './nodes/ElementExists.node';
import { LoopElements } from './nodes/LoopElements.node';
import { ExecuteJavaScript } from './nodes/ExecuteJavaScript.node';
import { Screenshot } from './nodes/Screenshot.node';

// 导出所有浏览器自动化节点
export const browserNodes = [
  BrowserAction,
  ElementExists,
  LoopElements,
  ExecuteJavaScript,
  Screenshot,
];

// 节点类型映射
export const nodeTypeMap = {
  browserAction: BrowserAction,
  elementExists: ElementExists,
  loopElements: LoopElements,
  executeJavaScript: ExecuteJavaScript,
  screenshot: Screenshot,
};

export * from './nodes/BrowserAction.node';
export * from './nodes/ElementExists.node';
export * from './nodes/LoopElements.node';
export * from './nodes/ExecuteJavaScript.node';
export * from './nodes/Screenshot.node';
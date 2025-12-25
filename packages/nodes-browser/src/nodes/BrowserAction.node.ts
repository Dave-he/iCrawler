import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BrowserWorkflowService } from '@icrawler/core';

/**
 * 浏览器操作节点
 * 执行各种浏览器自动化操作：点击、输入、导航等
 */
export class BrowserAction implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Browser Action',
    name: 'browserAction',
    group: ['browser'],
    version: 1,
    description: 'Perform browser automation actions',
    defaults: {
      name: 'Browser Action',
      color: '#22409A',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        options: [
          {
            name: 'Navigate',
            value: 'navigate',
            description: 'Navigate to a URL',
          },
          {
            name: 'Click',
            value: 'click',
            description: 'Click an element',
          },
          {
            name: 'Type',
            value: 'type',
            description: 'Type text into an element',
          },
          {
            name: 'Wait For Element',
            value: 'waitForElement',
            description: 'Wait for an element to appear',
          },
          {
            name: 'Get Text',
            value: 'getText',
            description: 'Get text from an element',
          },
          {
            name: 'Execute Script',
            value: 'executeScript',
            description: 'Execute JavaScript in the page',
          },
          {
            name: 'Screenshot',
            value: 'screenshot',
            description: 'Take a screenshot',
          },
        ],
        default: 'navigate',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        displayOptions: {
          show: {
            action: ['navigate'],
          },
        },
        placeholder: 'https://example.com',
        default: '',
      },
      {
        displayName: 'Selector',
        name: 'selector',
        type: 'string',
        displayOptions: {
          show: {
            action: ['click', 'type', 'waitForElement', 'getText'],
          },
        },
        placeholder: '#element-id',
        default: '',
      },
      {
        displayName: 'Text to Type',
        name: 'text',
        type: 'string',
        displayOptions: {
          show: {
            action: ['type'],
          },
        },
        placeholder: 'Enter text here',
        default: '',
      },
      {
        displayName: 'Timeout (ms)',
        name: 'timeout',
        type: 'number',
        displayOptions: {
          show: {
            action: ['waitForElement'],
          },
        },
        typeOptions: {
          minValue: 1000,
          maxValue: 60000,
        },
        default: 5000,
      },
      {
        displayName: 'JavaScript Code',
        name: 'script',
        type: 'string',
        displayOptions: {
          show: {
            action: ['executeScript'],
          },
        },
        typeOptions: {
          alwaysOpenEditWindow: true,
          editor: 'jsEditor',
        },
        placeholder: 'return document.title;',
        default: '',
      },
      {
        displayName: 'Full Page Screenshot',
        name: 'fullPage',
        type: 'boolean',
        displayOptions: {
          show: {
            action: ['screenshot'],
          },
        },
        default: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // 获取浏览器服务
    const browserService = new BrowserWorkflowService(this.getWorkflowData());

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const action = this.getNodeParameter('action', itemIndex) as string;
        const page = await browserService.getCurrentPage();

        let result: any;

        switch (action) {
          case 'navigate': {
            const url = this.getNodeParameter('url', itemIndex) as string;
            if (!url) {
              throw new NodeOperationError(this.getNode(), 'URL is required for navigate action');
            }
            await browserService.navigateTo(url);
            result = { url, action: 'navigate' };
            break;
          }

          case 'click': {
            const selector = this.getNodeParameter('selector', itemIndex) as string;
            if (!selector) {
              throw new NodeOperationError(this.getNode(), 'Selector is required for click action');
            }
            await browserService.clickElement(selector);
            result = { selector, action: 'click' };
            break;
          }

          case 'type': {
            const selector = this.getNodeParameter('selector', itemIndex) as string;
            const text = this.getNodeParameter('text', itemIndex) as string;
            if (!selector || !text) {
              throw new NodeOperationError(this.getNode(), 'Selector and text are required for type action');
            }
            await browserService.typeText(selector, text);
            result = { selector, text, action: 'type' };
            break;
          }

          case 'waitForElement': {
            const selector = this.getNodeParameter('selector', itemIndex) as string;
            const timeout = this.getNodeParameter('timeout', itemIndex) as number;
            if (!selector) {
              throw new NodeOperationError(this.getNode(), 'Selector is required for waitForElement action');
            }
            await browserService.waitForElement(selector, timeout);
            result = { selector, timeout, action: 'waitForElement' };
            break;
          }

          case 'getText': {
            const selector = this.getNodeParameter('selector', itemIndex) as string;
            if (!selector) {
              throw new NodeOperationError(this.getNode(), 'Selector is required for getText action');
            }
            const text = await browserService.getElementText(selector);
            result = { selector, text, action: 'getText' };
            break;
          }

          case 'executeScript': {
            const script = this.getNodeParameter('script', itemIndex) as string;
            if (!script) {
              throw new NodeOperationError(this.getNode(), 'Script is required for executeScript action');
            }
            const scriptResult = await browserService.executeScript(script);
            result = { script, result: scriptResult, action: 'executeScript' };
            break;
          }

          case 'screenshot': {
            const fullPage = this.getNodeParameter('fullPage', itemIndex) as boolean;
            const screenshot = await browserService.takeScreenshot({ fullPage });
            result = { 
              action: 'screenshot',
              screenshot: screenshot.toString('base64'),
              fullPage 
            };
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Unknown action: ${action}`);
        }

        returnData.push({
          json: {
            ...items[itemIndex].json,
            browserResult: result,
          },
          pairedItem: {
            item: itemIndex,
          },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              ...items[itemIndex].json,
              error: error.message,
            },
            pairedItem: {
              item: itemIndex,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return this.prepareOutputData(returnData);
  }
}
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BrowserWorkflowService } from '@icrawler/core';

/**
 * 截图节点
 * 对页面或特定元素进行截图
 */
export class Screenshot implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Screenshot',
    name: 'screenshot',
    group: ['browser'],
    version: 1,
    description: 'Take screenshots of the page or specific elements',
    defaults: {
      name: 'Screenshot',
      color: '#9B59B6',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Screenshot Type',
        name: 'screenshotType',
        type: 'options',
        options: [
          {
            name: 'Full Page',
            value: 'fullPage',
            description: 'Capture the entire page',
          },
          {
            name: 'Viewport',
            value: 'viewport',
            description: 'Capture only the visible viewport',
          },
          {
            name: 'Element',
            value: 'element',
            description: 'Capture a specific element',
          },
        ],
        default: 'fullPage',
      },
      {
        displayName: 'Element Selector',
        name: 'selector',
        type: 'string',
        displayOptions: {
          show: {
            screenshotType: ['element'],
          },
        },
        placeholder: '#element-id',
        default: '',
        description: 'CSS selector of the element to screenshot',
      },
      {
        displayName: 'Image Format',
        name: 'format',
        type: 'options',
        options: [
          {
            name: 'PNG',
            value: 'png',
            description: 'PNG format (lossless)',
          },
          {
            name: 'JPEG',
            value: 'jpeg',
            description: 'JPEG format (lossy)',
          },
          {
            name: 'WebP',
            value: 'webp',
            description: 'WebP format (modern)',
          },
        ],
        default: 'png',
      },
      {
        displayName: 'Quality',
        name: 'quality',
        type: 'number',
        displayOptions: {
          show: {
            format: ['jpeg', 'webp'],
          },
        },
        typeOptions: {
          minValue: 0,
          maxValue: 100,
        },
        default: 80,
        description: 'Image quality (0-100, only for JPEG and WebP)',
      },
      {
        displayName: 'Output Mode',
        name: 'outputMode',
        type: 'options',
        options: [
          {
            name: 'Base64',
            value: 'base64',
            description: 'Return as base64 encoded string',
          },
          {
            name: 'Binary',
            value: 'binary',
            description: 'Return as binary data',
          },
          {
            name: 'Data URL',
            value: 'dataUrl',
            description: 'Return as data URL',
          },
        ],
        default: 'base64',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        placeholder: 'screenshot.png',
        default: 'screenshot.png',
        description: 'Name for the screenshot file',
      },
      {
        displayName: 'Omit Background',
        name: 'omitBackground',
        type: 'boolean',
        default: false,
        description: 'Whether to make the background transparent (PNG only)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const browserService = new BrowserWorkflowService(this.getWorkflowData());

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const screenshotType = this.getNodeParameter('screenshotType', itemIndex) as string;
        const format = this.getNodeParameter('format', itemIndex) as 'png' | 'jpeg' | 'webp';
        const outputMode = this.getNodeParameter('outputMode', itemIndex) as string;
        const fileName = this.getNodeParameter('fileName', itemIndex) as string;
        const omitBackground = this.getNodeParameter('omitBackground', itemIndex) as boolean;

        const page = await browserService.getCurrentPage();

        let screenshotBuffer: Buffer;
        const screenshotOptions: any = {
          type: format,
          omitBackground: format === 'png' ? omitBackground : false,
        };

        // 添加质量参数（仅用于JPEG和WebP）
        if (format === 'jpeg' || format === 'webp') {
          const quality = this.getNodeParameter('quality', itemIndex) as number;
          screenshotOptions.quality = quality;
        }

        // 根据截图类型执行不同的截图操作
        switch (screenshotType) {
          case 'fullPage': {
            screenshotOptions.fullPage = true;
            screenshotBuffer = await page.screenshot(screenshotOptions) as Buffer;
            break;
          }

          case 'viewport': {
            screenshotOptions.fullPage = false;
            screenshotBuffer = await page.screenshot(screenshotOptions) as Buffer;
            break;
          }

          case 'element': {
            const selector = this.getNodeParameter('selector', itemIndex) as string;
            if (!selector) {
              throw new NodeOperationError(this.getNode(), 'Selector is required for element screenshot');
            }

            await browserService.waitForElement(selector);
            const element = await page.$(selector);
            if (!element) {
              throw new NodeOperationError(this.getNode(), `Element not found: ${selector}`);
            }

            screenshotBuffer = await element.screenshot(screenshotOptions) as Buffer;
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Unknown screenshot type: ${screenshotType}`);
        }

        // 根据输出模式处理截图数据
        let screenshotData: any;
        let mimeType = `image/${format}`;

        switch (outputMode) {
          case 'base64':
            screenshotData = screenshotBuffer.toString('base64');
            break;

          case 'dataUrl':
            screenshotData = `data:${mimeType};base64,${screenshotBuffer.toString('base64')}`;
            break;

          case 'binary':
            screenshotData = screenshotBuffer;
            break;

          default:
            screenshotData = screenshotBuffer.toString('base64');
        }

        returnData.push({
          json: {
            ...items[itemIndex].json,
            screenshot: outputMode === 'binary' ? undefined : screenshotData,
            fileName,
            format,
            screenshotType,
            size: screenshotBuffer.length,
            mimeType,
          },
          binary: outputMode === 'binary' ? {
            data: {
              data: screenshotBuffer.toString('base64'),
              mimeType,
              fileName,
            },
          } : undefined,
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

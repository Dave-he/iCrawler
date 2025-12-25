import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * 元素存在性检查节点
 * 检查指定元素是否存在
 */
export class ElementExists implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Element Exists',
    name: 'elementExists',
    group: ['browser'],
    version: 1,
    description: 'Check if an element exists on the page',
    defaults: {
      name: 'Element Exists',
      color: '#4099FF',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Selector',
        name: 'selector',
        type: 'string',
        placeholder: '#element-id',
        default: '',
        description: 'CSS selector to check for element existence',
      },
      {
        displayName: 'Timeout (ms)',
        name: 'timeout',
        type: 'number',
        typeOptions: {
          minValue: 1000,
          maxValue: 60000,
        },
        default: 5000,
        description: 'Maximum time to wait for element to appear',
      },
      {
        displayName: 'Invert Result',
        name: 'invert',
        type: 'boolean',
        default: false,
        description: 'Return true if element does NOT exist',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const selector = this.getNodeParameter('selector', itemIndex) as string;
        const timeout = this.getNodeParameter('timeout', itemIndex) as number;
        const invert = this.getNodeParameter('invert', itemIndex) as boolean;

        if (!selector) {
          throw new NodeOperationError(this.getNode(), 'Selector is required');
        }

        // 这里需要访问浏览器服务，暂时模拟实现
        // 实际实现中会通过 IExecuteFunctions 访问浏览器服务
        const elementExists = await this.checkElementExists(selector, timeout);
        const result = invert ? !elementExists : elementExists;

        returnData.push({
          json: {
            ...items[itemIndex].json,
            elementExists: result,
            selector,
            timeout,
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
              elementExists: false,
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

  /**
   * 模拟元素检查方法
   * 实际实现中会通过浏览器服务检查元素
   */
  private async checkElementExists(selector: string, timeout: number): Promise<boolean> {
    // 这里应该通过浏览器服务检查元素
    // 暂时返回模拟结果
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.5); // 模拟50%的成功率
      }, Math.min(timeout, 1000));
    });
  }
}
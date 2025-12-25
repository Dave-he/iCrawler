import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BrowserWorkflowService } from '@icrawler/core';

/**
 * JavaScript执行节点
 * 在页面上下文中执行自定义JavaScript代码
 */
export class ExecuteJavaScript implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Execute JavaScript',
    name: 'executeJavaScript',
    group: ['browser'],
    version: 1,
    description: 'Execute custom JavaScript code in the page context',
    defaults: {
      name: 'Execute JavaScript',
      color: '#F7DF1E',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'JavaScript Code',
        name: 'jsCode',
        type: 'string',
        typeOptions: {
          alwaysOpenEditWindow: true,
          editor: 'jsEditor',
          rows: 10,
        },
        placeholder: `// Access page elements and return data
const title = document.querySelector('h1').textContent;
const links = Array.from(document.querySelectorAll('a')).map(a => ({
  text: a.textContent,
  href: a.href
}));

return { title, links };`,
        default: '',
        description: 'JavaScript code to execute in the page context',
        required: true,
      },
      {
        displayName: 'Pass Input Data',
        name: 'passInputData',
        type: 'boolean',
        default: false,
        description: 'Whether to pass input data to the script as a variable named "inputData"',
      },
      {
        displayName: 'Timeout (ms)',
        name: 'timeout',
        type: 'number',
        typeOptions: {
          minValue: 1000,
          maxValue: 300000,
        },
        default: 30000,
        description: 'Maximum time to wait for script execution',
      },
      {
        displayName: 'Return Type',
        name: 'returnType',
        type: 'options',
        options: [
          {
            name: 'Auto',
            value: 'auto',
            description: 'Automatically detect return type',
          },
          {
            name: 'JSON',
            value: 'json',
            description: 'Parse result as JSON',
          },
          {
            name: 'String',
            value: 'string',
            description: 'Convert result to string',
          },
          {
            name: 'Number',
            value: 'number',
            description: 'Convert result to number',
          },
        ],
        default: 'auto',
        description: 'How to handle the return value',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const browserService = new BrowserWorkflowService(this.getWorkflowData());

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const jsCode = this.getNodeParameter('jsCode', itemIndex) as string;
        const passInputData = this.getNodeParameter('passInputData', itemIndex) as boolean;
        const timeout = this.getNodeParameter('timeout', itemIndex) as number;
        const returnType = this.getNodeParameter('returnType', itemIndex) as string;

        if (!jsCode) {
          throw new NodeOperationError(this.getNode(), 'JavaScript code is required');
        }

        const page = await browserService.getCurrentPage();

        // 准备要传递给脚本的数据
        const inputData = passInputData ? items[itemIndex].json : undefined;

        // 执行JavaScript代码
        const result = await page.evaluate(
          (code, data) => {
            // 创建一个函数来执行代码
            const func = new Function('inputData', code);
            return func(data);
          },
          jsCode,
          inputData
        );

        // 根据返回类型处理结果
        let processedResult = result;
        switch (returnType) {
          case 'json':
            processedResult = typeof result === 'string' ? JSON.parse(result) : result;
            break;
          case 'string':
            processedResult = String(result);
            break;
          case 'number':
            processedResult = Number(result);
            break;
          case 'auto':
          default:
            processedResult = result;
            break;
        }

        returnData.push({
          json: {
            ...items[itemIndex].json,
            scriptResult: processedResult,
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

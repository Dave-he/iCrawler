import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BrowserWorkflowService } from '@icrawler/core';

/**
 * 元素循环处理节点
 * 查找页面上的多个元素并对每个元素执行操作
 */
export class LoopElements implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Loop Elements',
    name: 'loopElements',
    group: ['browser'],
    version: 1,
    description: 'Loop through multiple elements on the page',
    defaults: {
      name: 'Loop Elements',
      color: '#FF6B6B',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Selector',
        name: 'selector',
        type: 'string',
        placeholder: '.item',
        default: '',
        description: 'CSS selector to find multiple elements',
        required: true,
      },
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        options: [
          {
            name: 'Get Text',
            value: 'getText',
            description: 'Get text from each element',
          },
          {
            name: 'Get Attribute',
            value: 'getAttribute',
            description: 'Get attribute value from each element',
          },
          {
            name: 'Get HTML',
            value: 'getHTML',
            description: 'Get HTML content from each element',
          },
          {
            name: 'Click All',
            value: 'clickAll',
            description: 'Click each element',
          },
          {
            name: 'Get Data',
            value: 'getData',
            description: 'Extract structured data from each element',
          },
        ],
        default: 'getText',
      },
      {
        displayName: 'Attribute Name',
        name: 'attributeName',
        type: 'string',
        displayOptions: {
          show: {
            action: ['getAttribute'],
          },
        },
        placeholder: 'href',
        default: '',
        description: 'Name of the attribute to extract',
      },
      {
        displayName: 'Data Extraction Rules',
        name: 'dataRules',
        type: 'json',
        displayOptions: {
          show: {
            action: ['getData'],
          },
        },
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        placeholder: '{"title": ".title", "price": ".price"}',
        default: '{}',
        description: 'JSON object defining data extraction rules',
      },
      {
        displayName: 'Max Elements',
        name: 'maxElements',
        type: 'number',
        typeOptions: {
          minValue: 1,
          maxValue: 1000,
        },
        default: 100,
        description: 'Maximum number of elements to process',
      },
      {
        displayName: 'Wait Between Actions (ms)',
        name: 'waitTime',
        type: 'number',
        typeOptions: {
          minValue: 0,
          maxValue: 10000,
        },
        default: 0,
        description: 'Time to wait between processing each element',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const browserService = new BrowserWorkflowService(this.getWorkflowData());

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const selector = this.getNodeParameter('selector', itemIndex) as string;
        const action = this.getNodeParameter('action', itemIndex) as string;
        const maxElements = this.getNodeParameter('maxElements', itemIndex) as number;
        const waitTime = this.getNodeParameter('waitTime', itemIndex) as number;

        if (!selector) {
          throw new NodeOperationError(this.getNode(), 'Selector is required');
        }

        const page = await browserService.getCurrentPage();
        
        // 查找所有匹配的元素
        const elements = await page.$$(selector);
        const elementsToProcess = elements.slice(0, maxElements);

        const results: any[] = [];

        for (let i = 0; i < elementsToProcess.length; i++) {
          const element = elementsToProcess[i];

          try {
            let result: any;

            switch (action) {
              case 'getText': {
                result = await element.evaluate(el => el.textContent?.trim() || '');
                break;
              }

              case 'getAttribute': {
                const attributeName = this.getNodeParameter('attributeName', itemIndex) as string;
                if (!attributeName) {
                  throw new NodeOperationError(this.getNode(), 'Attribute name is required');
                }
                result = await element.evaluate((el, attr) => el.getAttribute(attr), attributeName);
                break;
              }

              case 'getHTML': {
                result = await element.evaluate(el => el.innerHTML);
                break;
              }

              case 'clickAll': {
                await element.click();
                result = { clicked: true, index: i };
                break;
              }

              case 'getData': {
                const dataRulesStr = this.getNodeParameter('dataRules', itemIndex) as string;
                const dataRules = JSON.parse(dataRulesStr);
                
                result = await element.evaluate((el, rules) => {
                  const data: any = {};
                  for (const [key, selector] of Object.entries(rules)) {
                    const targetEl = el.querySelector(selector as string);
                    data[key] = targetEl?.textContent?.trim() || '';
                  }
                  return data;
                }, dataRules);
                break;
              }

              default:
                throw new NodeOperationError(this.getNode(), `Unknown action: ${action}`);
            }

            results.push({
              index: i,
              data: result,
            });

            // 等待指定时间
            if (waitTime > 0 && i < elementsToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }

          } catch (error) {
            results.push({
              index: i,
              error: error.message,
            });
          }
        }

        returnData.push({
          json: {
            ...items[itemIndex].json,
            loopResults: results,
            totalElements: elements.length,
            processedElements: elementsToProcess.length,
            selector,
            action,
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

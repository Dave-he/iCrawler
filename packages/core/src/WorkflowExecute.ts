import { WorkflowExecute } from 'n8n-workflow';
import type {
  IWorkflowExecuteAdditionalData,
  WorkflowExecuteMode,
  IWorkflow,
  IRunExecutionData,
  INodeExecutionData,
} from 'n8n-workflow';
import { Logger } from './Logger';
import { BrowserWorkflowService } from './services/BrowserWorkflowService';

/**
 * iCrawler Workflow Engine
 * 基于n8n的WorkflowExecute，专门为浏览器自动化优化
 */
export class IcrawlerWorkflowExecute extends WorkflowExecute {
  private browserService: BrowserWorkflowService;

  constructor(
    additionalData: IWorkflowExecuteAdditionalData,
    mode: WorkflowExecuteMode,
    runExecutionData?: IRunExecutionData
  ) {
    super(additionalData, mode, runExecutionData);
    this.browserService = new BrowserWorkflowService(additionalData);
  }

  /**
   * 执行浏览器自动化工作流
   */
  async executeWorkflow(
    workflowData: IWorkflow,
    additionalData?: IWorkflowExecuteAdditionalData
  ) {
    Logger.info(`Executing workflow: ${workflowData.name}`);

    try {
      // 初始化浏览器服务
      await this.browserService.initialize();

      // 执行工作流
      const result = await super.executeWorkflow(workflowData, additionalData);

      Logger.info(`Workflow completed: ${workflowData.name}`);
      return result;

    } catch (error) {
      Logger.error(`Workflow execution failed: ${workflowData.name}`, error);
      throw error;
    } finally {
      // 清理浏览器资源
      await this.browserService.cleanup();
    }
  }

  /**
   * 执行单个节点
   */
  async executeNode(
    nodeName: string,
    workflowData: IWorkflow,
    inputData?: INodeExecutionData[]
  ) {
    Logger.debug(`Executing node: ${nodeName}`);

    try {
      const result = await super.executeNode(nodeName, workflowData, inputData);
      Logger.debug(`Node completed: ${nodeName}`);
      return result;
    } catch (error) {
      Logger.error(`Node execution failed: ${nodeName}`, error);
      throw error;
    }
  }
}
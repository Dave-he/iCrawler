import puppeteer from 'puppeteer';
import type { Browser, Page, Target } from 'puppeteer';
import type { IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { Logger } from '../Logger';

/**
 * 浏览器工作流服务
 * 管理浏览器实例和页面，为节点提供浏览器操作能力
 */
export class BrowserWorkflowService {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private currentTabId: string | null = null;
  private additionalData: IWorkflowExecuteAdditionalData;

  constructor(additionalData: IWorkflowExecuteAdditionalData) {
    this.additionalData = additionalData;
  }

  /**
   * 初始化浏览器服务
   */
  async initialize() {
    Logger.info('Initializing browser service');

    try {
      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      Logger.info('Browser service initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize browser service', error);
      throw error;
    }
  }

  /**
   * 创建新页面
   */
  async createPage(tabId?: string): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const pageId = tabId || `page_${Date.now()}`;

    // 设置页面配置
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('iCrawler/1.0');

    this.pages.set(pageId, page);
    this.currentTabId = pageId;

    Logger.debug(`Created new page: ${pageId}`);
    return page;
  }

  /**
   * 获取当前页面
   */
  async getCurrentPage(): Promise<Page> {
    if (!this.currentTabId) {
      return this.createPage();
    }

    const page = this.pages.get(this.currentTabId);
    if (!page) {
      return this.createPage(this.currentTabId);
    }

    return page;
  }

  /**
   * 切换到指定页面
   */
  async switchToPage(tabId: string): Promise<Page> {
    const page = this.pages.get(tabId);
    if (!page) {
      throw new Error(`Page not found: ${tabId}`);
    }

    this.currentTabId = tabId;
    return page;
  }

  /**
   * 导航到URL
   */
  async navigateTo(url: string, options?: any): Promise<void> {
    const page = await this.getCurrentPage();
    
    Logger.info(`Navigating to: ${url}`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options
    });

    Logger.info(`Navigation completed: ${url}`);
  }

  /**
   * 等待元素
   */
  async waitForElement(selector: string, timeout = 5000): Promise<void> {
    const page = await this.getCurrentPage();
    
    try {
      await page.waitForSelector(selector, { timeout });
      Logger.debug(`Element found: ${selector}`);
    } catch (error) {
      Logger.warn(`Element not found: ${selector}`, error);
      throw new Error(`Element not found: ${selector}`);
    }
  }

  /**
   * 点击元素
   */
  async clickElement(selector: string): Promise<void> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    await page.click(selector);
    
    Logger.debug(`Clicked element: ${selector}`);
  }

  /**
   * 输入文本
   */
  async typeText(selector: string, text: string): Promise<void> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    await page.type(selector, text);
    
    Logger.debug(`Typed text into: ${selector}`);
  }

  /**
   * 获取元素文本
   */
  async getElementText(selector: string): Promise<string> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    const text = await page.$eval(selector, el => el.textContent || '');
    
    Logger.debug(`Got text from element: ${selector}`);
    return text;
  }

  /**
   * 执行JavaScript
   */
  async executeScript<T>(script: string, ...args: any[]): Promise<T> {
    const page = await this.getCurrentPage();
    
    const result = await page.evaluate(script, ...args);
    
    Logger.debug('Executed JavaScript script');
    return result;
  }

  /**
   * 截图
   */
  async takeScreenshot(options?: any): Promise<Buffer> {
    const page = await this.getCurrentPage();
    
    const screenshot = await page.screenshot({
      fullPage: true,
      ...options
    });
    
    Logger.debug('Took screenshot');
    return screenshot as Buffer;
  }

  /**
   * 获取页面URL
   */
  async getCurrentUrl(): Promise<string> {
    const page = await this.getCurrentPage();
    return page.url();
  }

  /**
   * 关闭页面
   */
  async closePage(tabId?: string): Promise<void> {
    const targetTabId = tabId || this.currentTabId;
    if (!targetTabId) return;

    const page = this.pages.get(targetTabId);
    if (page) {
      await page.close();
      this.pages.delete(targetTabId);
      
      if (this.currentTabId === targetTabId) {
        this.currentTabId = null;
      }
      
      Logger.debug(`Closed page: ${targetTabId}`);
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    Logger.info('Cleaning up browser service');

    try {
      // 关闭所有页面
      for (const [tabId, page] of this.pages) {
        try {
          await page.close();
        } catch (error) {
          Logger.warn(`Failed to close page: ${tabId}`, error);
        }
      }
      this.pages.clear();

      // 关闭浏览器
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.currentTabId = null;
      Logger.info('Browser service cleaned up successfully');
    } catch (error) {
      Logger.error('Failed to cleanup browser service', error);
    }
  }

  /**
   * 获取所有页面ID
   */
  getPageIds(): string[] {
    return Array.from(this.pages.keys());
  }

  /**
   * 检查页面是否存在
   */
  hasPage(tabId: string): boolean {
    return this.pages.has(tabId);
  }

  /**
   * 获取元素属性
   */
  async getElementAttribute(selector: string, attribute: string): Promise<string | null> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    const value = await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
    
    Logger.debug(`Got attribute "${attribute}" from element: ${selector}`);
    return value;
  }

  /**
   * 获取多个元素
   */
  async getElements(selector: string): Promise<any[]> {
    const page = await this.getCurrentPage();
    const elements = await page.$$(selector);
    
    Logger.debug(`Found ${elements.length} elements: ${selector}`);
    return elements;
  }

  /**
   * 检查元素是否存在
   */
  async elementExists(selector: string, timeout = 5000): Promise<boolean> {
    const page = await this.getCurrentPage();
    
    try {
      await page.waitForSelector(selector, { timeout });
      Logger.debug(`Element exists: ${selector}`);
      return true;
    } catch (error) {
      Logger.debug(`Element does not exist: ${selector}`);
      return false;
    }
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(selector: string): Promise<void> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    await page.$eval(selector, el => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    Logger.debug(`Scrolled to element: ${selector}`);
  }

  /**
   * 获取元素的HTML
   */
  async getElementHTML(selector: string): Promise<string> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    const html = await page.$eval(selector, el => el.innerHTML);
    
    Logger.debug(`Got HTML from element: ${selector}`);
    return html;
  }

  /**
   * 选择下拉框选项
   */
  async selectOption(selector: string, value: string): Promise<void> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    await page.select(selector, value);
    
    Logger.debug(`Selected option "${value}" in: ${selector}`);
  }

  /**
   * 等待导航完成
   */
  async waitForNavigation(options?: any): Promise<void> {
    const page = await this.getCurrentPage();
    
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options
    });
    
    Logger.debug('Navigation completed');
  }

  /**
   * 获取页面标题
   */
  async getPageTitle(): Promise<string> {
    const page = await this.getCurrentPage();
    return page.title();
  }

  /**
   * 设置Cookie
   */
  async setCookies(cookies: any[]): Promise<void> {
    const page = await this.getCurrentPage();
    await page.setCookie(...cookies);
    
    Logger.debug(`Set ${cookies.length} cookies`);
  }

  /**
   * 获取Cookie
   */
  async getCookies(): Promise<any[]> {
    const page = await this.getCurrentPage();
    const cookies = await page.cookies();
    
    Logger.debug(`Got ${cookies.length} cookies`);
    return cookies;
  }

  /**
   * 清除Cookie
   */
  async clearCookies(): Promise<void> {
    const page = await this.getCurrentPage();
    const cookies = await page.cookies();
    
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
      Logger.debug('Cleared all cookies');
    }
  }

  /**
   * 模拟鼠标悬停
   */
  async hoverElement(selector: string): Promise<void> {
    const page = await this.getCurrentPage();
    
    await this.waitForElement(selector);
    await page.hover(selector);
    
    Logger.debug(`Hovered over element: ${selector}`);
  }

  /**
   * 等待指定时间
   */
  async wait(milliseconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, milliseconds));
    Logger.debug(`Waited for ${milliseconds}ms`);
  }

  /**
   * 刷新页面
   */
  async reload(options?: any): Promise<void> {
    const page = await this.getCurrentPage();
    
    await page.reload({
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options
    });
    
    Logger.debug('Page reloaded');
  }

  /**
   * 返回上一页
   */
  async goBack(options?: any): Promise<void> {
    const page = await this.getCurrentPage();
    
    await page.goBack({
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options
    });
    
    Logger.debug('Navigated back');
  }

  /**
   * 前进到下一页
   */
  async goForward(options?: any): Promise<void> {
    const page = await this.getCurrentPage();
    
    await page.goForward({
      waitUntil: 'networkidle2',
      timeout: 30000,
      ...options
    });
    
    Logger.debug('Navigated forward');
  }
}
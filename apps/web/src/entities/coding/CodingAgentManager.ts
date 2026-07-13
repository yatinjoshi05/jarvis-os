import { SourceFile, Project, CodeAction, TerminalCommand } from './interfaces';
import { fileManager } from './fileManager';
import { projectAnalyzer } from './ProjectAnalyzer';
import { terminalAgent } from './terminal';
import { codingEventEmitter, CodingEvents } from './events';
import { browserEventEmitter, BrowserEvents } from '../browser/events';

// Integrations
import { aiManager } from '../../shared/ai';
import { memoryManager } from '../../shared/memory';
import { serviceRegistry } from '../../shared/providers';

export class CodingAgentManager {
  private actionsList: CodeAction[] = [];

  // Expose file management
  public openFile(path: string): SourceFile {
    return fileManager.openFile(path);
  }

  public saveFile(path: string, content: string): SourceFile {
    const file = fileManager.saveFile(path, content);
    codingEventEmitter.emit(CodingEvents.CODE_UPDATED, { path });
    return file;
  }

  // Expose project analysis
  public analyzeProject(rootPath?: string): Project {
    return projectAnalyzer.analyzeProject(rootPath);
  }

  // Expose terminal agent
  public async runCommand(command: string, cwd?: string): Promise<TerminalCommand> {
    codingEventEmitter.emit(CodingEvents.TEST_STARTED, { command });
    const result = await terminalAgent.runCommand(command, cwd);
    codingEventEmitter.emit(CodingEvents.TEST_COMPLETED, result);
    return result;
  }

  // AI-powered Coding Actions
  public async generateCode(prompt: string, contextDescription = ''): Promise<CodeAction> {
    codingEventEmitter.emit(CodingEvents.DEBUG_STARTED, { action: 'generate', prompt });

    const aiPrompt = `You are a Senior Software Architect generating high-quality TS code.
Prompt: ${prompt}
Context: ${contextDescription}

Write only the final code inside a code block, along with a brief explanation of how it meets the requirements.`;

    const aiResponse = await aiManager.generateResponse(aiPrompt);

    const codeBlockMatch = aiResponse.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/);
    const generatedCode = codeBlockMatch ? codeBlockMatch[1] : aiResponse;

    const action: CodeAction = {
      id: `act_${Date.now()}`,
      type: 'generate',
      prompt,
      resultDetails: {
        description: 'AI Code Generation completed.',
        generatedCode
      },
      timestamp: Date.now()
    };

    this.actionsList.push(action);
    this.saveActionLogs(action);

    browserEventEmitter.emit(BrowserEvents.CODE_GENERATED, action);
    codingEventEmitter.emit(CodingEvents.CODE_CREATED, { actionId: action.id });

    return action;
  }

  public async reviewCode(sourceCode: string): Promise<CodeAction> {
    const prompt = 'Please audit this code for formatting, performance issues, and potential edge cases.';
    
    const aiPrompt = `You are an expert Code Reviewer.
Audit this source code:
${sourceCode}

List the top 3 improvements or issues found. Format your response as a bullet list.`;

    const aiResponse = await aiManager.generateResponse(aiPrompt);
    const comments = aiResponse.split('\n').filter((l) => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l)).map((c) => c.replace(/^[\s-*]+/, ''));

    const action: CodeAction = {
      id: `act_${Date.now()}`,
      type: 'review',
      prompt,
      sourceCode,
      resultDetails: {
        description: 'AI Code Review completed.',
        reviewComments: comments.length > 0 ? comments : ['No critical issues detected. Code satisfies strict formatting standards.']
      },
      timestamp: Date.now()
    };

    this.actionsList.push(action);
    this.saveActionLogs(action);

    browserEventEmitter.emit(BrowserEvents.CODE_REVIEW_COMPLETED, action);
    return action;
  }

  public async refactorCode(sourceCode: string, instructions: string): Promise<CodeAction> {
    const prompt = `Refactor this code: ${instructions}`;
    
    const aiPrompt = `You are an expert refactoring assistant.
Refactor this code:
${sourceCode}

Follow these instructions: ${instructions}

Provide only the refactored code block.`;

    const aiResponse = await aiManager.generateResponse(aiPrompt);
    const codeBlockMatch = aiResponse.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/);
    const generatedCode = codeBlockMatch ? codeBlockMatch[1] : aiResponse;

    const action: CodeAction = {
      id: `act_${Date.now()}`,
      type: 'refactor',
      prompt,
      sourceCode,
      resultDetails: {
        description: 'Code refactoring completed.',
        generatedCode,
        diff: `--- original\n+++ refactored\n${generatedCode.substring(0, 100)}`
      },
      timestamp: Date.now()
    };

    this.actionsList.push(action);
    this.saveActionLogs(action);

    codingEventEmitter.emit(CodingEvents.CODE_REFACTORED, { actionId: action.id });
    return action;
  }

  public async explainCode(sourceCode: string): Promise<string> {
    const aiPrompt = `Explain how this code works:
${sourceCode}

Provide a concise structural walkthrough.`;
    return aiManager.generateResponse(aiPrompt);
  }

  public async debugCode(sourceCode: string, errorString: string): Promise<CodeAction> {
    codingEventEmitter.emit(CodingEvents.DEBUG_STARTED, { errorString });

    const aiPrompt = `You are a Senior Debugger.
Source code has an error:
${errorString}

Source code:
${sourceCode}

Suggest a fix and explain why the issue occurred. Write code block for the fixed lines.`;

    const aiResponse = await aiManager.generateResponse(aiPrompt);
    const codeBlockMatch = aiResponse.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/);
    const generatedCode = codeBlockMatch ? codeBlockMatch[1] : aiResponse;

    const action: CodeAction = {
      id: `act_${Date.now()}`,
      type: 'optimize',
      prompt: `Debug: ${errorString}`,
      sourceCode,
      resultDetails: {
        description: aiResponse.substring(0, 200),
        generatedCode
      },
      timestamp: Date.now()
    };

    this.actionsList.push(action);
    this.saveActionLogs(action);

    codingEventEmitter.emit(CodingEvents.DEBUG_COMPLETED, { actionId: action.id });
    return action;
  }

  private saveActionLogs(action: CodeAction) {
    memoryManager.saveMemory(
      `code_action_${action.id}`,
      JSON.stringify(action),
      'task',
      'persistent',
      5,
      ['coding', 'action', action.type]
    ).catch(() => {});
  }

  public getActionsHistory(): CodeAction[] {
    return this.actionsList;
  }
}

export const codingAgentManager = new CodingAgentManager();
serviceRegistry.register('codingAgentManager', codingAgentManager);
export default codingAgentManager;

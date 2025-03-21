import * as vscode from 'vscode';
import axios, { AxiosRequestConfig } from 'axios';

// Constants
const OLLAMA_DEFAULT_ENDPOINT = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'llama2:7b';
const DEFAULT_TIMEOUT = 60000;

interface OllamaResponse {
  response: string;
}

/**
 * Lấy cấu hình từ VSCode settings
 */
function getOllamaConfig() {
  const config = vscode.workspace.getConfiguration('ollama');
  return {
    endpoint: config.get<string>('endpoint') || OLLAMA_DEFAULT_ENDPOINT,
    model: config.get<string>('model') || DEFAULT_MODEL,
    reviewPromptTemplate:
      config.get<string>('reviewPromptTemplate') ||
      'Bạn là một kỹ sư phần mềm có kinh nghiệm. Hãy review đoạn mã sau và cung cấp phản hồi chi tiết:\n- Tính đúng đắn (correctness): Có hoạt động như mong đợi không? Có bug tiềm ẩn không?\n- Hiệu suất (performance): Có thể tối ưu ở đâu?\n- Đề xuất cải thiện (nếu có).\nMã nguồn:\n```typescript\n${code}\n```',
    generatePromptTemplate:
      config.get<string>('generatePromptTemplate') ||
      'You are a coding assistant. Generate a TypeScript snippet for:\n"${description}"\nReturn only the code, no explanations.',
  };
}

/**
 * Gọi API Ollama với cấu hình động
 */
async function callOllama(
  prompt: string,
  options: {
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const config = getOllamaConfig();
  const { endpoint = config.endpoint, model = config.model, ...restOptions } = options;

  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  const axiosConfig: AxiosRequestConfig = {
    method: 'POST',
    url: endpoint,
    timeout: DEFAULT_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
    data: {
      prompt,
      model,
      stream: false,
      ...restOptions,
    },
  };

  try {
    const response = await axios.request<OllamaResponse>(axiosConfig);
    console.log('Raw Ollama response:', response.data); // Debug phản hồi
    const reviewText = response.data.response?.trim();
    if (!reviewText) {
      throw new Error('Ollama returned no response content');
    }
    return reviewText;
  } catch (error: any) {
    const message = error.response
      ? `Ollama API error: ${error.response.status} - ${error.response.data?.error}`
      : `Network error: ${error.message}`;
    console.error('Call Ollama error:', message);
    throw new Error(message);
  }
}

/**
 * Tạo prompt từ template
 */
function createPromptFromTemplate(template: string, content: string): string {
  if (!template) {
    throw new Error('Prompt template is not defined. Please configure it in settings.');
  }
  const prompt = template.replace('${code}', content).replace('${description}', content).trim();
  console.log('Prompt sent to Ollama:', prompt); // Debug prompt
  return prompt;
}

/**
 * Chèn review dưới dạng comment vào file
 */
async function insertReviewAsComment(editor: vscode.TextEditor, reviewText: string) {
  const positionConfig = vscode.workspace.getConfiguration('ollama').get<string>('reviewCommentPosition') || 'bottom';
  let position: vscode.Position;

  switch (positionConfig) {
    case 'top':
      position = new vscode.Position(0, 0);
      break;
    case 'cursor':
      position = editor.selection.active;
      break;
    case 'bottom':
    default:
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
      position = new vscode.Position(lastLine.lineNumber + 1, 0);
  }

  const languageId = editor.document.languageId;
  let commentText: string;
  switch (languageId) {
    case 'typescript':
    case 'javascript':
    case 'c':
    case 'cpp':
    case 'java':
    case 'csharp':
      commentText = `/*\n * Code Review:\n${reviewText
        .split('\n')
        .map((line) => ` * ${line}`)
        .join('\n')}\n */\n`;
      break;

    case 'python':
    case 'ruby':
    case 'perl':
      commentText = `# Code Review:\n${reviewText
        .split('\n')
        .map((line) => `# ${line}`)
        .join('\n')}\n`;
      break;

    case 'html':
    case 'xml':
      commentText = `<!-- Code Review:\n${reviewText
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n-->\n`;
      break;

    case 'rust':
    case 'go':
    case 'swift':
      commentText = `// Code Review:\n${reviewText
        .split('\n')
        .map((line) => `// ${line}`)
        .join('\n')}\n`;
      break;

    default:
      commentText = `/*\n * Code Review (unknown language: ${languageId}):\n${reviewText
        .split('\n')
        .map((line) => ` * ${line}`)
        .join('\n')}\n */\n`;
      break;
  }

  await editor.edit((editBuilder) => {
    editBuilder.insert(position, commentText);
  });
}

export function activate(context: vscode.ExtensionContext) {
  const config = getOllamaConfig();

  const getEditorCode = (): string | null => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor');
      return null;
    }
    return editor.document.getText();
  };

  // Lệnh Review Code
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.ollamaReviewCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
      }

      const code = getEditorCode();
      if (!code) return;

      try {
        const prompt = createPromptFromTemplate(config.reviewPromptTemplate, code);
        const reviewText = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Reviewing code...',
            cancellable: false,
          },
          () => callOllama(prompt)
        );

        await insertReviewAsComment(editor, reviewText);
      } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
      }
    })
  );

  // Lệnh Generate Code
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.ollamaGenerateCode', async () => {
      const userDesc = await vscode.window.showInputBox({
        prompt: 'Describe the code snippet (e.g., "sum two numbers in TypeScript")',
        validateInput: (value) => (value.trim() ? null : 'Description cannot be empty'),
      });
      if (!userDesc) return;

      try {
        const prompt = createPromptFromTemplate(config.generatePromptTemplate, userDesc);
        const generatedCode = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating code...',
            cancellable: false,
          },
          () => callOllama(prompt)
        );

        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit((editBuilder) =>
            editBuilder.replace(editor.selection, generatedCode)
          );
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
      }
    })
  );

  const { endpoint, model } = config;
  console.log(`Ollama configured with endpoint: ${endpoint}, model: ${model}`);
}

export function deactivate() {}
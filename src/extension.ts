import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

    /**
     * Lệnh #1: Review code hiện tại
     */
    const reviewCmd = vscode.commands.registerCommand('extension.ollamaReviewCode', async () => {
        // 1. Lấy code từ file đang mở
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return vscode.window.showErrorMessage('No active text editor');
        }
        const code = editor.document.getText();

        // 2. Tạo prompt cho Ollama
        const reviewPrompt = `
You are a senior code reviewer. Please review the following code for best practices, performance, and correctness. Provide suggestions:

${code}
        `.trim();

        // 3. Gọi Ollama endpoint
        try {
            const response = await axios.post('http://localhost:11411/generate', {
                prompt: reviewPrompt,
                model: 'llama2:7b',    // model mà bạn đã pull, tùy ý
                // Thêm các tham số khác như "temperature", "max_tokens", etc.
                // Ollama có parameter "temperature", "top_k", "top_p", v.v...
            }, {
                timeout: 60000, // 60s
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 4. Phản hồi của Ollama trả về có thể ở dạng { done, model, response, ...}
            // Tuỳ phiên bản Ollama. Thường "response" là text.
            // Hãy in ra console để xem structure:
            // console.log(response.data);

            const reviewText = response.data?.response || 'No response';

            vscode.window.showInformationMessage(`Review:\n${reviewText}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error calling Ollama: ${error}`);
        }
    });

    /**
     * Lệnh #2: Tạo code snippet
     */
    const generateCmd = vscode.commands.registerCommand('extension.ollamaGenerateCode', async () => {
        // Hỏi user muốn tạo snippet gì
        const userDesc = await vscode.window.showInputBox({
            prompt: 'Describe the code snippet you want to generate (e.g. "a function that sums 2 numbers in TypeScript")'
        });
        if (!userDesc) {
            return;
        }

        const genPrompt = `
You are a coding assistant. Generate a short code snippet for the following request:
"${userDesc}"
Only provide the code snippet.
        `.trim();

        try {
            const response = await axios.post('http://localhost:11411/generate', {
                prompt: genPrompt,
                model: 'llama2:7b',
                // Ollama params...
                // e.g. "temperature": 0.7
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const generatedCode = response.data?.response || '// No code generated';

            // Chèn code vào vị trí con trỏ (cursor) hiện tại
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, generatedCode);
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error generating code: ${error}`);
        }
    });

    // Đăng ký các lệnh vào extension
    context.subscriptions.push(reviewCmd);
    context.subscriptions.push(generateCmd);
}

export function deactivate() {}

Dưới đây là một số gợi ý để bạn **hoàn thiện nội dung `README.md`** cho extension *nreviewcode*, nhằm đáp ứng yêu cầu của VS Code Marketplace và cũng để người dùng hiểu rõ giá trị extension của bạn:

---

## 1. Giới thiệu & Mục đích

Ở đầu file, bạn nên **tóm tắt ngắn gọn** về extension:

> `nreviewcode` là một VS Code extension cho phép bạn:
> - Review code trực tiếp trong VS Code bằng mô hình LLM chạy qua Ollama (local).
> - Tạo (generate) code snippet theo yêu cầu.

Ví dụ:

```md
# nreviewcode

`nreviewcode` is a VS Code extension that integrates with Ollama's LLaMA model locally. It provides two primary features:
1. **Review Code**: Give a review of your current file regarding best practices, performance, and correctness.
2. **Generate Code**: Generate code snippets based on user prompts.

This extension is particularly useful if you want to keep your code and AI inference local (for privacy or offline development), without sending data to a remote service.
```

---

## 2. Cách Sử Dụng (Features & Usage)

### 2.1 Cách chạy lệnh “Review Code”

- Mở một file code trong VS Code.
- Mở Command Palette (Ctrl+Shift+P).
- Tìm **LLM: Review Code with Ollama**.
- Extension sẽ gọi Ollama server (ở `http://localhost:11411/generate`), gửi prompt review, sau đó hiển thị phản hồi lên một thông báo.

### 2.2 Cách chạy lệnh “Generate Code”

- Mở Command Palette (Ctrl+Shift+P).
- Tìm **LLM: Generate Code with Ollama**.
- Extension sẽ hỏi bạn một đoạn mô tả snippet, rồi gọi Ollama để sinh ra code.  
- Đoạn code tự động chèn vào vị trí con trỏ trong file đang mở.

Bạn nên thêm ảnh chụp màn hình (hoặc GIF) minh hoạ lệnh review/generate để người đọc dễ hình dung:


(Trong đó, `images/nreviewcode-usage.png` là ảnh mô tả người dùng chạy lệnh extension trong Command Palette.)

---

## 3. Yêu Cầu (Requirements)

- Bạn phải **cài đặt** [Ollama](https://github.com/jmorganca/ollama) trên máy local, và chạy `ollama serve`.
- Bạn nên **pull** mô hình (ví dụ `llama2:7b`) bằng `ollama pull llama2:7b`.
- VS Code phiên bản >= 1.78.0 (theo `package.json`).

---

## 4. Cấu Hình Extension (Extension Settings)

Hiện tại, extension này chưa bổ sung settings trong `contributes.configuration`, nhưng nếu sau này bạn muốn cho phép người dùng cấu hình:
- **Endpoint** Ollama (mặc định `http://localhost:11411/generate`)  
- **Tên model** (mặc định `llama2:7b`)  
- **Tham số** như `temperature`, `max_tokens`, v.v…  

Bạn có thể liệt kê chúng tại đây.

---

## 5. Các Vấn Đề Đã Biết (Known Issues)

- Streaming response chưa được hỗ trợ, phản hồi chỉ hiển thị một lần sau khi toàn bộ hoàn tất.
- Có thể tốn tài nguyên CPU/GPU nếu dùng mô hình lớn như LLaMA 2 13B hoặc 30B, tuỳ máy.
- Nếu Ollama chưa chạy, extension sẽ báo lỗi gọi API.

---

## 6. Thông Tin Phiên Bản (Release Notes)

### 0.0.1
- Tích hợp 2 lệnh chính: `Review Code` và `Generate Code`.
- Gọi API đến `localhost:11411` của Ollama.

(Trong tương lai, bạn có thể thêm mục 0.0.2, 0.0.3,... để ghi chú các thay đổi, tính năng mới hoặc bug fix.)

---

## 7. Tài Liệu Tham Khảo

- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)  
- [Ollama on GitHub](https://github.com/jmorganca/ollama)  
- [NPM axios](https://www.npmjs.com/package/axios)

---

### Tóm tắt

- **Bạn nên** mô tả rõ ràng mục tiêu, cách cài đặt, cách sử dụng extension.  
- **Kèm thêm** ảnh/ảnh GIF minh hoạ nếu có.  
- **Nói rõ** yêu cầu về Ollama (nếu người dùng không cài, extension sẽ lỗi).  
- **Cập nhật `Release Notes`** khi phát hành phiên bản mới.  

Bằng cách cập nhật `README.md` tương tự các gợi ý trên (thay vì để nội dung mẫu), bạn sẽ đáp ứng tiêu chuẩn của VS Code Marketplace và giúp người dùng (hoặc chính bạn trong tương lai) hiểu rõ về extension của mình. Chúc bạn thành công!
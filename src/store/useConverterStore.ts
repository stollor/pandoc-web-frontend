import { create } from 'zustand';
import { convertToHtml, convertFromHtml } from './localConverter';
import PandocWorker from './pandoc.worker?worker';

export type FileFormat = 'markdown' | 'html' | 'latex' | 'docx' | 'rst' | 'org' | 'epub';

interface ConverterState {
  inputText: string;
  outputText: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  isConverting: boolean;
  error: string | null;
  isWasmReady: boolean;
  setInputText: (text: string) => void;
  setInputFormat: (format: FileFormat) => void;
  setOutputFormat: (format: FileFormat) => void;
  convert: () => Promise<void>;
  convertFile: (file: File) => Promise<void>;
  initWasm: () => void;
}

let workerInstance: Worker | null = null;

export const useConverterStore = create<ConverterState>((set, get) => ({
  inputText: '# Hello World\n\nThis is a **markdown** document to convert.',
  outputText: '',
  inputFormat: 'markdown',
  outputFormat: 'html',
  isConverting: false,
  error: null,
  isWasmReady: false,

  initWasm: () => {
    if (workerInstance) return;
    
    workerInstance = new PandocWorker();
    workerInstance.onmessage = (event) => {
      const { type, error } = event.data;
      if (type === 'INIT_SUCCESS') {
        set({ isWasmReady: true });
      } else if (type === 'ERROR') {
        console.error('Pandoc Worker Error:', error);
      }
    };
    workerInstance.postMessage({ type: 'INIT' });
  },

  setInputText: (text) => set({ inputText: text }),
  setInputFormat: (format) => set({ inputFormat: format }),
  setOutputFormat: (format) => set({ outputFormat: format }),
  
  convert: async () => {
    const { inputText, inputFormat, outputFormat, isWasmReady } = get();
    if (!inputText.trim()) return;

    set({ isConverting: true, error: null, outputText: '' });

    try {
      // 尝试使用 Pandoc WASM (全格式支持)
      if (isWasmReady && workerInstance) {
        const result = await new Promise<string>((resolve, reject) => {
          const handler = (e: MessageEvent) => {
            if (e.data.type === 'CONVERT_SUCCESS') {
              workerInstance?.removeEventListener('message', handler);
              resolve(e.data.result);
            } else if (e.data.type === 'ERROR') {
              workerInstance?.removeEventListener('message', handler);
              reject(new Error(e.data.error));
            }
          };
          workerInstance.addEventListener('message', handler);
          workerInstance.postMessage({
            type: 'CONVERT',
            payload: { text: inputText, inputFormat, outputFormat }
          });
        });
        
        // Post-processing for binary formats like epub/docx via WASM is tricky
        // we might fallback to JS generation for docx/epub if we only got html back
        const finalResult = await convertFromHtml(result, outputFormat, inputText);
        set({ outputText: finalResult || result, isConverting: false });
      } else {
        // Fallback: 纯前端 JS 降级转换
        const htmlContent = await convertToHtml(inputText, inputFormat);
        const resultText = await convertFromHtml(htmlContent, outputFormat, inputText);
        set({ outputText: resultText || '', isConverting: false });
      }
    } catch (err: any) {
      set({ error: err.message || '转换失败', isConverting: false });
    }
  },

  convertFile: async (file: File) => {
    const { inputFormat, outputFormat, isWasmReady } = get();
    set({ isConverting: true, error: null, outputText: '' });

    try {
      const isInputBinary = ['epub', 'docx'].includes(inputFormat);
      const isOutputBinary = ['epub', 'docx'].includes(outputFormat);
      
      // If WASM is ready, use the new binary-capable file handler
      if (isWasmReady && workerInstance) {
        // Read file as ArrayBuffer to handle binary files safely
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Show a placeholder in the text area so it doesn't look empty or broken
        if (isInputBinary) {
          set({ inputText: `[二进制文件已加载: ${file.name}]\n\n该格式无法以纯文本预览，将直接参与底层转换。` });
        } else {
          // If it's a text file, we can still show it safely
          const textDecoder = new TextDecoder('utf-8');
          set({ inputText: textDecoder.decode(fileArrayBuffer) });
        }

        const result = await new Promise<{result: any, isBinary: boolean}>((resolve, reject) => {
          const handler = (e: MessageEvent) => {
            if (e.data.type === 'CONVERT_FILE_SUCCESS') {
              workerInstance?.removeEventListener('message', handler);
              resolve({ result: e.data.result, isBinary: e.data.isBinary });
            } else if (e.data.type === 'ERROR') {
              workerInstance?.removeEventListener('message', handler);
              reject(new Error(e.data.error));
            }
          };
          workerInstance.addEventListener('message', handler);
          
          workerInstance.postMessage({
            type: 'CONVERT_FILE',
            payload: { 
              fileData: fileArrayBuffer, 
              fileName: file.name,
              inputFormat, 
              outputFormat 
            }
          });
        });
        
        if (result.isBinary) {
           // It's an ArrayBuffer of a docx or epub
           const blob = new Blob([result.result], {
             type: outputFormat === 'docx' 
               ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
               : 'application/epub+zip'
           });
           
           // Trigger download
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `converted_${Date.now()}.${outputFormat}`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           URL.revokeObjectURL(url);
           
           set({ outputText: `文件已成功转换为 ${outputFormat} 并开始下载！\n\n注意：二进制文件不支持直接在网页预览。`, isConverting: false });
        } else {
          // It's a text output (markdown, html, etc)
          set({ outputText: result.result as string, isConverting: false });
        }
      } else {
        // Fallback for JS conversion (only works well for text-to-text)
        const fileText = await file.text();
        set({ inputText: fileText });
        const htmlContent = await convertToHtml(fileText, inputFormat);
        const resultText = await convertFromHtml(htmlContent, outputFormat, fileText);
        set({ outputText: resultText || '', isConverting: false });
      }
    } catch (err: any) {
      console.error('File conversion error:', err);
      set({ error: err.message || '文件读取或转换失败', isConverting: false });
    }
  },
}));

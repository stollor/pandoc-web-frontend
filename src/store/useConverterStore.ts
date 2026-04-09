import { create } from 'zustand';
import { convertToHtml, convertFromHtml } from './localConverter';
import PandocWorker from './pandoc.worker?worker';

export type FileFormat = 'markdown' | 'html' | 'latex' | 'docx' | 'rst' | 'org' | 'epub' | 'pdf';

interface ConverterState {
  inputText: string;
  outputText: string;
  inputFormat: FileFormat;
  outputFormat: FileFormat;
  isConverting: boolean;
  error: string | null;
  isWasmReady: boolean;
  inputFileData: ArrayBuffer | null;
  inputFileName: string | null;
  setInputText: (text: string) => void;
  setInputFormat: (format: FileFormat) => void;
  setOutputFormat: (format: FileFormat) => void;
  convert: () => Promise<void>;
  loadFile: (file: File) => Promise<void>;
  initWasm: () => void;
}

let workerInstance: Worker | null = null;

export const useConverterStore = create<ConverterState>((set, get) => ({
  inputText: '# Hello World\n\nThis is a **markdown** document to convert.',
  outputText: '',
  inputFormat: 'markdown',
  outputFormat: 'pdf',
  isConverting: false,
  error: null,
  isWasmReady: false,
  inputFileData: null,
  inputFileName: null,

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

  setInputText: (text: string) => set({ inputText: text, inputFileData: null, inputFileName: null }),
  setInputFormat: (format: FileFormat) => set({ inputFormat: format }),
  setOutputFormat: (format: FileFormat) => set({ outputFormat: format }),

  loadFile: async (file: File) => {
    const { inputFormat } = get();
    set({ error: null, outputText: '' });

    try {
      const isInputBinary = ['epub', 'docx'].includes(inputFormat);
      const fileArrayBuffer = await file.arrayBuffer();
      
      set({ 
        inputFileData: fileArrayBuffer, 
        inputFileName: file.name 
      });

      if (isInputBinary) {
        set({ inputText: `[二进制文件已加载: ${file.name}]\n\n该格式无法以纯文本预览，点击“一键转换”开始处理。` });
      } else {
        const textDecoder = new TextDecoder('utf-8');
        set({ inputText: textDecoder.decode(fileArrayBuffer) });
      }
    } catch (err: any) {
      console.error('File load error:', err);
      set({ error: err.message || '文件读取失败' });
    }
  },

  convert: async () => {
    const { inputText, inputFileData, inputFormat, outputFormat, isWasmReady } = get();
    if (!inputText.trim() && !inputFileData) return;

    set({ isConverting: true, error: null, outputText: '' });

    try {
      const isInputBinary = ['epub', 'docx'].includes(inputFormat);
      
      if (isWasmReady && workerInstance) {
        const payload: any = { inputFormat, outputFormat };
        
        if (isInputBinary) {
          if (!inputFileData) throw new Error("No binary file data found.");
          payload.fileData = inputFileData;
        } else {
          payload.text = inputText;
        }

        const result = await new Promise<{result: any, isBinary: boolean}>((resolve, reject) => {
          const handler = (e: MessageEvent) => {
            if (e.data.type === 'CONVERT_SUCCESS') {
              workerInstance?.removeEventListener('message', handler);
              resolve({ result: e.data.result, isBinary: e.data.isBinary });
            } else if (e.data.type === 'ERROR') {
              workerInstance?.removeEventListener('message', handler);
              reject(new Error(e.data.error));
            }
          };
          workerInstance.addEventListener('message', handler);
          workerInstance.postMessage({ type: 'CONVERT', payload });
        });
        
        if (result.isBinary) {
           const blob = new Blob([result.result], {
             type: outputFormat === 'docx' 
               ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
               : 'application/epub+zip'
           });
           
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
          if (outputFormat === 'pdf') {
            const finalResult = await convertFromHtml(result.result as string, outputFormat, inputText);
            set({ outputText: finalResult || result.result as string, isConverting: false });
          } else {
            set({ outputText: result.result as string, isConverting: false });
          }
        }
      } else {
        // Fallback for JS conversion (only works well for text-to-text)
        if (isInputBinary) {
           throw new Error("WASM引擎尚未加载完成，暂无法转换二进制文件。");
        }
        const htmlContent = await convertToHtml(inputText, inputFormat);
        const resultText = await convertFromHtml(htmlContent, outputFormat, inputText);
        set({ outputText: resultText || '', isConverting: false });
      }
    } catch (err: any) {
      console.error('Conversion error:', err);
      set({ error: err.message || '转换失败', isConverting: false });
    }
  }
}));

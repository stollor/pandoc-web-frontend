import { useState, useRef } from 'react';
import { useConverterStore, FileFormat } from '@/store/useConverterStore';
import { motion } from 'framer-motion';
import { ArrowRightLeft, FileType, Check, Copy, Download, Loader2, Upload } from 'lucide-react';

const FORMATS: { label: string; value: FileFormat }[] = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Word (.docx)', value: 'docx' },
  { label: 'PDF Document', value: 'pdf' },
  { label: 'reStructuredText', value: 'rst' },
  { label: 'Emacs Org', value: 'org' },
  { label: 'EPUB', value: 'epub' },
];

export default function Converter() {
  const {
    inputText,
    outputText,
    inputFormat,
    outputFormat,
    isConverting,
    setInputText,
    setInputFormat,
    setOutputFormat,
    convert,
    loadFile
  } = useConverterStore();

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    loadFile(file);
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 w-full relative z-10">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Input Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileType className="w-4 h-4" />
              输入格式
            </div>
            <select
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value as FileFormat)}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            >
              {FORMATS.map((f) => (
                <option key={`in-${f.value}`} value={f.value} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative group flex-1">
            <div className="absolute bottom-4 right-4 z-10">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".md,.html,.tex,.docx,.rst,.org,.epub"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isConverting}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                上传文件
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此输入您的内容..."
              className="w-full h-64 md:h-[400px] resize-none bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono"
            />
          </div>
        </div>

        {/* Center Actions */}
        <div className="flex flex-col items-center justify-center shrink-0 py-4 md:py-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => convert()}
            disabled={isConverting || !inputText.trim()}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-8 h-8" />
            )}
          </motion.button>
          <span className="text-xs font-medium text-muted-foreground mt-3">一键转换</span>
        </div>

        {/* Output Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileType className="w-4 h-4" />
              输出格式
            </div>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as FileFormat)}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            >
              {FORMATS.map((f) => (
                <option key={`out-${f.value}`} value={f.value} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative group flex-1">
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {outputText && (
                <>
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-white/80 dark:bg-black/80 rounded-lg hover:bg-white dark:hover:bg-black border border-black/10 dark:border-white/10 shadow-sm transition-all"
                    title="复制"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-white/80 dark:bg-black/80 rounded-lg hover:bg-white dark:hover:bg-black border border-black/10 dark:border-white/10 shadow-sm transition-all"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <textarea
              readOnly
              value={outputText}
              placeholder="转换结果将在此显示..."
              className="w-full h-64 md:h-[400px] resize-none bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono text-muted-foreground"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

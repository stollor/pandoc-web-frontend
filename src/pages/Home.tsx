import { motion } from 'framer-motion';
import Header from '@/components/Header';
import AdSpace from '@/components/AdSpace';
import Converter from '@/components/Converter';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden mesh-bg">
      {/* Decorative blurred shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 relative z-10 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            基于 Pandoc 的强大文档引擎
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            文档格式转换 <br className="hidden md:block" />
            <span className="text-gradient">从未如此简单</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            支持 Markdown, HTML, LaTeX, Word, EPUB 等数十种格式互转。
            无需安装任何软件，<strong>所有转换均在您的浏览器本地完成，绝对安全，不上传任何数据。</strong>
          </p>
        </motion.div>

        {/* Main Content Area */}
        <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-8 items-start">
          {/* Left Ad */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden xl:block w-64 shrink-0 sticky top-24"
          >
            <AdSpace className="h-[600px]" />
          </motion.div>

          {/* Converter */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 w-full"
          >
            <Converter />
            
            {/* Features below converter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">极速本地转换</h3>
                <p className="text-sm text-muted-foreground">依托强大的 WebAssembly 技术，将 Pandoc 引擎直接带入浏览器，毫秒级响应，无需漫长等待网络传输。</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">100% 数据隐私</h3>
                <p className="text-sm text-muted-foreground">所有文档和文字数据均在您本地设备的浏览器内存中进行处理，绝不上传至任何云端服务器，彻底杜绝隐私泄露风险。</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">完美排版</h3>
                <p className="text-sm text-muted-foreground">保留原始文档的样式与层级结构，告别乱码与错位。</p>
              </div>
            </div>
          </motion.div>

          {/* Right Ad */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full xl:w-64 shrink-0 flex flex-col gap-6 sticky top-24"
          >
            <AdSpace className="h-[300px] w-full" />
            <AdSpace className="h-[276px] w-full hidden xl:flex" />
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-black/5 dark:border-white/5 mt-20 py-8 bg-black/5 dark:bg-white/5 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 DocMagic. Based on <a href="https://pandoc.org" className="underline hover:text-primary">Pandoc</a> & <a href="https://github.com/synyx/pandoc-web" className="underline hover:text-primary">pandoc-web</a>.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary transition-colors">服务条款</a>
            <a href="#" className="hover:text-primary transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

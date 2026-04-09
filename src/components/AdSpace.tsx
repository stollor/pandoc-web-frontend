export default function AdSpace({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 font-bold">
        Advertisement
      </div>
      <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500/40 to-purple-500/40 animate-pulse" />
      </div>
      <h3 className="text-sm font-semibold mb-2">这里是您的广告位</h3>
      <p className="text-xs text-black/50 dark:text-white/50 max-w-[200px]">
        支持我们的免费文档转换服务，获取优质流量曝光
      </p>
      <button className="mt-4 px-4 py-1.5 text-xs font-medium rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        了解投放
      </button>
    </div>
  );
}

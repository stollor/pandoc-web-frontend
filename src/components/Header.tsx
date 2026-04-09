import { Moon, Sun, Wand2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/50 dark:bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">DocMagic</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

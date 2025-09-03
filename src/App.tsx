import { useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { UrlInput } from './components/UrlInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { useTheme } from './hooks/useTheme';
import type { ScrapedData, ApiResponse } from './types';
import { AlertCircle, Globe } from 'lucide-react';

function App() {
  useTheme(); // Initialize theme
  
  const [data, setData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async (url: string) => {
    setIsLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Check if response is ok
      if (!response.ok) {
        // Try to parse error response
        try {
          const errorResult = await response.json();
          setError(errorResult.error || `Server error: ${response.status} ${response.statusText}`);
        } catch {
          setError(`Server error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to scrape URL');
      }
    } catch (err) {
      // Network connection error (server completely unreachable)
      setError('Network error: Unable to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                DTE Circulars Scraper
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get the latest circular documents from Karnataka DTE with a single click.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <UrlInput onScrape={handleScrape} isLoading={isLoading} />

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
              <span>Fetching recent circulars...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Results */}
          {data && <ResultsDisplay data={data} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Built with React, TypeScript, Tailwind CSS, and Playwright
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
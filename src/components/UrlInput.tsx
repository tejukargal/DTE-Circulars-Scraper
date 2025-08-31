import { FileText, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onScrape: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onScrape: onScrapeUrl, isLoading }: UrlInputProps) {
  const handleFetch = () => {
    // Fixed URL for DTE circulars
    const url = 'https://dtek.karnataka.gov.in/info-4/Departmental+Circulars/kn';
    onScrapeUrl(url);
  };

  return (
    <div className="w-full max-w-md">
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Fetching Circulars...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            Fetch Recent Circulars
          </>
        )}
      </button>
    </div>
  );
}
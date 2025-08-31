import { ExternalLink, FileText, Download } from 'lucide-react';
import type { ScrapedData } from '../types';

interface ResultsDisplayProps {
  data: ScrapedData;
}

export function ResultsDisplay({ data }: ResultsDisplayProps) {
  return (
    <div className="w-full max-w-4xl">
      {/* Circulars Section */}
      {data.circulars && data.circulars.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Recent DTE Circulars ({data.circulars.length})
          </h3>
          <div className="space-y-4">
            {data.circulars.map((circular, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 leading-relaxed">
                      {circular.title}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {circular.date && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                          📅 {circular.date}
                        </span>
                      )}
                      {circular.orderNo && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                          📄 {circular.orderNo}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={circular.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {circular.link.toLowerCase().includes('.pdf') ? (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </>
                    )}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { formatDuration, parseReport, ReportActivity } from "@/helpers/utils/reports";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/helpers/utils/datetime-ui";

export type SearchResult = {
  date: Date;
  activity: ReportActivity;
  filePath: string;
};

interface SearchProps {
  reportsFolder: string | null;
  onResultClick: (date: Date) => void;
}

export const Search = ({ reportsFolder, onResultClick }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const searchReports = useCallback(
    async (query: string) => {
      if (!query.trim() || !reportsFolder) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results: SearchResult[] = [];
      const queryLower = query.toLowerCase();

      try {
        const searchPeriod = 90;
        const today = new Date();

        for (let i = 0; i < searchPeriod; i++) {
          const currentDate = new Date();
          currentDate.setDate(today.getDate() - i);

          const dayReport = await global.ipcRenderer.invoke(
            IPC_MAIN_CHANNELS.APP_READ_DAY_REPORT,
            reportsFolder,
            currentDate,
          );

          if (!dayReport) continue;

          const [parsedActivities] = parseReport(dayReport) as [ReportActivity[]];

          parsedActivities.forEach((activity) => {
            const projectMatch = activity.project?.toLowerCase().includes(queryLower);
            const activityMatch = activity.activity?.toLowerCase().includes(queryLower);
            const descriptionMatch = activity.description?.toLowerCase().includes(queryLower);

            if (projectMatch || activityMatch || descriptionMatch) {
              results.push({
                date: currentDate,
                activity,
                filePath: `${reportsFolder}/${currentDate.getFullYear()}/${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
              });
            }
          });
        }

        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [reportsFolder],
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchReports(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchReports]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.date);
    setIsExpanded(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative">
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="z-20 h-12 w-12 bg-gray-700 rounded-full fixed right-10 bottom-28 flex items-center justify-center transition-colors duration-300 hover:bg-gray-600"
          title="Search reports"
        >
          <span className="w-8 flex items-center justify-center text-white">
            <MagnifyingGlassIcon />
          </span>
        </button>
      )}

      {isExpanded && (
        <>
          <div className="z-30 w-96 bg-white dark:bg-dark-container rounded-lg shadow-xl border border-gray-200 dark:border-dark-border fixed right-10 bottom-28">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-gray-900 dark:text-dark-heading placeholder-gray-400"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-button-gray-hover rounded"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Searching...</div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No results found</div>
              ) : !searchQuery ? (
                <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                  Type to search through reports
                </div>
              ) : (
                searchResults.map((result, index) => (
                  <div
                    key={`${result.date.getTime()}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-dark-button-gray-hover cursor-pointer border-b border-gray-100 dark:border-dark-border last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-dark-heading">
                        {result.activity.project}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(result.date)}</span>
                    </div>
                    {result.activity.activity && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{result.activity.activity}</div>
                    )}
                    {result.activity.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                        {result.activity.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {result.activity.from} - {result.activity.to}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {formatDuration(result.activity.duration)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="p-2 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-dark-border">
                Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

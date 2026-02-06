import { useState, useEffect, useCallback } from "react";
import { formatDuration, parseReport } from "@/helpers/utils/reports";
import { ReportActivity } from "@/helpers/utils/types";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";
import { InformationCircleIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/helpers/utils/datetime-ui";
import Tooltip from "@/shared/Tooltip/Tooltip";

export type SearchResult = {
  date: Date;
  activity: ReportActivity;
  filePath: string;
};

type LogicalOperator = "&&" | "||";

type SearchTermType = "project" | "activity" | "general";

type AggregationType = "sum" | "avg";

type SearchAggregationSummary = {
  sum: number | null;
  avg: number | null;
};

type ParsedSearchTerm = {
  type: SearchTermType;
  value: string;
};

type ParsedSearchQuery = {
  terms: ParsedSearchTerm[];
  operators: LogicalOperator[];
  aggregations: Record<AggregationType, boolean>;
};

const DEFAULT_OPERATOR: LogicalOperator = "&&";
const SEARCH_HINT_TEXT = [
  "Examples:",
  '  proj:"project Name" && activity:review sum',
  '  "some part of description" || proj:internal avg',
  "",
  "Anchors: proj/project:<text>, activity:<text>",
  "Quotes: use \"\" or '' for phrases",
  "Operators: && (AND), || (OR)",
  "Aggregates: sum, avg, sum(duration), avg(duration)",
].join("\n");

const stripQuotes = (value: string) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const tokenizeQuery = (query: string) => {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < query.length; i++) {
    const char = query[i];

    if (quote) {
      current += char;
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "&" && query[i + 1] === "&") {
      if (current.trim()) tokens.push(current);
      tokens.push("&&");
      current = "";
      i++;
      continue;
    }

    if (char === "|" && query[i + 1] === "|") {
      if (current.trim()) tokens.push(current);
      tokens.push("||");
      current = "";
      i++;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.trim()) tokens.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) tokens.push(current);

  return tokens;
};

const parseOperatorToken = (token: string): LogicalOperator | null => {
  if (token === "&&" || token === "||") {
    return token;
  }

  const normalized = token.toLowerCase();
  if (normalized === "and") return "&&";
  if (normalized === "or") return "||";

  return null;
};

const parseAggregationToken = (token: string): AggregationType | null => {
  const normalized = token.toLowerCase();
  const functionMatch = normalized.match(/^(sum|avg)(?:\(([^)]+)\))?$/);

  if (functionMatch) {
    const field = functionMatch[2]?.trim();
    if (!field || field === "duration") {
      return functionMatch[1] as AggregationType;
    }
    return null;
  }

  const colonMatch = normalized.match(/^(sum|avg):(.+)$/);
  if (colonMatch) {
    const field = colonMatch[2]?.trim();
    if (!field || field === "duration") {
      return colonMatch[1] as AggregationType;
    }
  }

  return null;
};

const parseSearchTerm = (token: string): ParsedSearchTerm | null => {
  const colonIndex = token.indexOf(":");

  if (colonIndex > 0) {
    const key = token.slice(0, colonIndex).toLowerCase();
    const value = stripQuotes(token.slice(colonIndex + 1));
    if (!value) return null;

    if (key === "proj" || key === "project") {
      return { type: "project", value: value.toLowerCase() };
    }

    if (key === "activity") {
      return { type: "activity", value: value.toLowerCase() };
    }
  }

  const value = stripQuotes(token);
  if (!value) return null;

  return { type: "general", value: value.toLowerCase() };
};

const parseSearchQuery = (query: string): ParsedSearchQuery => {
  const tokens = tokenizeQuery(query);
  const terms: ParsedSearchTerm[] = [];
  const operators: LogicalOperator[] = [];
  const aggregations = { sum: false, avg: false };
  let lastWasTerm = false;

  tokens.forEach((token) => {
    const trimmed = token.trim();
    if (!trimmed) return;

    const operator = parseOperatorToken(trimmed);
    if (operator) {
      if (lastWasTerm) {
        operators.push(operator);
        lastWasTerm = false;
      }
      return;
    }

    const aggregation = parseAggregationToken(trimmed);
    if (aggregation) {
      aggregations[aggregation] = true;
      return;
    }

    const term = parseSearchTerm(trimmed);
    if (!term) return;

    if (lastWasTerm) {
      operators.push(DEFAULT_OPERATOR);
    }

    terms.push(term);
    lastWasTerm = true;
  });

  return { terms, operators, aggregations };
};

const matchesTerm = (term: ParsedSearchTerm, activity: ReportActivity) => {
  const project = activity.project?.toLowerCase() ?? "";
  const activityName = activity.activity?.toLowerCase() ?? "";
  const description = activity.description?.toLowerCase() ?? "";

  if (term.type === "project") {
    return project.includes(term.value);
  }

  if (term.type === "activity") {
    return activityName.includes(term.value);
  }

  return project.includes(term.value) || activityName.includes(term.value) || description.includes(term.value);
};

const evaluateTerms = (termResults: boolean[], operators: LogicalOperator[]) => {
  if (termResults.length === 0) return false;

  let current = termResults[0];
  const orGroups: boolean[] = [];

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    const next = termResults[i + 1] ?? false;

    if (operator === "&&") {
      current = current && next;
    } else {
      orGroups.push(current);
      current = next;
    }
  }

  orGroups.push(current);
  return orGroups.some(Boolean);
};

const buildAggregationSummary = (
  aggregations: ParsedSearchQuery["aggregations"],
  matchedDuration: number,
  matchedCount: number,
): SearchAggregationSummary | null => {
  if (!aggregations.sum && !aggregations.avg) return null;

  return {
    sum: aggregations.sum ? matchedDuration : null,
    avg: aggregations.avg ? (matchedCount ? matchedDuration / matchedCount : 0) : null,
  };
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
  const [searchSummary, setSearchSummary] = useState<SearchAggregationSummary | null>(null);

  const searchReports = useCallback(
    async (query: string) => {
      if (!query.trim() || !reportsFolder) {
        setSearchResults([]);
        setSearchSummary(null);
        return;
      }

      setIsSearching(true);
      const results: SearchResult[] = [];
      const parsedQuery = parseSearchQuery(query);

      if (parsedQuery.terms.length === 0) {
        setSearchResults([]);
        setSearchSummary(null);
        setIsSearching(false);
        return;
      }

      let matchedDuration = 0;
      let matchedCount = 0;

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
            const termResults = parsedQuery.terms.map((term) => matchesTerm(term, activity));
            const isMatch = evaluateTerms(termResults, parsedQuery.operators);

            if (isMatch) {
              results.push({
                date: currentDate,
                activity,
                filePath: `${reportsFolder}/${currentDate.getFullYear()}/${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
              });

              if (typeof activity.duration === "number") {
                matchedDuration += activity.duration;
                matchedCount += 1;
              }
            }
          });
        }

        setSearchResults(results);
        setSearchSummary(buildAggregationSummary(parsedQuery.aggregations, matchedDuration, matchedCount));
      } catch (err) {
        console.error("Search error:", err);
        setSearchSummary(null);
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
    setSearchSummary(null);
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
          <div className="z-30 w-[520px] max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-container rounded-lg shadow-xl border border-gray-200 dark:border-dark-border fixed right-10 bottom-28">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder='Search (proj:"Acme" activity:review && urgent || sum/avg)'
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
                    setSearchSummary(null);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-dark-button-gray-hover rounded"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
                <Tooltip tooltipText={SEARCH_HINT_TEXT} tooltipClassName="tooltip-search-hint">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-heading"
                    aria-label="Search tips"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchSummary &&
                searchQuery &&
                !isSearching &&
                (searchSummary.sum !== null || searchSummary.avg !== null) && (
                  <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                    {searchSummary.sum !== null && `Sum: ${formatDuration(searchSummary.sum)}`}
                    {searchSummary.sum !== null && searchSummary.avg !== null ? " | " : ""}
                    {searchSummary.avg !== null && `Avg: ${formatDuration(searchSummary.avg)}`}
                  </div>
                )}
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

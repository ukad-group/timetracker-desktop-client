import React, {
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Editor, Transforms, Range, createEditor, Descendant, Text, Path, Element as SlateElement, Node } from "slate";
import { withHistory } from "slate-history";
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";
import { CustomEditor } from "./types";
import { Portal } from "@headlessui/react";
import { getTimetrackerContactPersons } from "./utils";
import clsx from "clsx";
import { getReportWithCopiedLine } from "../ManualInputForm/utils";

type TextAreaWithSuggestionsProps = {
  className?: string;
  defaultValue: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  spellCheck?: boolean;
  disabled?: boolean;
  setSelectedDateReport: Dispatch<SetStateAction<string>>;
  report: string;
  projects: string[];
};

const stringToSlateValue = (text: string): Descendant[] => [
  {
    type: "paragraph",
    children: [{ text }],
  },
];

const isText = (node: Descendant): node is Text => "text" in node;

const nodeToString = (node: Descendant): string => {
  if (isText(node)) {
    return node.text;
  }
  return node.children.map(nodeToString).join("");
};

const slateValueToString = (value: Descendant[]): string => {
  return value.map(nodeToString).join("\n");
};

const TextAreaWithSuggestionsAsText = ({
  defaultValue,
  onChange,
  setSelectedDateReport,
  report,
  ...props
}: TextAreaWithSuggestionsProps) => {
  const suggestionRef = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [isProjectsMode, setIsProjectsMode] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [dynamicProjects, setDynamicProjects] = useState<string[]>(props.projects);
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(() => withReact(withHistory(createEditor())) as CustomEditor, []);

  const chars = useMemo(
    () => mentions.filter((c) => c.toLowerCase().startsWith(search.toLowerCase())).slice(0, 10),
    [search, mentions],
  );

  const projectsList = useMemo(
    () =>
      search.length > 0
        ? dynamicProjects.filter((c) => c.toLowerCase().startsWith(search.toLowerCase())).slice(0, 10)
        : dynamicProjects,
    [search, dynamicProjects],
  );

  // Unify active suggestion list for navigation and selection
  const activeList = isProjectsMode ? projectsList : chars;

  // Store the matched time pattern for project mode
  const timePatternRef = useRef("");

  const insertSuggestion = useCallback(
    (character: string) => {
      if (!target) return;

      Transforms.select(editor, target);

      if (isProjectsMode) {
        // Find the current block (paragraph) and the current line
        const { selection } = editor;
        if (selection) {
          const blockEntry = Editor.above(editor, {
            match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
          });
          if (blockEntry) {
            const [blockNode, blockPath] = blockEntry;
            const blockText = Node.string(blockNode);
            // Find the current line in the block
            const { anchor } = selection;
            const blockLines = blockText.split(/\r?\n/);
            // Calculate the offset of the anchor in the block
            let runningLength = 0;
            let lineIdx = 0;
            for (let i = 0; i < blockLines.length; i++) {
              if (anchor.offset <= runningLength + blockLines[i].length) {
                lineIdx = i;
                break;
              }
              runningLength += blockLines[i].length + 1;
            }
            const lineText = blockLines[lineIdx];
            // Replace only the project part: ' - oldProject' or ' - oldProject -' or directly after time
            const projectPatternFull = /^((?:[01]?\d|2[0-3]):[0-5]\d)\s-\s([^\-]*)\s-\s/;
            const projectPatternPartial = /^((?:[01]?\d|2[0-3]):[0-5]\d)\s-\s([^\n]*)$/;
            const projectPatternNoSpace = /^((?:[01]?\d|2[0-3]):[0-5]\d)([^\s-][^\n]*)$/;
            let newLine = lineText;
            let cursorOffset = 0;
            if (projectPatternFull.test(lineText)) {
              // Extract the time part for cursor calculation
              const match = lineText.match(projectPatternFull);
              const fullTime = match ? match[1] : "";
              newLine = lineText.replace(projectPatternFull, (_m, _fullTime) => `${fullTime} - ${character} - `);
              cursorOffset = `${fullTime} - ${character} - `.length;
            } else if (projectPatternPartial.test(lineText)) {
              // Handle '19:00 - tim' (no trailing dash)
              const match = lineText.match(projectPatternPartial);
              const fullTime = match ? match[1] : "";
              newLine = `${fullTime} - ${character} - `;
              cursorOffset = newLine.length;
            } else if (projectPatternNoSpace.test(lineText)) {
              // Handle '19:00tim' (no space or dash)
              const match = lineText.match(projectPatternNoSpace);
              const fullTime = match ? match[1] : "";
              newLine = `${fullTime} - ${character} - `;
              cursorOffset = newLine.length;
            } else {
              // fallback: if line is just time, or time plus dash, format as 'HH:MM - project - '
              const timeOnlyPattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
              const timeDashPattern = /^([01]?\d|2[0-3]):[0-5]\d\s-\s?$/;
              if (timeOnlyPattern.test(lineText.trim())) {
                newLine = `${lineText.trim()} - ${character} - `;
                cursorOffset = newLine.length;
              } else if (timeDashPattern.test(lineText.trim())) {
                newLine = `${lineText.trim()} ${character} - `;
                cursorOffset = newLine.length;
              } else {
                // fallback: just insert at the start
                newLine = `${character} - ${lineText}`;
                cursorOffset = `${character} - `.length;
              }
            }
            // Replace only the current line in the block
            blockLines[lineIdx] = newLine;
            const newBlockText = blockLines.join("\n");
            // Replace the block node's text
            Transforms.select(editor, Editor.range(editor, blockPath));
            Transforms.delete(editor, { at: Editor.range(editor, blockPath) });
            Transforms.insertText(editor, newBlockText);
            // Move cursor to just after ' - project - '
            const lineStartOffset = blockLines.slice(0, lineIdx).join("\n").length + (lineIdx > 0 ? 1 : 0);
            const cursorPosition = lineStartOffset + cursorOffset;
            const blockStartPoint = Editor.start(editor, blockPath);
            const point = { path: blockStartPoint.path, offset: cursorPosition };
            Transforms.select(editor, { anchor: point, focus: point });
          }
        }
      } else {
        const insertingText = "@" + character.split("-")[0].trim();
        Transforms.insertText(editor, insertingText);
      }

      Transforms.collapse(editor, { edge: "end" });
      setTarget(null);
      setIsProjectsMode(false);
      timePatternRef.current = "";
    },
    [editor, target, isProjectsMode],
  );

  const copyCurrentActivityToTheEnd = (event: KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (editor.selection) {
      const blockEntry = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      });
      if (blockEntry) {
        const [_, blockPath] = blockEntry;
        const blockText = Editor.string(editor, blockPath);
        const { anchor } = editor.selection;

        if (Path.isAncestor(blockPath, anchor.path)) {
          const offset = anchor.offset;
          const lines = blockText.split("\n");
          let runningLength = 0;

          for (const line of lines) {
            if (offset <= runningLength + line.length) {
              const reportWithCopiedLine = getReportWithCopiedLine(line, report);
              onChange(reportWithCopiedLine);

              // Replace the entire editor content with the new report
              const newValue = stringToSlateValue(reportWithCopiedLine);
              Transforms.removeNodes(editor, { at: [0] });
              Transforms.insertNodes(editor, newValue[0], { at: [0] });

              break;
            }
            runningLength += line.length + 1;
          }
        }
      }
    }
  };

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (target && activeList.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            setIndex((prev) => (prev >= activeList.length - 1 ? 0 : prev + 1));
            break;
          case "ArrowUp":
            event.preventDefault();
            setIndex((prev) => (prev <= 0 ? activeList.length - 1 : prev - 1));
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();
            insertSuggestion(activeList[index]);
            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            setIsProjectsMode(false);
            break;
        }
      }

      // No special handling for Backspace needed; dropdown logic is handled in handleOnChange

      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        copyCurrentActivityToTheEnd(event);
      }
    },
    [activeList, index, target, insertSuggestion, report],
  );

  useEffect(() => {
    if (!mentions.length) {
      getTimetrackerContactPersons(setMentions);
    }
  }, []);

  useEffect(() => {
    if (target && chars.length > 0 && suggestionRef.current) {
      const el = suggestionRef.current;
      try {
        const domRange = ReactEditor.toDOMRange(editor, target);
        const rect = domRange.getBoundingClientRect();
        el.style.top = `${rect.top + window.pageYOffset + 24}px`;
        el.style.left = `${rect.left + window.pageXOffset}px`;
      } catch (e) {
        console.error(e);
      }
    }
  }, [chars.length, editor, target]);

  const handleOnChange = useCallback(
    (value: Descendant[]) => {
      const text = slateValueToString(value);
      onChange(text);

      // Extract all project names from the textarea
      const projectRegex = /(?:[01]?\d|2[0-3]):[0-5]\d\s-\s([^\-\n]+)\s-\s/g;
      const foundProjects = new Set<string>(props.projects);
      let match;
      while ((match = projectRegex.exec(text)) !== null) {
        const project = match[1].trim();
        if (project && !foundProjects.has(project)) {
          foundProjects.add(project);
        }
      }
      setDynamicProjects(Array.from(foundProjects).sort((a, b) => a.localeCompare(b)));

      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const blockStart = Editor.start(editor, start.path);
        const rangeBefore = { anchor: blockStart, focus: start };
        const textBefore = Editor.string(editor, rangeBefore);

        const matchMention = textBefore.match(/@(\w*)$/);
        let matched = false;

        if (matchMention) {
          setSearch(matchMention[1]);
          const triggerStart = Editor.before(editor, start, {
            distance: matchMention[0].length,
            unit: "character",
          });
          if (triggerStart) {
            const triggerRange = { anchor: triggerStart, focus: start };
            setTarget(triggerRange);
            setIndex(0);
            setIsProjectsMode(false);
            matched = true;
          }
        } else {
          // Only check for project pattern if not a mention
          const lines = textBefore.split(/\r?\n/);
          const lastLine = lines[lines.length - 1];
          // Match pattern: HH:MM or HH:MM - or HH:MM - <search>
          const projectLineMatch = lastLine.match(/^([01]?\d|2[0-3]):[0-5]\d(?:\s-\s)?(.*)$/);
          if (projectLineMatch && dynamicProjects.length > 0) {
            const projectSearch = projectLineMatch[2] ? projectLineMatch[2].trim() : "";
            setSearch(projectSearch);
            // timePatternRef should be only the time and dash part
            timePatternRef.current = lastLine.slice(0, lastLine.length - projectSearch.length).trimEnd();
            // Find the start offset of the last line within the block text
            const blockText = Editor.string(editor, blockStart.path);
            const lastLineOffset = blockText.lastIndexOf(lastLine);
            const triggerStart = {
              path: start.path,
              offset: lastLineOffset,
            };
            const triggerRange = { anchor: triggerStart, focus: start };
            setIsProjectsMode(true);
            setTarget(triggerRange);
            setIndex(0);
            matched = true;
          }
        }
        if (!matched) {
          setTarget(null);
          setIsProjectsMode(false);
        }
      } else {
        setTarget(null);
        setIsProjectsMode(false);
      }
    },
    [editor, props.projects, dynamicProjects],
  );

  return (
    <Slate editor={editor} initialValue={stringToSlateValue(defaultValue)} onChange={handleOnChange}>
      <Editable
        {...props}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={onKeyDown}
        style={{ minHeight: "300px" }}
      />
      {target && activeList.length > 0 && (
        <Portal>
          <div
            ref={suggestionRef}
            className="-left-full -top-full absolute z-10 p-1 border border-gray-300 bg-white rounded-md shadow-sm dark:bg-dark-back dark:border-slate-600 dark:text-slate-200"
            data-cy="suggestions-portal"
          >
            {activeList.map((item, i) => (
              <button
                key={item}
                onClick={() => {
                  insertSuggestion(item);
                }}
                className={clsx("block w-full text-left cursor-pointer py-px px-1 rounded-sm", {
                  "bg-blue-600 text-white": i === index,
                })}
              >
                {item}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </Slate>
  );
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.code) {
    children = <code>{children}</code>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

const Element = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export default TextAreaWithSuggestionsAsText;

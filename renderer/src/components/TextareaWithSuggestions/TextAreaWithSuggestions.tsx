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
import { Editor, Transforms, Range, createEditor, Descendant, Text, Path, Element as SlateElement } from "slate";
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
  const [mentions, setMentions] = useState<string[]>([]);
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(() => withReact(withHistory(createEditor())) as CustomEditor, []);

  const chars = useMemo(
    () => mentions.filter((c: string) => c.toLowerCase().startsWith(search.toLowerCase())).slice(0, 10),
    [search, mentions],
  );

  const insertSuggestion = useCallback(
    (character: string) => {
      if (!target) return;

      Transforms.select(editor, target);
      const insertingText = "@" + character.split("-")[0].trim();
      Transforms.insertText(editor, insertingText);

      Transforms.collapse(editor, { edge: "end" });

      setTarget(null);
    },
    [editor, target],
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
      if (target && chars.length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            event.preventDefault();

            insertSuggestion(chars[index]);

            break;
          case "Escape":
            event.preventDefault();
            setTarget(null);
            break;
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        copyCurrentActivityToTheEnd(event);
      }
    },
    [chars, index, target, insertSuggestion, report],
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
      onChange(slateValueToString(value));
      const { selection, operations } = editor;

      const isInsertText = operations.some((op) => op.type === "insert_text");

      if (!isInsertText) {
        setTarget(null);
        return;
      }

      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const blockStart = Editor.start(editor, start.path);
        const rangeBefore = { anchor: blockStart, focus: start };
        const textBefore = Editor.string(editor, rangeBefore);

        const match = textBefore.match(/@(\w*)$/);

        if (match) {
          setSearch(match[1]);

          const triggerStart = Editor.before(editor, start, {
            distance: match[0].length,
            unit: "character",
          });

          if (triggerStart) {
            const triggerRange = { anchor: triggerStart, focus: start };
            setTarget(triggerRange);
            setIndex(0);
            return;
          }
        }
      }

      setTarget(null);
    },
    [editor],
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
      {target && chars.length > 0 && (
        <Portal>
          <div
            ref={suggestionRef}
            className="-left-full -top-full absolute z-10 p-1 border border-gray-300 bg-white rounded-md shadow-sm dark:bg-dark-back dark:border-slate-600 dark:text-slate-200"
            data-cy="suggestions-portal"
          >
            {chars.map((char, i) => (
              <button
                key={char}
                onClick={() => {
                  insertSuggestion(char);
                }}
                className={clsx("block w-full text-left cursor-pointer py-px px-1 rounded-sm", {
                  "bg-blue-600 text-white": i === index,
                })}
              >
                {char}
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

import useColorTheme from "@/helpers/hooks/useTheme";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import { StoredSection } from "./types";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import DragNDropIcon from "@/shared/DragNDropIcon/DragNDropIcon";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

const LayoutSection = () => {
  const { theme, setTheme } = useColorTheme();

  const sectionsOptions: StoredSection[] = JSON.parse(
    global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.WIDGET_ORDER),
  )
    ? JSON.parse(
        global.ipcRenderer.sendSync(IPC_MAIN_CHANNELS.ELECTRON_STORE_GET, LOCAL_STORAGE_VARIABLES.WIDGET_ORDER),
      )
    : [
        { id: "Date Selector", side: "left", order: 1 },
        { id: "Activities Table", side: "left", order: 2 },
        { id: "Calendar", side: "left", order: 3 },
        { id: "Manual InputForm", side: "right", order: 1 },
        { id: "Totals", side: "right", order: 2 },
        { id: "Bookings", side: "right", order: 3 },
        { id: "Update Description", side: "right", order: 4 },
      ];

  const distribution = (sectionsList: StoredSection[], side: "left" | "right") => {
    const tempSectionsList = [];
    sectionsList.forEach((element) => {
      if (element.side === side) {
        tempSectionsList[element.order - 1] = element;
      }
    });
    return tempSectionsList;
  };

  const [leftSections, setLeftSections] = useState(distribution(sectionsOptions, "left"));
  const [rightSections, setRightSections] = useState(distribution(sectionsOptions, "right"));

  const handleOnDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const draggedSection = result.draggableId;

    if (result.source.droppableId !== result.destination.droppableId) {
      const newLeftSections = leftSections;
      const newRightSections = rightSections;

      if (result.destination.droppableId === "right") {
        const draggedItem = leftSections.find((section) => section.id === draggedSection);
        draggedItem.side = "right";
        newRightSections.splice(destinationIndex, 0, draggedItem);
        newLeftSections.splice(sourceIndex, 1);
      } else {
        const draggedItem = rightSections.find((section) => section.id === draggedSection);
        draggedItem.side = "left";
        newLeftSections.splice(destinationIndex, 0, draggedItem);
        newRightSections.splice(sourceIndex, 1);
      }

      setLeftSections(
        newLeftSections.map((item, i) => {
          item.order = i + 1;
          return item;
        }),
      );
      setRightSections(
        newRightSections.map((item, i) => {
          item.order = i + 1;
          return item;
        }),
      );
    } else {
      const updatedSections = result.source.droppableId === "left" ? [...leftSections] : [...rightSections];
      const [draggedItem] = updatedSections.splice(sourceIndex, 1);
      updatedSections.splice(destinationIndex, 0, draggedItem);

      if (result.source.droppableId === "left") {
        setLeftSections(
          updatedSections.map((item, i) => {
            item.order = i + 1;
            return item;
          }),
        );
      } else {
        setRightSections(
          updatedSections.map((item, i) => {
            item.order = i + 1;
            return item;
          }),
        );
      }
    }
  };

  useEffect(() => {
    global.ipcRenderer.send(
      IPC_MAIN_CHANNELS.ELECTRON_STORE_SET,
      LOCAL_STORAGE_VARIABLES.WIDGET_ORDER,
      JSON.stringify([...leftSections, ...rightSections]),
    );
  }, [leftSections, rightSections]);

  return (
    <section className="h-full">
      <div className="overflow-y-auto h-full bg-white sm:rounded-lg p-2 flex flex-col gap-6 dark:bg-dark-container">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Theme</span>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="deviceTheme"
                aria-describedby="comments-description"
                defaultChecked={theme.os}
                name="deviceTheme"
                onClick={() => setTheme({ custom: theme.custom, os: !theme.os })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover"></div>
              <span className="ml-3 text-sm font-medium text-gray-500 dark:text-dark-main">Use device theme</span>
            </label>
          </div>
          <div className="flex items-center">
            <label
              className={clsx("relative inline-flex items-center cursor-pointer", {
                "opacity-10 cursor-auto": theme.os,
              })}
            >
              <input
                type="checkbox"
                value=""
                defaultChecked={theme.custom === "dark"}
                disabled={theme.os}
                onClick={() =>
                  setTheme({
                    custom: theme.custom === "light" ? "dark" : "light",
                    os: theme.os,
                  })
                }
                className="sr-only peer"
              />
              <div
                className={clsx(
                  "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-dark-button-back rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-button-hover",
                  {
                    "cursor-default after:bg-gray-200 after:border-gray-300 peer-checked:after:border-gray-300 dark:after:bg-gray-500 dark:after:border-gray-600 dark:peer-checked:after:border-gray-600 peer-checked:bg-gray-300 dark:peer-checked:bg-gray-600":
                      theme.os,
                  },
                )}
              />
              <span
                className={clsx("ml-3 text-sm font-medium text-gray-500 dark:text-dark-main", {
                  "cursor-default": theme.os,
                })}
              >
                Toggle to {theme.custom === "light" ? "dark" : "light"} theme
              </span>
            </label>
          </div>
        </div>
        <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Widgets Order</span>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="flex gap-6">
            <Droppable droppableId="left">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 rounded-lg pb-4 border border-gray-300 dark:border-dark-form-border"
                >
                  <span className="text-gray-700 font-medium bg-gray-300 dark:bg-dark-button-back-gray p-2 dark:text-dark-heading rounded-tl-md rounded-tr-md w-full block">
                    Left column
                  </span>
                  {leftSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <li
                          className="bg-gray-200 flex m-4 dark:bg-dark-button-back-gray rounded pr-4 py-3 text-gray-600 dark:text-white"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <DragNDropIcon />

                          <p>{section.id}</p>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
            <Droppable droppableId="right">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 rounded-lg pb-4 border border-gray-300 dark:border-dark-form-border"
                >
                  <span className="text-gray-700 font-medium bg-gray-300 dark:bg-dark-button-back-gray p-2 dark:text-dark-heading rounded-tl-md rounded-tr-md w-full block">
                    Right column
                  </span>
                  {rightSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <li
                          className="bg-gray-200 flex m-4 dark:bg-dark-button-back-gray rounded pr-4 py-3 text-gray-600 dark:text-white"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <DragNDropIcon />
                          <p>{section.id}</p>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>
    </section>
  );
};

export default LayoutSection;

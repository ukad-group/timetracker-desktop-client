import { useEffect, useState } from "react";
import { LOCAL_STORAGE_VARIABLES } from "@/helpers/constants";
import { StoredSection } from "./types";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import DragNDropIcon from "@/shared/DragNDropIcon/DragNDropIcon";
import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

const WidgetOrderSection = () => {
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
      <div className="overflow-y-auto bg-white sm:rounded-lg p-2 flex flex-col gap-6 dark:bg-dark-container">
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="flex gap-6">
            <Droppable droppableId="left">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 rounded-lg pb-4 border border-gray-500 dark:border-dark-form-border"
                >
                  <span className="dark:bg-dark-button-back-gray p-2 dark:text-dark-heading rounded-tl-md rounded-tr-md w-full block">
                    Left column
                  </span>
                  {leftSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <li
                          className="bg-gray-200 flex m-4 dark:bg-dark-button-back-gray rounded pr-4 py-3 text-white"
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
                  className="flex-1 rounded-lg pb-4 border border-gray-500 dark:border-dark-form-border"
                >
                  <span className="dark:bg-dark-button-back-gray p-2 dark:text-dark-heading rounded-tl-md rounded-tr-md w-full block">
                    Right column
                  </span>
                  {rightSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <li
                          className="bg-gray-200 flex m-4 dark:bg-dark-button-back-gray rounded pr-4 py-3 text-white"
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

export default WidgetOrderSection;

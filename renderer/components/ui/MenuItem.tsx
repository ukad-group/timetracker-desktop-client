import { ReactNode } from "react";

type MenuItemProps = {
  children: ReactNode;
  callback?: () => void;
  isActive?: boolean;
};

export default function MenuItem({
  children,
  callback,
  isActive,
}: MenuItemProps) {
  return (
    <button
      onClick={callback}
      className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-500 dark:text-dark-heading ${
        isActive &&
        "shadow-sm hover:no-underline bg-gray-100 hover:bg-gray-100 dark:bg-dark-button-back-gray dark:hover:bg-dark-button-back-gray"
      }, ${!isActive && "hover:underline"}`}
    >
      {children}
    </button>
  );
}

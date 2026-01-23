import React from "react";
import { RenderError } from "./types";

const ErrorPlaceholder = ({ errorTitle, errorMessage }: RenderError) => {
  return (
    <div className="py-2 text-center bg-white lg:col-start-1 lg:col-span-3 sm:rounded-lg h-full dark:bg-dark-container dark:border dark:border-dark-border">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-12 h-12 mx-auto text-red-500 dark:text-red-600/70"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        ></path>
      </svg>
      {errorTitle && <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-heading">{errorTitle}</h3>}
      {errorMessage && <p className="mt-1 px-48 text-sm text-gray-500 dark:text-dark-main">{errorMessage}</p>}
    </div>
  );
};

export default ErrorPlaceholder;

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Button } from "@/shared/Button";
import { ModalProps } from "./types";

const Modal = ({ isOpen, children, onSubmit, title, onClose }: ModalProps) => (
  <Transition.Root appear={true} show={isOpen} as={Fragment}>
    <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => null}>
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900/80" />
        </Transition.Child>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <form
            className="relative inline-block px-4 pt-5 pb-4  text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 dark:bg-dark-container dark:border dark:border-dark-border"
            onSubmit={onSubmit}
          >
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:bg-transparent"
                onClick={onClose}
                tabIndex={9}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-6 text-center sm:mt-0 sm:text-left">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-heading">
                {title}
              </Dialog.Title>
              {children}
            </div>
            <div className="mt-6 flex justify-end">
              <div className="flex gap-3">
                <div className="flex gap-3">
                  <Button text="Cancel" type={"button"} callback={onClose} status={"cancel"} tabIndex={8} />
                  <Button text="Save" type={"submit"} status={"enabled"} tabIndex={7} />
                </div>
              </div>
            </div>
          </form>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition.Root>
);

export default Modal;

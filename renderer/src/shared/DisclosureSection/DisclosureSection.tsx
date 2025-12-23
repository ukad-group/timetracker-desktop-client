import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { DisclosureSectionProps } from "./types";

const DisclosureSection = (props: DisclosureSectionProps) => {
  return (
    <div className="w-full">
      <Disclosure>
        {({ open }) => (
          <div
            ref={props.reference}
            className={clsx(
              "max-h-20 px-4 py-4 bg-white shadow overflow-hidden transition-[max-height] ease-linear duration-300 sm:rounded-lg sm:px-6 dark:bg-dark-container dark:border dark:border-dark-border",
              {
                "max-h-80 overflow-y-auto ": open,
              },
            )}
          >
            <DisclosureButton className=" w-full" onClick={props.toggleFunction}>
              <div className="flex justify-between cursor-pointer">
                <h2 className="text-lg font-medium text-gray-900 dark:text-dark-heading">{props.title}</h2>
                <ChevronDownIcon
                  className={clsx(
                    "transform transition-transform ease-linear duration-300 w-6 h-7 dark:text-gray-200",
                    {
                      "rotate-180": open,
                    },
                  )}
                  aria-hidden="true"
                />
              </div>
            </DisclosureButton>
            <DisclosurePanel static>{props.children}</DisclosurePanel>
          </div>
        )}
      </Disclosure>
    </div>
  );
};

export default DisclosureSection;

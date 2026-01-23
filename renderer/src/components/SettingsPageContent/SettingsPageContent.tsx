import { useEffect, useState } from "react";
import Link from "next/link";
import { MenuItem } from "@/shared/MenuItem";
import { ButtonTransparent } from "@/shared/ButtonTransparent";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { SidebarNavItem, SETTING_SECTIONS } from "@/helpers/constants";
import { closeWindowIfNeeded } from "@/helpers/utils/utils";
import useColorTheme from "@/helpers/hooks/useTheme";

const SettingsPageContent = () => {
  const [currentMenuItem, setCurrentMenuItem] = useState<SidebarNavItem>(SidebarNavItem.Connections);
  const settingSection = SETTING_SECTIONS[currentMenuItem];

  useEffect(() => {
    closeWindowIfNeeded();
  }, []);

  const renderSidebarNavItems = () =>
    Object.values(SidebarNavItem).map((value) => (
      <li key={value} className="text-lg font-medium text-gray-900 dark:text-dark-heading">
        <MenuItem callback={() => setCurrentMenuItem(value)} isActive={currentMenuItem === value}>
          {value}
        </MenuItem>
      </li>
    ));

  useColorTheme();

  return (
    <div className="w-full overflow-hidden h-screen bg-gray-100 dark:bg-dark-back">
      <div className="h-full overflow-hidden mx-auto sm:px-6 max-w-3xl lg:max-w-[1400px] flex flex-col gap-6 px-6 py-10 dark:bg-dark-back">
        <div className="h-full overflow-hidden flex flex-col gap-6 bg-white shadow sm:rounded-lg p-6 dark:bg-dark-container dark:border-dark-border">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-lg font-medium text-gray-900 dark:text-dark-heading">Settings</span>
              <span className="text-sm text-gray-500 dark:text-dark-main">
                Manage your settings and set preferences
              </span>
            </div>
            <Link href="/">
              <ButtonTransparent>
                <ChevronLeftIcon className="w-4 h-4" /> Back
              </ButtonTransparent>
            </Link>
          </div>
          <div className="border dark:border-dark-form-border"></div>
          <div className="h-full overflow-hidden inline-flex flex-col lg:grid lg:grid-cols-[250px_auto] gap-6">
            <nav>
              <ul className="flex flex-wrap lg:flex-col gap-2 lg:gap-3 rounded-md p-2 lg:p-3 ">
                {renderSidebarNavItems()}
              </ul>
            </nav>
            <div className="h-full overflow-hidden">{settingSection}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPageContent;

import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";

const Users = ({ users, onSignOutButton }) => (
  <div className="flex flex-col gap-2 w-full">
    {users.map((user) => (
      <div key={user.userId} className="flex gap-4 items-center">
        <div className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-300 text-blue-900 dark:text-blue-400 dark:bg-blue-400/20">
          {user.username}
        </div>
        <div
          onClick={() => onSignOutButton(user.userId)}
          className="cursor-pointer bg-gray-400 hover:bg-gray-500 transition duration-300 inline-flex gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium text-white dark:text-dark-heading dark:bg-dark-button-back-gray dark:hover:bg-dark-button-gray-hover"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4 fill-white dark:fill-dark-heading" />
          Sign Out
        </div>
      </div>
    ))}
  </div>
);

export default Users;

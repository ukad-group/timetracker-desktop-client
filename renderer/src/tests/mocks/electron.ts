import { IPC_MAIN_CHANNELS } from "@electron/helpers/constants";

export const ipcRendererSendMock = jest.fn((channel: string, ...args: any[]) => {
  switch (channel) {
    case IPC_MAIN_CHANNELS.ELECTRON_STORE_GET:
      return global.localStorage.getItem(args[0]);

    case IPC_MAIN_CHANNELS.ELECTRON_STORE_SET:
      global.localStorage.setItem(args[0], args[1]);
      break;

    case IPC_MAIN_CHANNELS.ELECTRON_STORE_DELETE:
      global.localStorage.removeItem(args[0]);
      break;

    case IPC_MAIN_CHANNELS.ELECTRON_STORE_CLEAR:
      global.localStorage.clear();
      break;

    case IPC_MAIN_CHANNELS.GET_CURRENT_PORT:
      return 0;

    default:
      return;
  }
});

export const globalIpcRendererMock = { ...global.ipcRenderer };

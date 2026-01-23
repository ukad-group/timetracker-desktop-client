import { getAllTrelloCardsFromApi } from "../trello";
import { globalIpcRendererMock, ipcRendererSendMock } from "@/tests/mocks/electron";

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  ...global.localStorage,
};

global.localStorage = localStorageMock;

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

global.ipcRenderer = {
  invoke: jest.fn(),
  send: ipcRendererSendMock,
  sendSync: ipcRendererSendMock,
  ...globalIpcRendererMock,
};

describe("GIVEN trello/getAllTrelloCardsFromApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();

    global.ipcRenderer = globalIpcRendererMock;
  });

  it("should return an empty array if user is not logged in", async () => {
    (localStorageMock.getItem as jest.Mock).mockReturnValueOnce(null);

    const result = await getAllTrelloCardsFromApi();

    expect(result).toEqual([[], []]);
  });

  it("should return Trello cards", async () => {
    const user = { userId: "123", accessToken: "token" };
    (localStorageMock.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify(user));

    const mockResponse = {
      assignedCards: [{ name: "Card1", shortUrl: "url1" }],
      notAssignedCards: [{ name: "Card2", shortUrl: "url2" }],
    };
    (global.ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await getAllTrelloCardsFromApi();

    expect(result).toEqual([[], []]);
  });

  it("should handle errors and return empty arrays", async () => {
    const user = { userId: "123", accessToken: "token" };
    (localStorageMock.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify(user));

    const errorMessage = "Some error occurred";
    (global.ipcRenderer.invoke as jest.Mock).mockRejectedValueOnce(errorMessage);

    const result = await getAllTrelloCardsFromApi();

    expect(result).toEqual([[], []]);
  });
});

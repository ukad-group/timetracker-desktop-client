describe("onlineStatus", () => {
  const loadOnlineStatus = async () => {
    jest.resetModules();
    return import("../onlineStatus");
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it("returns false immediately when navigator.onLine is false", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    global.fetch = jest.fn();

    const { isOnline } = await loadOnlineStatus();
    const result = await isOnline();

    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns true when at least one connectivity probe succeeds", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { isOnline } = await loadOnlineStatus();
    const result = await isOnline();

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("returns false when all connectivity probes fail", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    global.fetch = jest.fn().mockRejectedValue(new Error("network error"));

    const { isOnline } = await loadOnlineStatus();
    const result = await isOnline();

    expect(result).toBe(false);
  });

  it("uses cached result within TTL without re-probing", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { isOnline } = await loadOnlineStatus();

    await isOnline();
    await isOnline();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

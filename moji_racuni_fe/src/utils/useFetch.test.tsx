import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthContext from "../context/AuthContext";
import useFetch from "./useFetch";

const base64url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const makeToken = (expiresInSeconds: number) =>
  [
    base64url({ alg: "HS256", typ: "JWT" }),
    base64url({
      user_id: "1",
      username: "regular",
      role: "REGULAR",
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      iat: Math.floor(Date.now() / 1000),
    }),
    "potpis",
  ].join(".");

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const setup = () => {
  const storeAuthTokens = vi.fn();
  const logoutUser = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider
      value={{
        user: null,
        authTokens: null,
        storeAuthTokens,
        loginUser: async () => undefined,
        registerUser: async () => undefined,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
  // Dva nezavisna hook-a, kao dva upita na istoj strani
  const first = renderHook(() => useFetch(), { wrapper }).result.current;
  const second = renderHook(() => useFetch(), { wrapper }).result.current;
  return { first, second, storeAuthTokens, logoutUser };
};

describe("useFetch", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    localStorage.clear();
  });

  it("paralelni zahtevi sa isteklim tokenom čekaju jedan zajednički refresh", async () => {
    const newTokens = { access: makeToken(1800), refresh: "novi-refresh" };
    localStorage.setItem(
      "authTokens",
      JSON.stringify({ access: makeToken(-60), refresh: "stari-refresh" }),
    );
    fetchMock.mockImplementation(async (input) => {
      if (String(input).endsWith("/api/token/refresh/")) {
        return jsonResponse(200, newTokens);
      }
      return jsonResponse(200, { ok: true });
    });
    const { first, second, storeAuthTokens, logoutUser } = setup();

    const results = await Promise.all([
      first("/api/company/types/"),
      second("/api/receipts/last/"),
      first("/api/reports/last/"),
    ]);

    const refreshCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).endsWith("/api/token/refresh/"),
    );
    expect(refreshCalls).toHaveLength(1);
    expect(JSON.parse(String(refreshCalls[0]?.[1]?.body))).toEqual({
      refresh: "stari-refresh",
    });
    expect(results.map(({ response }) => response.status)).toEqual([
      200, 200, 200,
    ]);
    // Svi zahtevi idu sa novim access tokenom
    const apiCalls = fetchMock.mock.calls.filter(
      ([input]) => !String(input).endsWith("/api/token/refresh/"),
    );
    for (const [, init] of apiCalls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        `Bearer ${newTokens.access}`,
      );
    }
    expect(JSON.parse(localStorage.getItem("authTokens") ?? "{}")).toEqual(
      newTokens,
    );
    expect(storeAuthTokens).toHaveBeenCalledWith(newTokens);
    expect(logoutUser).not.toHaveBeenCalled();
  });

  it("neuspešan refresh odjavljuje korisnika", async () => {
    localStorage.setItem(
      "authTokens",
      JSON.stringify({ access: makeToken(-60), refresh: "ponisten" }),
    );
    fetchMock.mockResolvedValue(jsonResponse(401, { code: "token_not_valid" }));
    const { first, logoutUser } = setup();

    const { response } = await first("/api/company/types/");

    expect(response.status).toBe(401);
    expect(logoutUser).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("važeći token se šalje bez refresh-a", async () => {
    const access = makeToken(1800);
    localStorage.setItem(
      "authTokens",
      JSON.stringify({ access, refresh: "refresh" }),
    );
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    const { first } = setup();

    await first("/api/company/types/");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBe(`Bearer ${access}`);
  });
});

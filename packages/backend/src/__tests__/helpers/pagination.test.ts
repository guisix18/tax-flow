import { describe, it, expect } from "vitest";
import { buildPaginationArgs, buildPaginationMeta } from "@/helpers/pagination";

describe("buildPaginationArgs", () => {
  it("returns skip=0 and correct take on first page", () => {
    expect(buildPaginationArgs({ page: 1, ipp: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it("calculates skip correctly on page 2", () => {
    expect(buildPaginationArgs({ page: 2, ipp: 20 })).toEqual({ skip: 20, take: 20 });
  });

  it("calculates skip correctly on page 3", () => {
    expect(buildPaginationArgs({ page: 3, ipp: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it("respects custom ipp", () => {
    expect(buildPaginationArgs({ page: 2, ipp: 10 })).toEqual({ skip: 10, take: 10 });
  });
});

describe("buildPaginationMeta", () => {
  it("calculates total_pages correctly", () => {
    const meta = buildPaginationMeta(47, { page: 1, ipp: 20 });
    expect(meta.total_pages).toBe(3);
  });

  it("returns total_pages=0 when total is 0", () => {
    const meta = buildPaginationMeta(0, { page: 1, ipp: 20 });
    expect(meta.total_pages).toBe(0);
  });

  it("returns total_pages=1 when total fits exactly in one page", () => {
    const meta = buildPaginationMeta(20, { page: 1, ipp: 20 });
    expect(meta.total_pages).toBe(1);
  });

  it("echoes back page and ipp", () => {
    const meta = buildPaginationMeta(100, { page: 3, ipp: 10 });
    expect(meta.page).toBe(3);
    expect(meta.ipp).toBe(10);
    expect(meta.total).toBe(100);
  });
});

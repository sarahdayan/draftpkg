import { describe, expect, it } from "vitest";

import { parseCiConfig } from "../ci-config";

describe("parseCiConfig", () => {
  it("returns defaults when given an empty object", () => {
    const config = parseCiConfig({});

    expect(config).toEqual({
      installCommand: "install",
      buildCommand: "build",
      packages: ["."],
      publishDirectory: {},
      node: "24",
    });
  });

  it("parses a full config", () => {
    const config = parseCiConfig({
      installCommand: "ci",
      buildCommand: "build:prod",
      packages: ["packages/react", "packages/react-dom"],
      publishDirectory: {
        react: "build/node_modules/react",
        "react-dom": "build/node_modules/react-dom",
      },
      node: "20",
    });

    expect(config).toEqual({
      installCommand: "ci",
      buildCommand: "build:prod",
      packages: ["packages/react", "packages/react-dom"],
      publishDirectory: {
        react: "build/node_modules/react",
        "react-dom": "build/node_modules/react-dom",
      },
      node: "20",
    });
  });

  it("allows `installCommand` to be `false`", () => {
    const config = parseCiConfig({ installCommand: false });

    expect(config.installCommand).toBe(false);
  });

  it("allows `buildCommand` to be `false`", () => {
    const config = parseCiConfig({ buildCommand: false });

    expect(config.buildCommand).toBe(false);
  });

  it("supports glob patterns in packages", () => {
    const config = parseCiConfig({ packages: ["packages/*"] });

    expect(config.packages).toEqual(["packages/*"]);
  });

  it("throws on invalid `installCommand` type", () => {
    expect(() => parseCiConfig({ installCommand: 123 })).toThrow(
      "`installCommand` must be a string or `false`",
    );
  });

  it("throws on invalid `buildCommand` type", () => {
    expect(() => parseCiConfig({ buildCommand: 123 })).toThrow(
      "`buildCommand` must be a string or `false`",
    );
  });

  it("throws on invalid packages type", () => {
    expect(() => parseCiConfig({ packages: "not-an-array" })).toThrow(
      "`packages` must be an array of strings",
    );
  });

  it("throws on invalid node version", () => {
    expect(() => parseCiConfig({ node: 18 })).toThrow(
      "`node` must be a string",
    );
  });

  it("throws on invalid `publishDirectory` type", () => {
    expect(() => parseCiConfig({ publishDirectory: "flat" })).toThrow(
      "`publishDirectory` must be an object mapping package names to directories",
    );
  });
});

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The browser tab title and the social-share title live in the static
 * `index.html` shell, outside the React tree, so they are asserted here by
 * reading the file the Vite build ships. Vitest runs with the frontend package
 * as its working directory, so `index.html` resolves from there.
 */
const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function metaContent(property: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
  );
  return indexHtml.match(pattern)?.[1] ?? null;
}

describe("index.html document metadata", () => {
  it("titles the browser tab with the new brand name", () => {
    const title = indexHtml.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";

    expect(title).toContain("HR SOLUCIONES INTEGRALES");
    expect(title).not.toMatch(/Taller N[o]?r?cturno/);
  });

  it("uses the new brand name for the social-share title", () => {
    const ogTitle = metaContent("og:title");

    expect(ogTitle).toContain("HR SOLUCIONES INTEGRALES");
    expect(ogTitle).not.toMatch(/Taller N[o]?r?cturno/);
  });

  it("keeps the share description free of the old brand name", () => {
    const description = metaContent("og:description");

    expect(description).not.toBeNull();
    expect(description).not.toMatch(/Taller N[o]?r?cturno/);
  });

  // --- Characterization: the shell identity the installable-app work keeps --
  //
  // The accepted change declares the app's installable identity (name, icons,
  // theme color) so it can be added to the home screen. These tests protect the
  // shell metadata that must survive that change: the mobile viewport that
  // makes the app usable on a phone, and the existing favicon link. They never
  // assert the new manifest or icon tags, which the change adds.

  it("keeps the mobile viewport that makes the app usable on a phone", () => {
    const viewport = indexHtml.match(
      /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/,
    )?.[1];

    expect(viewport).toBeDefined();
    expect(viewport).toContain("width=device-width");
    expect(viewport).toContain("initial-scale=1.0");
  });

  it("keeps the existing favicon link in the document head", () => {
    expect(indexHtml).toMatch(
      /<link[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.ico["']/,
    );
  });

  it("keeps the Spanish document language", () => {
    expect(indexHtml).toMatch(/<html[^>]*lang=["']es["']/);
  });

  // --- Accepted behavior: the installable-app identity ----------------------
  //
  // The accepted change declares the app's installable identity so it can be
  // added to the home screen. These tests pin the shell metadata that makes
  // that possible: the manifest link, the Apple touch icon, the theme color,
  // and the mobile-web-app-capable flags.

  it("links the web app manifest", () => {
    expect(indexHtml).toMatch(
      /<link[^>]*rel=["']manifest["'][^>]*href=["']\/manifest\.webmanifest["']/,
    );
  });

  it("declares the Apple touch icon for the home screen", () => {
    expect(indexHtml).toMatch(
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']\/icons\/apple-touch-icon\.png["']/,
    );
  });

  it("declares the brand theme color", () => {
    const themeColor = indexHtml.match(
      /<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']*)["']/,
    )?.[1];

    expect(themeColor).toBe("#05773b");
  });

  it("declares the app as installable on mobile", () => {
    expect(indexHtml).toMatch(
      /<meta[^>]*name=["']mobile-web-app-capable["'][^>]*content=["']yes["']/,
    );
    expect(indexHtml).toMatch(
      /<meta[^>]*name=["']apple-mobile-web-app-capable["'][^>]*content=["']yes["']/,
    );
  });

  it("declares the iOS home-screen title and status bar style", () => {
    const title = indexHtml.match(
      /<meta[^>]*name=["']apple-mobile-web-app-title["'][^>]*content=["']([^"']*)["']/,
    )?.[1];
    expect(title).toBe("HR Soluciones");
    expect(indexHtml).toMatch(
      /<meta[^>]*name=["']apple-mobile-web-app-status-bar-style["'][^>]*content=["']default["']/,
    );
  });
});

/**
 * The web app manifest is the file the browser reads to install the app, so it
 * is asserted here by reading the file the Vite build ships from `public/`.
 */
const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/manifest.webmanifest"), "utf8"),
) as {
  name: string;
  short_name: string;
  display: string;
  theme_color: string;
  background_color: string;
  start_url: string;
  icons: Array<{ src: string; sizes: string; purpose?: string }>;
};

/**
 * Resolves a `public/`-relative asset path (e.g. `/icons/icon-192.png`) to the
 * file the Vite build copies into the bundle. Vitest runs with the frontend
 * package as its working directory, so `public/` resolves from there.
 */
function publicAsset(publicPath: string): string {
  return resolve(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

describe("manifest.webmanifest installable identity", () => {
  it("names the app with the new brand", () => {
    expect(manifest.name).toBe("HR Soluciones Integrales");
    expect(manifest.short_name).toBe("HR Soluciones");
  });

  it("opens standalone from the app root", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
  });

  it("uses the brand theme color", () => {
    expect(manifest.theme_color).toBe("#05773b");
  });

  it("ships the 192 and 512 icons plus a maskable icon", () => {
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(
      true,
    );
  });

  it("uses the brand color as the splash background", () => {
    expect(manifest.background_color).toBe("#05773b");
  });

  // --- Accepted behavior: the declared icons actually ship ------------------
  //
  // The manifest and the document head reference icon files by path. A declared
  // icon whose file is missing breaks the home-screen install silently — the
  // manifest still parses and the metadata tests above still pass — so the
  // referenced files are asserted to exist on disk here.

  it("ships every icon file the manifest references", () => {
    for (const icon of manifest.icons) {
      expect(existsSync(publicAsset(icon.src)), `${icon.src} is missing`).toBe(
        true,
      );
    }
  });

  it("ships the Apple touch icon the document head references", () => {
    expect(
      existsSync(publicAsset("/icons/apple-touch-icon.png")),
      "/icons/apple-touch-icon.png is missing",
    ).toBe(true);
  });
});

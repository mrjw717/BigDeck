// ============================================================================
// AppScanner — desktop-file parser + PATH scan for the auto-switch app picker
//
// Desktop entries are parsed from REAL fixture files written to a temp
// applications dir (inline .desktop content — the same shapes found under
// /usr/share/applications). CLI scanning runs against injected fakes so no
// real PATH is touched.
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import {
  AppScanner,
  parseDesktopEntry,
  DEFAULT_CLI_RESULT_CAP,
  type AppScannerDeps,
} from "./AppScanner";

// --- desktop-file fixtures (inline, as the spec/distros ship them) ---------

const FIREFOX_DESKTOP = `
[Desktop Entry]
Type=Application
Name=Firefox Web Browser
Exec=firefox %u
Icon=firefox
StartupWMClass=Navigator
Comment=Browse the Web

[Desktop Action NewWindow]
Name=Open a New Window
Exec=firefox --new-window %u
`;

const CODEX_DESKTOP = `
# A comment line
[Desktop Entry]
Type=Application

Name=Codex
Exec=codex %f
Icon=utilities-terminal
`;

const HIDDEN_DESKTOP = `
[Desktop Entry]
Type=Application
Name=Hidden Tool
Exec=hidetool
NoDisplay=true
`;

const GONE_DESKTOP = `
[Desktop Entry]
Type=Application
Name=Hidden Entry
Exec=gone
Hidden=true
`;

const LOCALIZED_DESKTOP = `
[Desktop Entry]
Name=Files
Name[de]=Dateien
Name[fr_FR]=Fichiers
Exec=nautilus %U
Icon=system-file-manager
`;

// --- parseDesktopEntry (the hand-rolled INI reader) ------------------------

describe("parseDesktopEntry", () => {
  it("extracts keys from [Desktop Entry] and ignores later sections", () => {
    const entry = parseDesktopEntry(FIREFOX_DESKTOP);

    expect(entry).not.toBeNull();
    expect(entry!.Name).toBe("Firefox Web Browser");
    expect(entry!.Exec).toBe("firefox %u");
    expect(entry!.StartupWMClass).toBe("Navigator");
    // The [Desktop Action NewWindow] section must NOT leak in — the Exec
    // from the action stays out of the Desktop Entry's table.
    expect(entry!.Exec).not.toBe("firefox --new-window %u");
  });

  it("keeps %f-style field codes intact in Exec", () => {
    expect(parseDesktopEntry(CODEX_DESKTOP)!.Exec).toBe("codex %f");
  });

  it("splits on the FIRST = and skips comments and blanks", () => {
    const entry = parseDesktopEntry(
      [
        "[Desktop Entry]",
        "# comment",
        "",
        "Exec=sh -c 'echo a=b'",
        "X-Junk",
      ].join("\n"),
    )!;
    expect(entry.Exec).toBe("sh -c 'echo a=b'");
    expect(entry).not.toHaveProperty("X-Junk");
  });

  it("ignores locale-variant keys (plain Name wins)", () => {
    const entry = parseDesktopEntry(LOCALIZED_DESKTOP)!;
    expect(entry.Name).toBe("Files");
    expect(entry).not.toHaveProperty("Name[de]");
  });

  it("returns null when there is no [Desktop Entry] section", () => {
    expect(parseDesktopEntry("[Other Section]\nName=X")).toBeNull();
    expect(parseDesktopEntry("just some text")).toBeNull();
  });
});

// --- listDesktopApps (real temp fixture dirs) -------------------------------

describe("AppScanner.listDesktopApps", () => {
  let systemDir: string;
  let userDir: string;

  beforeEach(async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "appscanner-"));
    systemDir = path.join(tmp, "system-applications");
    userDir = path.join(tmp, "user-applications");
    await fsp.mkdir(systemDir, { recursive: true });
    await fsp.mkdir(userDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(path.dirname(systemDir), { recursive: true, force: true });
  });

  function makeScanner(): AppScanner {
    return new AppScanner({
      appsDirs: () => [systemDir, userDir], // user-local overrides system
      pathEnv: () => "",
    });
  }

  it("extracts name/icon/exec/StartupWMClass and sorts by Name", async () => {
    await fsp.writeFile(
      path.join(systemDir, "firefox.desktop"),
      FIREFOX_DESKTOP,
    );
    await fsp.writeFile(path.join(systemDir, "codex.desktop"), CODEX_DESKTOP);

    const apps = await makeScanner().listDesktopApps();

    expect(apps.map((a) => a.name)).toEqual(["Codex", "Firefox Web Browser"]);
    const firefox = apps[1];
    expect(firefox.desktopFileId).toBe("firefox.desktop");
    expect(firefox.icon).toBe("firefox");
    expect(firefox.startupWMClass).toBe("Navigator");
  });

  it("skips NoDisplay=true and Hidden=true entries", async () => {
    await fsp.writeFile(path.join(systemDir, "hidden.desktop"), HIDDEN_DESKTOP);
    await fsp.writeFile(path.join(systemDir, "gone.desktop"), GONE_DESKTOP);
    await fsp.writeFile(path.join(systemDir, "codex.desktop"), CODEX_DESKTOP);

    const apps = await makeScanner().listDesktopApps();

    expect(apps.map((a) => a.desktopFileId)).toEqual(["codex.desktop"]);
  });

  it("lets the user-local dir override a system entry with the same id", async () => {
    await fsp.writeFile(path.join(systemDir, "codex.desktop"), CODEX_DESKTOP);
    await fsp.writeFile(
      path.join(userDir, "codex.desktop"),
      CODEX_DESKTOP.replace("Name=Codex", "Name=Codex (custom)"),
    );

    const apps = await makeScanner().listDesktopApps();

    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Codex (custom)");
  });

  it("falls back to the id without .desktop when Name is missing", async () => {
    await fsp.writeFile(
      path.join(systemDir, "weird-tool.desktop"),
      "[Desktop Entry]\nType=Application\n",
    );

    const apps = await makeScanner().listDesktopApps();

    expect(apps[0].name).toBe("weird-tool");
  });

  it("ignores non-.desktop files and skips missing dirs gracefully", async () => {
    await fsp.writeFile(path.join(systemDir, "codex.desktop"), CODEX_DESKTOP);
    await fsp.writeFile(path.join(systemDir, "README"), "not a desktop file");

    const scanner = new AppScanner({
      appsDirs: () => [
        "/does/not/exist", // absent dir — must be skipped, not throw
        systemDir,
      ],
      pathEnv: () => "",
    });

    const apps = await scanner.listDesktopApps();
    expect(apps.map((a) => a.desktopFileId)).toEqual(["codex.desktop"]);
  });
});

// --- listCliTools (fake deps — no real PATH touched) ------------------------

function fakeDeps(opts: {
  dirs: Record<string, string[]>;
  executables: Set<string>;
  pathEnv: string;
}): AppScannerDeps {
  return {
    appsDirs: () => [],
    pathEnv: () => opts.pathEnv,
    readTextFile: async () => "",
    listDir: async (dir) => {
      const names = opts.dirs[dir];
      if (!names) throw new Error(`ENOENT: ${dir}`);
      return names;
    },
    isExecutableFile: (filePath) => opts.executables.has(filePath),
  };
}

describe("AppScanner.listCliTools", () => {
  it("returns only executable regular files, deduped by name (first dir wins)", async () => {
    const binA = "/bin-a";
    const binB = "/bin-b";
    const scanner = new AppScanner(
      fakeDeps({
        dirs: {
          [binA]: ["codex", "vim", "notes.txt", "libdir"],
          [binB]: ["codex", "htop"], // codex duplicated in an earlier dir
        },
        executables: new Set([
          path.join(binA, "codex"),
          path.join(binA, "vim"),
          path.join(binB, "codex"),
          path.join(binB, "htop"),
          // notes.txt / libdir are NOT executable → skipped
        ]),
        pathEnv: `${binA}:${binB}`,
      }),
    );

    const tools = await scanner.listCliTools();

    expect(tools.map((t) => t.name)).toEqual(["codex", "htop", "vim"]);
    expect(tools.find((t) => t.name === "codex")?.path).toBe(
      path.join(binA, "codex"),
    );
  });

  it("skips missing PATH dirs and an empty PATH", async () => {
    const scanner = new AppScanner(
      fakeDeps({
        dirs: {},
        executables: new Set(),
        pathEnv: "/gone1::/gone2",
      }),
    );
    expect(await scanner.listCliTools()).toEqual([]);

    expect(
      await new AppScanner(fakeDeps({ dirs: {}, executables: new Set(), pathEnv: "" })).listCliTools(),
    ).toEqual([]);
  });

  it("caps results at DEFAULT_CLI_RESULT_CAP", async () => {
    const bin = "/tools";
    const names = Array.from({ length: DEFAULT_CLI_RESULT_CAP + 50 }, (_, i) => `tool${i}`);
    const executables = new Set(names.map((n) => path.join(bin, n)));
    const scanner = new AppScanner(
      fakeDeps({ dirs: { [bin]: names }, executables, pathEnv: bin }),
    );

    const tools = await scanner.listCliTools();
    expect(tools).toHaveLength(DEFAULT_CLI_RESULT_CAP);
  });
});

import { app, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

export class IconFetcher {
    private static assetsDir = path.join(app.getPath('userData'), 'assets');

    /**
     * Fetch a favicon for a given URL and save it to the assets directory
     */
    static async fetchFavicon(url: string): Promise<string | null> {
        try {
            const domain = new URL(url).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            const fileName = `favicon-${domain}.png`;
            const destPath = path.join(this.assetsDir, fileName);

            // Ensure assets directory exists
            await fs.mkdir(this.assetsDir, { recursive: true });

            const response = await fetch(faviconUrl);
            if (!response.ok) return null;

            const buffer = await response.arrayBuffer();
            await fs.writeFile(destPath, Buffer.from(buffer));

            return fileName;
        } catch (error) {
            console.error(`Failed to fetch favicon for ${url}:`, error);
            return null;
        }
    }

    /**
     * Try to find an icon for a Linux application
     */
    static async fetchAppIcon(appPathOrName: string): Promise<string | null> {
        // On Linux, we can try to find .desktop files in common locations
        const desktopDirs = [
            '/usr/share/applications',
            '/usr/local/share/applications',
            path.join(app.getPath('home'), '.local/share/applications')
        ];

        const baseName = path.basename(appPathOrName).toLowerCase();

        try {
            for (const dir of desktopDirs) {
                try {
                    const files = await fs.readdir(dir);
                    const desktopFile = files.find(f => f.toLowerCase().includes(baseName) && f.endsWith('.desktop'));

                    if (desktopFile) {
                        const content = await fs.readFile(path.join(dir, desktopFile), 'utf-8');
                        const iconLine = content.split('\n').find(line => line.startsWith('Icon='));
                        if (iconLine) {
                            const iconName = iconLine.split('=')[1].trim();

                            // If it's an absolute path, copy it
                            if (iconName.startsWith('/')) {
                                const ext = path.extname(iconName) || '.png';
                                const fileName = `app-${baseName}${ext}`;
                                await fs.mkdir(this.assetsDir, { recursive: true });
                                await fs.copyFile(iconName, path.join(this.assetsDir, fileName));
                                return fileName;
                            }

                            // Otherwise it's a theme icon name, which is harder to resolve without a library
                            // For now, we'll just return null or try to find it in /usr/share/icons
                            return null;
                        }
                    }
                } catch {
                    continue;
                }
            }
        } catch (error) {
            console.error(`Failed to find app icon for ${appPathOrName}:`, error);
        }

        return null;
    }
}

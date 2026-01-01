import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';

import { GithubRelease, GithubAsset, YoutubeVideoInfo, IYTDownloadService } from '../shared';

class YTDowloadService implements IYTDownloadService {
  #repository: string;

  constructor() {
    this.#repository = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest';
  }

  #getRootDirectory = (): string => {
    const root =
      process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../..', 'resources')
        : path.join(process.resourcesPath);

    return root;
  };

  #getLatestRelease = async (): Promise<GithubRelease> => {
    const releaseInfo = await fetch(this.#repository, {
      method: 'GET',
      headers: { 'User-Agent': 'electron-app' },
    }).then((data) => data.json());

    return releaseInfo;
  };

  #downloadFile = async (url: string, fileName: string): Promise<void> => {
    const response = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'electron-app' } });
    await writeFile(fileName, Readable.fromWeb(response.body as ReadableStream<any>));
  };

  CheckUpdates = async (): Promise<void> => {
    console.log('[info]: checking for updates...');

    const release = await this.#getLatestRelease();
    const version = release.tag_name;

    const asset = release.assets.find((e: GithubAsset) => e.name === 'yt-dlp.exe');
    if (!asset) {
      throw new Error('No suitable release was found');
    }

    const rootPath = this.#getRootDirectory();
    const execPath = path.join(rootPath, 'yt-dlp.exe');
    const versionFile = path.join(rootPath, 'yt-dlp.version');

    const installedVersion = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8') : '';

    if (installedVersion === version && fs.existsSync(execPath)) {
      console.log('[info]: yt-dlp is up to date');
      return;
    }

    console.log('[info]: downloading latest release..');
    await this.#downloadFile(asset.browser_download_url, execPath);

    fs.writeFileSync(versionFile, version);
    console.log('[info]: yt-dlp updated');
  };

  FetchInfo = async (url: string): Promise<YoutubeVideoInfo> => {
    console.log(`[info]: fetching ${url}`);
    const execPath = path.join(this.#getRootDirectory(), 'yt-dlp.exe');
    return await new Promise((resolve, reject) => {
      exec(`${execPath} -J ${url}`, (error, stdout) => {
        if (error) {
          console.log(`[info]: error fetching ${error}`);
          return reject(error);
        }

        const info = JSON.parse(stdout);
        resolve({
          title: info.title,
          ownerChannelName: info.uploader,
          category: info.categories?.[0] ?? '',
          thumbnails: info.thumbnails ?? [],
          videoUrl: info.itemUrl ?? info.webpage_url,
          seconds: info.duration,
        });
      });
    });
  };

  DownloadAudio = async (url: string, fileName: string): Promise<void> => {
    const execPath = path.join(this.#getRootDirectory(), 'yt-dlp.exe');
    console.log(`[info]: downloading ${url}`);
    // `${execPath} -x --audio-format mp3 -o "${fileName}" ${url}`
    return await new Promise((resolve, reject) => {
      exec(`${execPath} -f bestaudio -o "${fileName}" ${url}`, (error) => {
        if (error) {
          console.log(`[info]: error downloading ${error}`);
          return reject(error);
        }
        return resolve();
      });
    });
  };
}

export default YTDowloadService;

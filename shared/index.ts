export type YoutubeVideoInfo = {
  title: string;
  ownerChannelName: string;
  category: string;
  thumbnails: Array<string>;
  videoUrl: string;
  seconds: number;
};

export type GithubRelease = {
  id: number;
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  tag_name: string;
  created_at: Date;
  updated_at: Date;
  published_at: Date;
  prerelease: boolean;
  assets: GithubAsset[];
};

export type GithubAsset = {
  id: number;
  name: string;
  url: string;
  browser_download_url: string;
  created_at: Date;
  updated_at: Date;
};

export interface IYTDownloadService {
  CheckUpdates(): Promise<void>;
  FetchInfo(url: string): Promise<YoutubeVideoInfo>;
  DownloadAudio(url: string, fileName: string): Promise<void>;
}

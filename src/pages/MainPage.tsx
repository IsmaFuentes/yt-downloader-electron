import React, { useEffect, useState } from 'react';
import { YoutubeVideoInfo } from '../../shared';
import { ConfigProvider, theme, message, Card, Flex, Input, Button, Layout, Tag, Spin } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  FolderOutlined,
  DeleteOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';

const { DialogService, YTDownloadService } = window.ElectronAPI;

const MainPage = (): React.ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [directory, setDirectory] = useState(localStorage.getItem('download-path'));
  const [videos, setVideos] = useState<YoutubeVideoInfo[]>([]);

  useEffect(() => {
    YTDownloadService.CheckUpdates()
      .then(() => messageApi.success('Yt-dlp is up to date!'))
      .catch((error: unknown) => {
        if (error) {
          messageApi.error('An error occurred while checking for updates');
          console.log(`[error]: ${error}`);
        }
      });
  }, []);

  const setDownloadDirectory = async (): Promise<void> => {
    const { canceled, filePaths } = await DialogService.OpenDialog({ title: 'Select a download folder' });
    if (!canceled) {
      const path = filePaths[0];
      localStorage.setItem('download-path', path);
      setDirectory(path);
    }
  };

  const deleteItem = (title: string): void => {
    setVideos((prev) => prev.filter((item) => item.title !== title));
  };

  const fetchInfoFromYtVideo = async (): Promise<void> => {
    if (!url || url.trim() === '') return;
    try {
      setIsLoading(true);
      const videoUrl = url
        .trim()
        .replace(/([?&])[^v][^&]*&?/g, '')
        .replace(/&$/, '');

      const info = await YTDownloadService.FetchInfo(videoUrl);
      setVideos((prev) => [...prev, info]);
      setUrl('');
    } catch (err: unknown) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQueue = async (): Promise<void> => {
    if (!directory) {
      messageApi.warning('Download folder is not configured!');
      return;
    }

    try {
      setIsLoading(true);
      const videosToDownload = [...videos];
      for (const info of videosToDownload) {
        await YTDownloadService.DownloadAudio(info.videoUrl, `${directory}\\${info.title}.mp3`);
        setVideos((prev) => prev.filter((video) => video.videoUrl !== info.videoUrl));
      }
    } catch (err: unknown) {
      if (err instanceof Error) messageApi.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      {contextHolder}
      <div style={{ height: '100%', width: '100%' }}>
        <Layout style={{ padding: 10, height: '100%' }}>
          <Card style={{ width: '100%', marginBottom: 10 }}>
            <Card.Meta
              title="YouTube"
              avatar={<YoutubeOutlined />}
              style={{ marginBottom: 5, fontSize: 18 }}
            />
            <Flex>
              <Input
                type="text"
                placeholder="YouTube url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button style={{ marginLeft: 5 }} onClick={async () => await fetchInfoFromYtVideo()}>
                <PlusOutlined />
              </Button>
            </Flex>
          </Card>

          <Card style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <Flex
              align="center"
              justify="center"
              style={{
                visibility: isLoading ? 'visible' : 'hidden',
                ...loadingContainerStyles,
              }}
            >
              <Spin size="large" />
            </Flex>
            {videos.map(({ ownerChannelName, title, category, videoUrl }) => {
              return (
                <Card key={videoUrl} style={{ margin: 5 }}>
                  <Flex vertical>
                    <label style={{ fontSize: 16, fontWeight: 'bold' }}>
                      [{ownerChannelName}] {title}
                    </label>

                    <Flex align="center" justify="space-between">
                      <Tag style={{ height: 26 }}>{category}</Tag>
                      <Button onClick={() => deleteItem(title)} style={{ borderRadius: 45 }}>
                        <DeleteOutlined />
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Card>

          <Flex style={{ marginTop: 10, marginBottom: 10 }}>
            <Button
              style={{ width: 125 }}
              disabled={isLoading || videos.length === 0}
              onClick={async () => await downloadQueue()}
            >
              Download
              <DownloadOutlined />
            </Button>
            <Input
              type="text"
              readOnly
              style={{ cursor: 'default', margin: '0px 5px 0px 5px' }}
              value={directory}
            />
            <Button onClick={() => setDownloadDirectory()}>
              <FolderOutlined />
            </Button>
          </Flex>
        </Layout>
      </div>
    </ConfigProvider>
  );
};

const loadingContainerStyles: React.CSSProperties = {
  position: 'absolute',
  zIndex: 999,
  width: '100%',
  height: '100%',
  margin: -24,
};

export default MainPage;

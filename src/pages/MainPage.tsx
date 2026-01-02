import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, Card, Flex, Input, Button, Layout, Tag, Spin } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  FolderOutlined,
  DeleteOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { YoutubeVideoInfo } from '../../shared';

const { DialogService, YTDownloadService } = window.ElectronAPI;

const MainPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [directory, setDirectory] = useState(localStorage.getItem('download-path'));
  const [videos, setVideos] = useState(new Array<YoutubeVideoInfo>());

  useEffect(() => {
    console.log('checking for updates..');
    YTDownloadService.CheckUpdates()
      .then(() => console.log('finished checking for updates.'))
      .catch((error) => {
        if (error) {
          console.log(`An error occurred while checking for updates: ${error}`);
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
    const selector = document.querySelector('#url-selector') as HTMLInputElement;
    if (selector.value) {
      try {
        setIsLoading(true);
        const url = selector.value
          .trim()
          .replace(/([?&])[^v][^&]*&?/g, '')
          .replace(/&$/, '');

        const info = await YTDownloadService.FetchInfo(url);
        setVideos([...videos, info]);
      } catch (err) {
        // TODO: toast
        alert(err);
      } finally {
        selector.value = '';
        setIsLoading(false);
      }
    }
  };

  const downloadQueue = async (): Promise<void> => {
    if (!directory) {
      // TODO: toast
      alert('Download folder is not configured!');
      return;
    }

    try {
      setIsLoading(true);
      for (let i = 0; i < videos.length; i++) {
        const info = videos[i];
        await YTDownloadService.DownloadAudio(info.videoUrl, `${directory}\\${info.title}.mp3`);
        videos.splice(videos.indexOf(info), 1);
        setVideos([...videos]);
      }
    } catch (err) {
      // TODO: toast
      alert(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ height: '100%', width: '100%' }}>
        <Layout style={{ padding: 10, height: '100%' }}>
          <Card style={{ width: '100%', marginBottom: 10 }}>
            <Card.Meta
              title="YouTube"
              avatar={<YoutubeOutlined />}
              style={{ marginBottom: 5, fontSize: 18 }}
            />
            <Flex>
              <Input type="text" id="url-selector" />
              <Button style={{ marginLeft: 5 }} onClick={() => fetchInfoFromYtVideo()}>
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
            {videos.map((e, i) => {
              return (
                <Card key={i} style={{ margin: 5 }}>
                  <Flex vertical>
                    <label>
                      {e.ownerChannelName} | {e.title}
                    </label>

                    <Flex align="center" justify="space-between">
                      <Tag style={{ height: 26 }}>{e.category}</Tag>
                      <Button onClick={() => deleteItem(e.title)} style={{ borderRadius: 45 }}>
                        <DeleteOutlined />
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Card>

          <Flex style={{ marginTop: 10, marginBottom: 10 }}>
            <Button style={{ width: 125 }} onClick={async () => await downloadQueue()}>
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

import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, Card, Input, Button, Layout, Tag } from 'antd';
import { PlusOutlined, DownloadOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons';
import { YoutubeVideoInfo } from '../../shared';

const { DialogService, YTDownloadService } = window.ElectronAPI;

const MainPage = () => {
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

  const deleteItem = (title: string): void => {
    setVideos((prev) => prev.filter((item) => item.title !== title));
  };

  const fetchInfoFromYtVideo = async (): Promise<void> => {
    // TODO: Show loading feedback
    const selector = document.querySelector('#url-selector') as HTMLInputElement;
    if (selector.value) {
      try {
        const url = selector.value.trim();
        console.log('fetching video info...');
        const info = await YTDownloadService.FetchInfo(url);
        setVideos([...videos, info]);
      } catch (err) {
        // TODO: show error
      } finally {
        selector.value = '';
      }
    }
  };

  const downloadQueue = async (): Promise<void> => {
    let downloadFolder = localStorage.getItem('download-path');
    if (!downloadFolder) {
      const options = { title: 'Select a download folder' };
      const { canceled, filePaths } = await DialogService.OpenDialog(options);
      if (!canceled) {
        downloadFolder = filePaths[0];
        localStorage.setItem('download-path', downloadFolder);
      }
    }

    if (downloadFolder) {
      // TODO: Show loading spinner
      try {
        for (let i = 0; i < videos.length; i++) {
          const info = videos[i];
          console.log(`downloading ${info.title}`);
          const path = `${downloadFolder}\\${info.title}.mp3`;
          await YTDownloadService.DownloadAudio(info.videoUrl, path);
          videos.splice(videos.indexOf(info), 1);
          setVideos([...videos]);
        }
      } catch (err) {
        // TODO: Show error
        console.log(err);
      }
    }
  };

  const clearDownloadDirectory = (): void => {
    // TODO: Show notification
    localStorage.clear();
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ height: '100%', width: '100%' }}>
        <Layout style={{ padding: 10, height: '100%' }}>
          <Card title="YouTube " style={{ width: '100%' }}>
            <div style={{ display: 'flex' }}>
              <Input type="text" id="url-selector" />
              <Button style={{ marginLeft: 5, borderRadius: 45 }} onClick={() => fetchInfoFromYtVideo()}>
                <PlusOutlined />
              </Button>
            </div>
          </Card>

          <Card style={{ width: '100%', height: '100%', marginTop: 10, overflow: 'auto' }}>
            {videos.map((e) => {
              return (
                <Card key={e.title} style={{ margin: 5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>
                      {e.ownerChannelName} | {e.title}
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag style={{ height: 26 }}>{e.category}</Tag>
                      <Button onClick={() => deleteItem(e.title)} style={{ borderRadius: 45 }}>
                        <DeleteOutlined />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Card>

          <div style={{ padding: 10, display: 'flex', justifyContent: 'center' }}>
            <Button style={{ width: 125, margin: 5 }} onClick={async () => await downloadQueue()}>
              Download
              <DownloadOutlined />
            </Button>
            <Button style={{ width: 125, margin: 5 }} onClick={() => clearDownloadDirectory()}>
              Music Folder
              <FolderOutlined />
            </Button>
          </div>
        </Layout>
      </div>
    </ConfigProvider>
  );
};

export default MainPage;

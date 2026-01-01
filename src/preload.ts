// import { contextBridge, ipcRenderer } from 'electron';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ElectronAPI', {
  DialogService: {
    OpenDialog: async (args: []) => ipcRenderer.invoke('open-dialog', args),
  },
  YTDownloadService: {
    CheckUpdates: async () => ipcRenderer.invoke('ytservice-checkupdates'),
    FetchInfo: async (url: string) => ipcRenderer.invoke('ytservice-fetchinfo', url),
    DownloadAudio: async (url: string, fileName: string) =>
      ipcRenderer.invoke('ytservice-downloadaudio', url, fileName),
  },
});

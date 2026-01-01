import { IYTDownloadService } from '../../shared';

export interface IDialogService {
  OpenDialog: (args: { title: string }) => Promise<Electron.OpenDialogReturnValue>;
}

export interface IElectronAPI {
  DialogService: IDialogService;
  YTDownloadService: IYTDownloadService;
}

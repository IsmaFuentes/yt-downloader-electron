import { IElectronAPI } from './interfaces';

declare global {
  interface Window {
    ElectronAPI: IElectronAPI;
  }
}

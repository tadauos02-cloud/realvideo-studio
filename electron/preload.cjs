const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  saveVideo: (options) => ipcRenderer.invoke('save-video-dialog', options),
  selectFolder: () => ipcRenderer.invoke('select-folder-dialog'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
});

import { readDir, mkdir, BaseDirectory, watch, stat, remove, rename, create } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import Gun from 'gun';

const gun = Gun({
  peers: ['http://localhost:8765/gun']
});
const filesRef = gun.get('files');

export const getFolderInformation = async (folderName='RepoShareDirs', baseDir = BaseDirectory.AppLocalData) => {
    try {
      const entries = await readDir(folderName, { baseDir, recursive: false });
      console.log(entries)
  
      const formatEntry = async (entry) => {
        const { name ,isDirectory,isFile} = entry;
        const type = isDirectory ? 'folder' : isFile?'file':'symlink';
        const path = `${folderName}/${name}`;
        const { size, mtime } = await stat(path, { baseDir });
  
        return {
          name,
          type,
          path,
          size: type === 'file' ? `${(size / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
          modified: new Date(mtime).toISOString().split('T')[0], 
        };
      };
  
      const folderInfo = await Promise.all(entries.map(formatEntry));
      console.log(folderInfo)
      return folderInfo;
    } catch (error) {
      console.error('Error retrieving folder information:', error);
      throw new Error('Unable to retrieve folder information');
    }
  };

export const watchFolder = async () => {
  try {
    await watch(
      'RepoShareDirs',
      async (event) => {
        console.log('File system event:', event);
        const path = event.paths[0];
        const name = path.split('\\').pop();
        const parentFolder = path.split('\\').slice(1).join('\\');

        let action = null;
        let data = {
          action: '',
          name: '',
          path: '',
          oldName: '',
          newName: '',
          oldPath: '',
          newPath: '',
          timestamp: Date.now()
        };

        const eventType = Object.keys(event.type)[0];

        if (eventType === 'create') {
          action = 'createFolder';
          data.name = name;
          data.path = path;
        } else if (eventType === 'update') {
          await invoke('modify_file', { path });
          action = 'updateFile';
          data.name = name;
          data.path = path;
        } else if (eventType === 'modify' && event.type.modify.kind === 'rename') {
          const newPath = event.paths[1];
          const newName = newPath.split('\\').pop();
          action = 'renameFolder';
          data.oldName = name;
          data.newName = newName;
          data.oldPath = path;
          data.newPath = newPath;
        } else if (eventType === 'remove') {
          // Prevent deletion of the main directory
          if (name === 'RepoShareDirs') {
            console.warn('Attempt to delete main directory blocked.');
            return;
          }

          // Directly set the action without checking metadata
          action = 'deleteFolder';
          data.name = name;
          data.path = path;
          data.folderName = parentFolder;
        }

        if (action) {
          data.action = action;
          console.log(`Sending action to Gun server: ${action}, data:`, data);
          filesRef.put(data, (ack) => {
            if (ack.err) {
              console.error('Error sending data to Gun server:', ack.err);
            } else {
              console.log('Data successfully sent to Gun server:', ack);
            }
          });
        }
      },
      {
        recursive: true,
        baseDir: BaseDirectory.AppLocalData,
      }
    );
  } catch (error) {
    console.error('Error watching folder:', error);
  }
};

export const deleteFolder = async (FolderName) => {
  try {
    await remove(`${FolderName}`, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
    return true
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false
  }
};


/**
 * @param {string} folderName - The folder name to create.
 * @returns {Promise<boolean>} - True if the folder is created, false otherwise.
 */
export const createFolder = async (folderName) => {
  try {
    await mkdir(folderName, { baseDir: BaseDirectory.AppLocalData });
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    return false;
  }
};

/**
 * @param {string} parentFolder - The parent folder name.
 * @param {string} subFolderName - The subfolder name.
 * @returns {Promise<boolean>} - True if the subfolder is created, false otherwise.
 */
export const createSubfolder = async (parentFolder, subFolderName) => {
  try {
    await mkdir(`${parentFolder}/${subFolderName}`, { baseDir: BaseDirectory.AppLocalData });
    return true;
  } catch (error) {
    console.error('Error creating subfolder:', error);
    return false;
  }
};

/**
 * @param {File} file1 - The first file.
 * @param {File} file2 - The second file.
 * @returns {Promise<Array>} - List of differences with line numbers and operations.
 */
export const getFileDifferencesFromFiles = async (file1, file2) => {
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  try {
    const [file1Content, file2Content] = await Promise.all([
      readFileContent(file1),
      readFileContent(file2),
    ]);

    const normalizeLines = (content) => content.replace(/\r/g, '').split('\n');

    const file1Lines = normalizeLines(file1Content);
    const file2Lines = normalizeLines(file2Content);

    const diffWithLineNumbers = [];
    const maxLength = Math.max(file1Lines.length, file2Lines.length);

    for (let i = 0; i < maxLength; i++) {
      const line1 = file1Lines[i] || '';
      const line2 = file2Lines[i] || '';

      if (line1 !== line2) {
        if (line1) {
          diffWithLineNumbers.push({
            line_number: i + 1,
            text: line1,
            operation: 'remove',
          });
        }
        if (line2) {
          diffWithLineNumbers.push({
            line_number: i + 1,
            text: line2,
            operation: 'add',
          });
        }
      }
    }

    return diffWithLineNumbers;
  } catch (error) {
    throw new Error('Error reading files: ' + error.message);
  }
};

/**
 * @param {string} filePath - The file path.
 * @param {Array} changes - The changes to apply.
 * @returns {Promise<string>} - Status of the operation.
 */
export const applyChangesToFile = async (filePath, changes) => {
  try {
    await invoke('update_file', { filePath, changes });
    return 'File updated successfully';
  } catch (error) {
    console.error('Failed to update file:', error);
    return 'Failed to update file';
  }
};

/**
 * Creates a file with the specified content.
 * @param {string} filePath - The path where the file will be created.
 * @param {string} content - The content to write into the file.
 * @returns {Promise<boolean>} - True if the file is created successfully, false otherwise.
 */
export const createFile = async (filePath) => {
  try {
    const file = await create(filePath, { baseDir: BaseDirectory.AppLocalData });
    return true;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
};

/**
 * Deletes a file at the specified path.
 * @param {string} filePath - The path of the file to delete.
 * @returns {Promise<boolean>} - True if the file is deleted successfully, false otherwise.
 */
export const deleteFile = async (filePath) => {
  try {
    await remove(filePath, { baseDir: BaseDirectory.AppLocalData });
    return true;
  } catch (error) {
    console.error('Error removing file:', error);
    return false;
  }
};

/**
 * Renames a file from an old path to a new path.
 * @param {string} oldPath - The current path of the file.
 * @param {string} newPath - The new path for the file.
 * @returns {Promise<boolean>} - True if the file is renamed successfully, false otherwise.
 */
export const renameFile = async (oldPath, newPath) => {
  try {
    console.log('Renaming file from:', oldPath, 'to:', newPath);

    const baseDir = BaseDirectory.AppLocalData;

    await rename(oldPath, newPath, {
      fromPathBaseDir: baseDir,
      toPathBaseDir: baseDir,
    });

    filesRef.put({
      action: 'renameFile',
      oldName: oldPath.split('/').pop(),
      newName: newPath.split('/').pop(),
      oldPath,
      newPath,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.error('Error renaming file:', error);
    return false;
  }
};

/**
 * Renames a folder from an old path to a new path.
 * @param {string} oldPath - The current path of the folder.
 * @param {string} newName - The new name for the folder.
 * @returns {Promise<boolean>} - True if the folder is renamed successfully, false otherwise.
 */
export const renameFolder = async (oldPath, newName) => {
  try {
    const directoryPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${directoryPath}/${newName}`;

    await rename(oldPath, newPath, {
      fromPathBaseDir: BaseDirectory.AppLocalData,
      toPathBaseDir: BaseDirectory.AppLocalData,
    });

    console.log(`Folder renamed from ${oldPath} to ${newPath}`);
    return true;
  } catch (error) {
    console.error('Error renaming folder:', error);
    return false;
  }
};

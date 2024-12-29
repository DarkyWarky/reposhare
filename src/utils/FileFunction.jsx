import { readDir,mkdir, BaseDirectory, watch,stat,remove,rename } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

export const getFolderInformation = async (folderName='RepoShareDirs', baseDir = BaseDirectory.AppLocalData) => {
    try {
      const entries = await readDir(folderName, { baseDir, recursive: false });
      console.log(entries)
  
      const formatEntry = async (entry) => {
        const { name ,isDirectory,isFile} = entry;
        const type = isDirectory ? 'folder' : isFile?'file':'symlink';
        const path = folderName+'/'+name
        const { size, mtime } = await stat(path, { baseDir: BaseDirectory.AppLocalData });
  
        return {
          name,
          type,
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
      (event) => {
        console.log('File system event:', event);
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
    await remove(`RepoShareDirs/${FolderName}`, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });
    return true
  } catch (error) {
    console.error('Error watching folder:', error);
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

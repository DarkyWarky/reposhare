import React, { useEffect, useState } from 'react';
import {
  Typography,
  ButtonGroup,
  Button,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  FolderIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  getFolderInformation,
  createFolder,
  deleteFolder,
  createFile,
  deleteFile,
  watchFolder,
} from '../utils/FileFunction';
import Gun from 'gun';
import { invoke } from '@tauri-apps/api/core';
import { appLocalDataDir } from '@tauri-apps/api/path';
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import sha256 from 'js-sha256';

const Home = () => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('RepoShareDirs');
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [renameFileName, setRenameFileName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [folderToRename, setFolderToRename] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const gun = Gun({
    peers: ['http://localhost:8765/gun']
  });
  const filesRef = gun.get('files');

  const getFiles = async (path = currentPath) => {
    try {
      const folderInfo = await getFolderInformation(path);
      setFiles(folderInfo);
    } catch (error) {
      console.error("Error retrieving folder information:", error);
    }
  };

  const handleFolderClick = (folderName) => {
    const newPath = `${currentPath}/${folderName}`;
    setCurrentPath(newPath);
    getFiles(newPath);
  };

  const handleBackToRoot = () => {
    setCurrentPath('RepoShareDirs');
    getFiles('RepoShareDirs');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Folder name cannot be empty.");
      return;
    }

    try {
      const baseDir = await appLocalDataDir();
      const folderPath = `${baseDir}/RepoShareDirs/${newFolderName}`;
      const success = await createFolder(folderPath);
      if (success) {
        setNewFolderName("");
        setIsModalOpen(false);
        getFiles();
        filesRef.put({
          action: 'createFolder',
          folderName: folderPath,
          timestamp: Date.now()
        });
      } else {
        alert("Failed to create folder.");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("An error occurred while creating the folder.");
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert("File name cannot be empty.");
      return;
    }

    try {
      const baseDir = await appLocalDataDir();
      const filePath = `${baseDir}/RepoShareDirs/${newFileName}`;
      const success = await createFile(filePath);
      if (success) {
        setNewFileName("");
        setIsFileModalOpen(false);
        getFiles();
        filesRef.put({
          action: 'createFile',
          fileName: filePath,
          timestamp: Date.now()
        });
      } else {
        alert("Failed to create file.");
      }
    } catch (error) {
      console.error("Error creating file:", error);
      alert("An error occurred while creating the file.");
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folderName}"?`)) {
      try {
        const baseDir = await appLocalDataDir();
        const folderPath = `${baseDir}/RepoShareDirs/${folderName}`;
        const success = await deleteFolder(folderPath);
        if (success) {
          getFiles();
          filesRef.put({
            action: 'deleteFolder',
            folderName: folderPath,
            timestamp: Date.now()
          });
        } else {
          alert("Failed to delete folder.");
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
        alert("An error occurred while deleting the folder.");
      }
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (window.confirm(`Are you sure you want to delete the file "${fileName}"?`)) {
      try {
        const baseDir = await appLocalDataDir();
        const filePath = `${baseDir}/RepoShareDirs/${fileName}`;
        const success = await deleteFile(filePath);
        if (success) {
          getFiles();
          filesRef.put({
            action: 'deleteFile',
            fileName: filePath,
            timestamp: Date.now()
          });
        } else {
          alert("Failed to delete file.");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("An error occurred while deleting the file.");
      }
    }
  };

  const handleRenameFile = async () => {
    if (!renameFileName.trim()) {
      alert("New file name cannot be empty.");
      return;
    }

    if (selectedFile) {
      try {
        const baseDir = await appLocalDataDir();
        const oldPath = `${baseDir}/RepoShareDirs/${selectedFile}`;
        const newPath = `${baseDir}/RepoShareDirs/${renameFileName}`;
        
        console.log('Renaming file from:', oldPath, 'to:', newPath);

        await invoke('rename_item', { oldPath, newPath });
        setRenameFileName("");
        setIsRenameModalOpen(false);
        getFiles();
        filesRef.put({
          action: 'renameFile',
          oldName: selectedFile,
          newName: renameFileName,
          oldPath,
          newPath,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error renaming file:", error);
        alert("An error occurred while renaming the file.");
      }
    } else {
      console.error("File to rename is not set correctly.");
      alert("An error occurred. Please try again.");
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim()) {
      alert("New folder name cannot be empty.");
      return;
    }

    if (folderToRename && folderToRename.path) {
      try {
        const baseDir = await appLocalDataDir();
        const oldPath = `${baseDir}/RepoShareDirs/${folderToRename.name}`;
        const newPath = `${baseDir}/RepoShareDirs/${renameFolderName}`;
        
        console.log('Renaming folder from:', oldPath, 'to:', newPath);

        await invoke('rename_item', { oldPath, newPath });
        console.log('Folder renamed successfully');
        setRenameFolderName("");
        setIsRenameModalOpen(false);
        getFiles();
        filesRef.put({
          action: 'renameFolder',
          oldName: folderToRename.name,
          newName: renameFolderName,
          oldPath,
          newPath,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error renaming folder:", error);
        alert("An error occurred while renaming the folder.");
      }
    } else {
      console.error("Folder to rename is not set correctly.");
      alert("An error occurred. Please try again.");
    }
  };

  const openRenameModal = (folder) => {
    if (folder && folder.name && folder.path) {
      setFolderToRename(folder);
      setRenameFolderName(folder.name);
      setIsRenameModalOpen(true);
    } else {
      console.error("Invalid folder object:", folder);
      alert("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    getFiles();
    watchFolder();

    filesRef.on((data) => {
      if (!data) return;
      console.log(data);
      const action = data.action;
      const folderName = data.folderName;
      const fileName = data.name;
      const oldPath = data.oldPath;
      const newPath = data.newPath;
      const checksum = data.checksum;
      const content = data.content;
      const path = data.path;

      console.log(`Received action: ${action} for file: ${fileName || folderName}`);

      switch (action) {
        case 'createFolder':
          createFolder(folderName);
          getFiles();
          break;
        case 'deleteFolder':
          deleteFolder(folderName);
          getFiles();
          break;
        case 'createFile':
          createFile(fileName);
          getFiles();
          break;
        case 'deleteFile':
          deleteFile(fileName);
          getFiles();
          break;
        case 'renameFile':
          invoke('rename_item', { oldPath, newPath })
            .then(() => getFiles())
            .catch((error) => console.error('Error renaming file:', error));
          break;
        case 'renameFolder':
          invoke('rename_item', { oldPath, newPath })
            .then(() => getFiles())
            .catch((error) => console.error('Error renaming folder:', error));
          break;
        case 'updateFile':
          console.log(`Processing update for file: ${path}`);
          const currentChecksum = sha256(content);
          console.log(`Current checksum: ${currentChecksum}, Received checksum: ${checksum}`);

          if (currentChecksum !== checksum) {
            console.log(`Checksum mismatch detected. Updating file: ${path}`);

            const baseDir = appLocalDataDir();
            const relativePath = path.replace(`${baseDir}\\`, '');
            const filePath = `com.reposhare.app/RepoShareDirs/${relativePath}`;

            writeTextFile(filePath, content, { baseDir: BaseDirectory.AppLocalData })
              .then(() => {
                console.log(`File ${filePath} updated successfully`);
                getFiles();
              })
              .catch((error) => console.error(`Error updating file ${fileName}:`, error));
          } else {
            console.log(`File ${fileName} is already up-to-date. No update needed.`);
          }
          break;
        default:
          console.error(`Unknown action: ${action} for file: ${fileName || folderName}`);
      }
    });

    return () => {
      filesRef.off();
    };
  }, []);

  return (
    <div className="p-4">
      {/* Header with options */}
      <div className='w-full flex justify-between border-b-2 p-2'>
        <Typography className='font-bold text-2xl text-white'>
          {currentPath === 'RepoShareDirs' ? 'Files' : currentPath.split('/').pop()}
        </Typography>
        <ButtonGroup variant="gradient" className='shadow-sm shadow-white rounded-md'>
          <Button onClick={() => setIsModalOpen(true)}>Create Folder</Button>
          <Button onClick={() => setIsFileModalOpen(true)}>Create File</Button>
        </ButtonGroup>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {files.map((file, index) => (
          <Card key={index} className="w-full shadow-md shadow-white bg-gray-850 text-white hover:bg-gray-800 cursor-pointer transition-colors">
            <CardBody onClick={() => file.type === 'folder' ? handleFolderClick(file.name) : null}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg p-2">
                    {file.type === 'folder' ? (
                      <FolderIcon className="h-8 w-8" />
                    ) : (
                      <DocumentIcon className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <Typography variant="h6" color="white" className="mb-0">
                      {file.name}
                    </Typography>
                    <Typography variant="small" color="white" className="font-normal">
                      {file.size}
                    </Typography>
                  </div>
                </div>

                <Menu placement="bottom-end">
                  <MenuHandler>
                    <IconButton variant="text" color="white" size="sm">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </IconButton>
                  </MenuHandler>
                  <MenuList>
                    <MenuItem
                      className="flex items-center gap-2"
                      onClick={() => openRenameModal(file)}
                    >
                      Rename
                    </MenuItem>
                    <MenuItem
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50"
                      onClick={() => file.type === 'folder' ? handleDeleteFolder(file.name) : handleDeleteFile(file.name)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </div>
              <Typography
                variant="small"
                color="white"
                className="mt-4 font-normal"
              >
                Modified: {new Date(file.modified).toLocaleDateString()}
              </Typography>
            </CardBody>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} handler={setIsModalOpen} size="sm">
        <DialogHeader>Create a New Folder</DialogHeader>
        <DialogBody divider>
          <Input
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="text-black"
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsModalOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={handleCreateFolder}>
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={isFileModalOpen} handler={setIsFileModalOpen} size="sm">
        <DialogHeader>Create a New File</DialogHeader>
        <DialogBody divider>
          <Input
            label="File Name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="text-black"
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsFileModalOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={handleCreateFile}>
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={isRenameModalOpen} handler={setIsRenameModalOpen} size="sm">
        <DialogHeader>Rename Folder</DialogHeader>
        <DialogBody divider>
          <Input
            label="New Folder Name"
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            className="text-black"
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsRenameModalOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={handleRenameFolder}>
            Rename
          </Button>
        </DialogFooter>
      </Dialog>

      <div className="mt-4 flex gap-2">
        <button onClick={() => getFiles()} className="p-2 bg-blue-500 text-white rounded">
          Refresh Files
        </button>
        <button onClick={handleBackToRoot} className="p-2 bg-red-500 text-white rounded">
          Back to Root
        </button>
      </div>
    </div>
  );
};

export default Home;

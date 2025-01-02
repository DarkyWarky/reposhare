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
  EllipsisVerticalIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  getFolderInformation,
  createFolder,
  watchFolder,
  deleteFolder,
  applyChangesToFile,
  createFile,
  deleteFile,
  renameFile
} from '../utils/FileFunction';

const Home = () => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('RepoShareDirs');
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [renameFileName, setRenameFileName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  const getFiles = async (path = currentPath) => {
    try {
      const folderInfo = await getFolderInformation(path);
      setFiles(folderInfo);
    } catch (error) {
      console.error("Error retrieving folder information:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Folder name cannot be empty.");
      return;
    }

    try {
      const success = await createFolder(`RepoShareDirs/${newFolderName}`);
      if (success) {
        alert("Folder created successfully.");
        setNewFolderName("");
        setIsModalOpen(false);
        getFiles();
        const message = JSON.stringify({ action: 'createFolder', folderName: newFolderName });
        console.log("Sending message to server:", message);
        ws.send(message);
      } else {
        alert("Failed to create folder.");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("An error occurred while creating the folder.");
    }
  };

  const handleDeleteFolder = async (folderName) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folderName}"?`)) {
      try {
        const success = await deleteFolder(folderName);
        if (success) {
          alert("Folder deleted successfully.");
          getFiles();
          const message = JSON.stringify({ action: 'deleteFolder', folderName });
          console.log("Sending message to server:", message);
          ws.send(message);
        } else {
          alert("Failed to delete folder.");
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
        alert("An error occurred while deleting the folder.");
      }
    }
  };

  const handleAction = (action, fileName) => {
    console.log(`${action} clicked for ${fileName}`);
  };

  const handleFolderClick = (folderName) => {
    setCurrentPath(`${currentPath}/${folderName}`);
    getFiles(`${currentPath}/${folderName}`);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert("File name cannot be empty.");
      return;
    }

    try {
      const success = await createFile(`${currentPath}/${newFileName}`);
      if (success) {
        alert("File created successfully.");
        setNewFileName("");
        setIsFileModalOpen(false);
        getFiles();
        const message = JSON.stringify({ action: 'createFile', fileName: newFileName });
        console.log("Sending message to server:", message);
        ws.send(message);
      } else {
        alert("Failed to create file.");
      }
    } catch (error) {
      console.error("Error creating file:", error);
      alert("An error occurred while creating the file.");
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (window.confirm(`Are you sure you want to delete the file "${fileName}"?`)) {
      try {
        const success = await deleteFile(`${currentPath}/${fileName}`);
        if (success) {
          alert("File deleted successfully.");
          getFiles();
          const message = JSON.stringify({ action: 'deleteFile', fileName });
          console.log("Sending message to server:", message);
          ws.send(message);
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

    try {
      const success = await renameFile(`${currentPath}/${selectedFile}`, `${currentPath}/${renameFileName}`);
      if (success) {
        alert("File renamed successfully.");
        setRenameFileName("");
        setIsRenameModalOpen(false);
        getFiles();
        const message = JSON.stringify({ action: 'renameFile', oldName: selectedFile, newName: renameFileName });
        console.log("Sending message to server:", message);
        ws.send(message);
      } else {
        alert("Failed to rename file.");
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      alert("An error occurred while renaming the file.");
    }
  };

  const handleFileAction = (action, fileName) => {
    setSelectedFile(fileName);
    if (action === 'rename') {
      setIsRenameModalOpen(true);
    } else if (action === 'delete') {
      handleDeleteFile(fileName);
    }
  };

  useEffect(() => {
    getFiles();
    watchFolder(ws);

    ws.onmessage = async (event) => {
      const { action, folderName, fileName } = JSON.parse(event.data);
      console.log("Received message from server:", event.data);
      switch (action) {
        case 'createFolder':
          alert(`Folder "${folderName}" created by another user.`);
          await createFolder(`RepoShareDirs/${folderName}`);
          getFiles();
          break;
        case 'deleteFolder':
          alert(`Folder "${folderName}" deleted by another user.`);
          await deleteFolder(folderName);
          getFiles();
          break;
        case 'createFile':
          alert(`File "${fileName}" created by another user.`);
          getFiles();
          break;
        case 'updateFile':
          alert(`File "${fileName}" updated by another user.`);
          getFiles();
          break;
        default:
          console.error('Unknown action:', action);
      }
    };

    return () => {
      ws.close();
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
                    <FolderIcon className="h-8 w-8" />
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
                      onClick={() => handleFileAction('rename', file.name)}
                    >
                      Rename
                    </MenuItem>
                    <MenuItem
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50"
                      onClick={() => handleFileAction('delete', file.name)}
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
        <DialogHeader>Rename File</DialogHeader>
        <DialogBody divider>
          <Input
            label="New File Name"
            value={renameFileName}
            onChange={(e) => setRenameFileName(e.target.value)}
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
          <Button variant="gradient" color="green" onClick={handleRenameFile}>
            Rename
          </Button>
        </DialogFooter>
      </Dialog>

      <button onClick={() => getFiles()} className="mt-4 p-2 bg-blue-500 text-white rounded">
        Refresh Files
      </button>
    </div>
  );
};

export default Home;

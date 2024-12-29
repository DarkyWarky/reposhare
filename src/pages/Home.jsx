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
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  getFolderInformation,
  createFolder,
  watchFolder,deleteFolder
} from '../utils/FileFunction';

const Home = () => {
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getFiles = async () => {
    try {
      const folderInfo = await getFolderInformation();
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

  useEffect(() => {
    getFiles();
    watchFolder();
  }, []);

  return (
    <div className="p-4">
      {/* Header with options */}
      <div className='w-full flex justify-between border-b-2 p-2'>
        <Typography className='font-bold text-2xl text-white'>
          Files
        </Typography>
        <ButtonGroup variant="gradient" className='shadow-sm shadow-white rounded-md'>
          <Button onClick={() => setIsModalOpen(true)}>Create Folder</Button>
        </ButtonGroup>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
        {files.map((file, index) => (
          <Card key={index} className="w-full shadow-md shadow-white bg-gray-850 text-white hover:bg-gray-800 cursor-pointer transition-colors">
            <CardBody>
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
                      onClick={() => handleAction('share', file.name)}
                    >
                      <ShareIcon className="h-4 w-4" />
                      Share
                    </MenuItem>
                    {file.type === 'folder' && (
                      <MenuItem
                        className="flex items-center gap-2 text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteFolder(file.name)}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </MenuItem>
                    )}
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

      <button onClick={getFiles} className="mt-4 p-2 bg-blue-500 text-white rounded">
        Refresh Files
      </button>
    </div>
  );
};

export default Home;

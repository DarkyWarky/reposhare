// import React, { useState,useEffect } from 'react';
// import { readDir, mkdir, BaseDirectory, watch,stat } from '@tauri-apps/plugin-fs';

// // Ensure watchFolder only runs once
// let isWatcherInitialized = false;

// const metadata = await stat('RepoShareDirs', {
//   baseDir: BaseDirectory.AppLocalData,
// });

// const entries = await readDir('RepoShareDirs', { baseDir: BaseDirectory.AppLocalData });

// const watchFolder = async () => {
//   if (isWatcherInitialized) return; 
//   isWatcherInitialized = true;
  
//   try {
//     await watch(
//       'RepoShareDirs',
//       (event) => {
//         console.log('File system event:', event);
//       },
//       {
//         recursive: true,
//         baseDir: BaseDirectory.AppLocalData,
//       }
//     );
//   } catch (error) {
//     console.error('Error watching folder:', error);
//   }
// };

// // Call watchFolder outside the component to run it only once


// const FileControl = () => {

//   console.log(metadata)
//   console.log(entries)

//   const [folderCreated, setFolderCreated] = useState(false);
//   const [subfolderCreated, setSubfolderCreated] = useState(false);

//   useEffect(() => {
//     watchFolder();

//   }, [])
  

//   const handleCreateFolder = async () => {
//     try {
//       await mkdir('RepoShareDirs', { baseDir: BaseDirectory.AppLocalData });
//       setFolderCreated(true);
//     } catch (error) {
//       console.error('Error creating folder:', error);
//       setFolderCreated(false);
//     }
//   };

//   const handleCreateSubfolder = async (subFolderName) => {
//     try {
//       await mkdir(`RepoShareDirs/${subFolderName}`, { baseDir: BaseDirectory.AppLocalData });
//       setSubfolderCreated(true);
//     } catch (error) {
//       console.error('Error creating subfolder:', error);
//       setSubfolderCreated(false);
//     }
//   };

//   return (
//     <div>
//       <button onClick={handleCreateFolder}>Create Folder in AppLocalData</button>
//       {folderCreated && <p>Folder successfully created in AppLocalData!</p>}

//       <button onClick={() => handleCreateSubfolder("Folder_1")} disabled={!folderCreated}>
//         Create Subfolder in RepoShareDirs
//       </button>
//       {subfolderCreated && <p>Subfolder successfully created in RepoShareDirs!</p>}
//     </div>
//   );
// };

// export default FileControl;

// import React, { useState } from 'react';

// /**
//  * Compares two text files and returns a list of differences (entire line differences).
//  * @param {File} file1 - The first file to compare.
//  * @param {File} file2 - The second file to compare.
//  * @returns {Promise<Array>} - Promise that resolves to an array of objects detailing the differences with line numbers, operation, and full line text.
//  */
// const getFileDifferencesFromFiles = async (file1, file2) => {
//   const readFileContent = (file) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result);
//       reader.onerror = reject;
//       reader.readAsText(file);
//     });
//   };

//   try {
//     const [file1Content, file2Content] = await Promise.all([
//       readFileContent(file1),
//       readFileContent(file2),
//     ]);

//     // Normalize content by removing '\r' and splitting by '\n' to get individual lines
//     const normalizeLines = (content) =>
//       content.replace(/\r/g, '').split('\n');

//     const file1Lines = normalizeLines(file1Content);
//     const file2Lines = normalizeLines(file2Content);

//     const diffWithLineNumbers = [];
//     const maxLength = Math.max(file1Lines.length, file2Lines.length);

//     for (let i = 0; i < maxLength; i++) {
//       const line1 = file1Lines[i] || '';
//       const line2 = file2Lines[i] || '';

//       if (line1 !== line2) {
//         // Add the entire line from file1 if it's different from file2
//         if (line1) {
//           diffWithLineNumbers.push({
//             line_number: i + 1,
//             text: line1,
//             operation: 'remove',
//           });
//         }
//         // Add the entire line from file2 if it's different from file1
//         if (line2) {
//           diffWithLineNumbers.push({
//             line_number: i + 1,
//             text: line2,
//             operation: 'add',
//           });
//         }
//       }
//     }

//     return diffWithLineNumbers;
//   } catch (error) {
//     throw new Error('Error reading files: ' + error.message);
//   }
// };

// const FileControl = () => {
//   const [file1, setFile1] = useState(null);
//   const [file2, setFile2] = useState(null);
//   const [differences, setDifferences] = useState([]);

//   const handleFileChange = (event, setFile) => {
//     const file = event.target.files[0];
//     setFile(file);
//   };

//   const compareFiles = async () => {
//     if (file1 && file2) {
//       try {
//         const differences = await getFileDifferencesFromFiles(file1, file2);
//         setDifferences(differences);
//         console.log(differences); // Log differences to console
//       } catch (error) {
//         console.error(error.message);
//       }
//     } else {
//       alert('Please upload both files.');
//     }
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
//       <h2>File Control</h2>

//       <div>
//         <label>File 1:</label>
//         <input
//           type="file"
//           accept=".txt"
//           onChange={(e) => handleFileChange(e, setFile1)}
//         />
//       </div>

//       <div>
//         <label>File 2:</label>
//         <input
//           type="file"
//           accept=".txt"
//           onChange={(e) => handleFileChange(e, setFile2)}
//         />
//       </div>

//       <button onClick={compareFiles} style={{ marginTop: '10px' }}>
//         Compare Files
//       </button>

//       {differences.length > 0 && (
//         <div style={{ marginTop: '20px' }}>
//           <h3>Differences:</h3>
//           <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
//             {differences.map((diff, index) => (
//               <div key={index} style={{ display: 'flex' }}>
//                 <span style={{ width: '50px', fontWeight: 'bold' }}>{diff.line_number}</span>
//                 <span
//                   style={{
//                     color: diff.operation === 'add' ? 'green' : 'red',
//                     textDecoration: diff.operation === 'remove' ? 'line-through' : 'none',
//                   }}
//                 >
//                   {diff.text}
//                 </span>
//               </div>
//             ))}
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FileControl;



import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const FileControl = () => {
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState('');

  // Define some example changes to apply to the file
  const changes = [
    { line_number: 3, text: 'Big black Clockss and my feeet getting cold', operation: 'remove' },
    { line_number: 4, text: 'Updated text for line 4.', operation: 'add' },
    { line_number: 5, text: 'Updated text for line 5.', operation: 'add' },
    { line_number: 6, text: 'Inserted text for new line 6.', operation: 'add' },
    { line_number: 7, text: 'Inserted text for new line 7.', operation: 'add' },
    { line_number: 8, text: 'Big black Clock and my feet getting cold.', operation: 'remove' },
  ];

  // Function to handle file update
  const applyChanges = async () => {
    try {
      // Call the Tauri command `update_file`
      await invoke('update_file', { filePath, changes });
      setStatus('File updated successfully');
    } catch (error) {
      console.error('Failed to update file:', error);
      setStatus('Failed to update file');
    }
  };

  return (
    <div>
      <h1>File Control</h1>
      <input
        type="text"
        placeholder="Enter file path"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
      />
      <button onClick={applyChanges}>Apply Changes to File</button>
      <p>Status: {status}</p>
    </div>
  );
};

export default FileControl;

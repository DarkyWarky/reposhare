# Tauri + React + GUN.js: Collaborative File Sharing App

This project is a **prototype desktop application** built with **Tauri, React (Vite), and GUN.js**. The goal is to allow multiple users to collaborate on a **shared folder** across multiple PCs in real-time. While the core functionality works, the application is still in a **prototype stage** and has known bugs.

## 🚀 Features

- ✅ **Real-Time File Sharing**: Creating or modifying files in one PC automatically updates on others.  
- ✅ **Multiple Folder Support**: Users can create and manage multiple shared folders.  
- ✅ **Peer-to-Peer (P2P) Sync**: Uses **GUN.js** for decentralized data synchronization.  
- ✅ **Cross-Platform**: Works on **Windows, macOS, and Linux** via **Tauri**.

## ❗ Known Issues

- ⚠️ **Buggy UI**: Some interface elements may not update correctly due to state management issues.  
- ⚠️ **Difficult Deployment**: Setting up the **server and application** is tricky due to Rust and GUN.js dependencies.  
- ⚠️ **Network Traffic Overhead**: Constant updates can lead to unnecessary bandwidth usage.  
- ⚠️ **File Conflicts**: If two users edit the same file simultaneously, conflicts may occur.  

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have the following installed:
- **[Node.js](https://nodejs.org/)** (for React/Vite frontend)
- **[Rust & Cargo](https://www.rust-lang.org/)** (for Tauri backend)
- **Git** (to clone the repository)

### Clone the Repository
```sh
git clone https://github.com/yourusername/tauri-react-gunjs.git
cd tauri-react-gunjs
```

### Install Dependencies
```sh
# Install frontend dependencies
npm install

# Install Rust dependencies for Tauri
cargo install tauri-cli
```

### Running the Application
```sh
# Start the development server
npm run dev

# Run the Tauri desktop application
npm run tauri dev
```

## 🌍 Deployment Guide
### 1. **Building the App for Production**
To create a production build:
```sh
npm run build
npm run tauri build
```
This will generate a **standalone installer** for Windows/macOS/Linux.

### 2. **Hosting the GUN.js Relay Server** (Optional)
If you want to run your own GUN relay instead of using public relays:
```sh
git clone https://github.com/amark/gun.git
cd gun
npm install
node server.js
```
Then, update your app to use your custom relay instead of the default one.

## 🔧 Future Improvements
- **Improve UI Stability** (better React state management)
- **Add File Locking System** (prevent conflicts when multiple users edit the same file)
- **Optimize Network Traffic** (batch updates instead of real-time sync for every change)
- **Easier Deployment** (Docker container for server setup)

## 🤝 Contributing
- Contributions are welcome! Feel free to **fork this repository**, create a new branch, and submit a **pull request**.

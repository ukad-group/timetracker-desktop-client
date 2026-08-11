[![Forks][forks-shield]][forks-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

# Timetracker Desktop Client

A cross-platform desktop application for creating and managing time tracking reports across multiple projects. Built with Electron, Vite, React, and TypeScript.

![Timetracker Screen Shot](resources/app-screenshot.png)

## Table of Contents

- [Features](#features)
- [Built With](#built-with)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [GitHub Actions (CI/CD)](#github-actions-cicd)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Contact](#contact)

## Features

### Core Functionality

- 📁 **Report Management**: Choose custom location for time tracker reports
- 📅 **Date Selection**: Select any date for report creation and editing
- 📝 **Activity Tracking**: Create activity reports with time, project, activity, and description fields
- 💾 **Auto-save**: Automatic saving of reports with file watching
- 📊 **Time Totals**: Automatic calculation and display of time totals by project, activity, and description

### Integrations

- 📆 **Google Calendar**: Import and track events from Google Calendar
- 🎫 **Jira**: Connect to Jira to track issues and tasks
- 📋 **Trello**: Import cards from Trello boards for time tracking
- 📧 **Office365**: Integration with Office365 calendar and events
- 🌐 **Timetracker Website**: Connect to Timetracker web service for projects, bookings, and holidays

### User Interface

- 🎨 **Theme Management**: Light and dark mode with OS theme detection
- 📱 **Widget Customization**: Drag-and-drop widget ordering
- 📅 **Calendar View**: Visual calendar with bookings, holidays, and vacation days
- 🔍 **Autocomplete Suggestions**: Smart autocomplete for projects and activities based on history
- ⌨️ **Keyboard Shortcuts**: Efficient keyboard navigation and shortcuts
- 💡 **Hints & Tutorials**: Built-in hints and tutorial system for new users

### Advanced Features

- 🔄 **Auto-update**: Automatic updates with beta channel support
- 📂 **File Watching**: Real-time file monitoring for external changes
- 🗂️ **Report Parsing**: Smart parsing of existing report files
- 📈 **Time Calculations**: Duration calculations and time formatting
- 🔐 **Secure Storage**: Electron-store for secure local storage

### Report Format

Reports are stored as plain text files with the following format:

- **File name**: Date in format `yyyymmdd` (e.g., `20241218.txt`)
- **Report format**: `hh:mm - project - activity - description`
  - `hh:mm` represents the start time of the activity
  - If there's no subsequent activity, the end time is marked as `hh:mm - !`

## Built With

- **TypeScript** - Type-safe JavaScript
- **Vite** - Bundler for the renderer process
- **Electron** - Cross-platform desktop application framework
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React** / **react-router** - UI library and client routing

## Prerequisites

- **Node.js** >= 16.x (recommended: 18.x or higher)
- **npm** package manager
- **Git** for version control

For building macOS distributions:

- macOS with Xcode Command Line Tools
- `dmg-license` package (optional, for DMG creation)

## Installation

1. Clone the repository

   ```sh
   git clone https://github.com/ukad-group/timetracker-desktop-client.git
   cd timetracker-desktop-client
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. (Optional) Install dmg-license for macOS builds:

   ```sh
   npm install -g dmg-license
   # or
   sudo npm install -g dmg-license
   ```

## Usage

### Development Mode

Run the application in development mode:

```sh
npm run dev
```

This will:

- Build the Electron main process
- Start the Vite development server
- Launch the Electron application with hot-reload

### Production Build

Create a production build for your platform:

```sh
npm run dist
```

This creates distributable packages for the current platform only.

For building all platforms at once:

```sh
npm run dist:all
```

For platform-specific builds:

```sh
npm run dist-win    # Windows only
npm run dist-macos   # macOS only
npm run dist-linux   # Linux only
```

For quick builds (without clean step, faster iteration):

```sh
npm run build-client        # Auto-detects platform
npm run build-client:win32  # Windows only
npm run build-client:darwin # macOS only
npm run build-client:linux  # Linux only
```

## Available Scripts

### Development

- `dev` - Vite renderer + Electron main watch + Electron
- `build` - Build both renderer (Vite) and Electron processes
- `build-renderer` - Build only the Vite renderer process
- `build-electron` - Build only the Electron main process TypeScript code

### Building & Packaging

- `pack-app` - Build and create unpacked application (faster, good for testing)
- `dist` - Build and create production distribution package for current platform
- `dist:all` - Build and create production distribution packages for all platforms (Windows, macOS, Linux)
- `dist-win` - Build and create Windows installer (NSIS)
- `dist-macos` - Build and create macOS DMG package
- `dist-linux` - Build and create Linux DEB package
- `build-client` - Platform-specific build (automatically detects OS, no clean step)

**Architecture-specific builds:**

- `dist-win:x64` - Windows x64 build
- `dist-win:ia32` - Windows 32-bit build
- `dist-win:arm64` - Windows ARM64 build
- `dist-macos:x64` - macOS Intel build
- `dist-macos:arm64` - macOS Apple Silicon build
- `dist-macos:universal` - macOS Universal binary (Intel + Apple Silicon)
- `dist-linux:x64` - Linux x64 build
- `dist-linux:arm64` - Linux ARM64 build

**Quick builds (without clean step):**

- `build-client:win32` - Quick Windows build
- `build-client:darwin` - Quick macOS build
- `build-client:linux` - Quick Linux build

### Code Quality

- `test` - Run Jest test suite
- `coverage` - Run tests with coverage report
- `lint` - Lint code using ESLint (with auto-fix)
- `type-check` - TypeScript type checking for both renderer and electron-src
- `prettier` - Format code using Prettier

### Maintenance

- `clean` - Remove all build artifacts (dist, main, renderer/dist)

## Project Structure

```
timetracker-desktop-client/
├── electron-src/          # Electron main process (TypeScript)
│   ├── helpers/           # Helper modules
│   │   ├── API/           # External API integrations (Google, Jira, Trello, Office365)
│   │   ├── constants.ts   # IPC channel constants
│   │   ├── create-window.ts
│   │   ├── datetime.ts    # Date/time utilities
│   │   ├── fs.ts          # File system utilities
│   │   └── preload.ts     # Preload script
│   ├── index.ts           # Main Electron process entry point
│   └── TimetrackerWebsiteApi.ts
├── renderer/              # Vite + React renderer process
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── routes/        # react-router page components
│   │   ├── store/         # Zustand state stores
│   │   ├── helpers/       # Utility functions and hooks
│   │   └── shared/        # Shared UI components
│   └── public/            # Static assets
├── main/                  # Compiled Electron main process (generated)
├── dist/                  # Build output directory
├── package.json
└── README.md
```

## Development

### Code Style

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Code is automatically formatted on commit via Husky hooks.

### Commit Message Format

Follow this pattern for commit messages:

```
FEATURE | ISSUE | NONE: commit message
```

Examples:

- `FEATURE: add widget customization`
- `ISSUE: fix calendar date calculation`
- `NONE: update dependencies`

### Environment Variables

For API integrations, create a `.env` file in the `renderer/` directory (use `.env.demo` as a template):

```env
NEXT_PUBLIC_PORT=51432
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_OFFICE365_CLIENT_ID=your_office365_client_id
NEXT_PUBLIC_OFFICE365_CLIENT_SECRET=your_office365_client_secret
NEXT_PUBLIC_JIRA_CLIENT_ID=your_jira_client_id
NEXT_PUBLIC_JIRA_CLIENT_SECRET=your_jira_client_secret
NEXT_PUBLIC_TRELLO_KEY=your_trello_key
# ... other variables
```

## Testing

Run the test suite:

```sh
npm test
```

Run tests with coverage:

```sh
npm run coverage
```

Tests are located in:

- `renderer/src/**/__tests__/` - Component and utility tests
- `renderer/src/**/*.test.ts` - Unit tests

## Building for Production

1. **Clean previous builds** (optional):

   ```sh
   npm run clean
   ```

2. **Build the application**:

   ```sh
   npm run build
   ```

3. **Create distribution packages**:

   **For current platform:**
   ```sh
   npm run dist
   ```

   **For all platforms:**
   ```sh
   npm run dist:all
   ```

   **For specific platform:**
   ```sh
   npm run dist-win    # Windows
   npm run dist-macos  # macOS
   npm run dist-linux  # Linux
   ```

   **For specific architecture:**
   ```sh
   npm run dist-win:x64        # Windows x64
   npm run dist-macos:arm64    # macOS Apple Silicon
   npm run dist-macos:universal # macOS Universal
   npm run dist-linux:x64      # Linux x64
   ```

The built applications will be in the `dist/` directory:

- Windows: `Timetracker-Setup-{version}.exe`
- macOS: `Timetracker-{version}.dmg`
- Linux: `Timetracker_{version}.deb`

**Note:** Cross-platform building (building for a different platform than your current OS) may require additional setup:
- Windows → macOS/Linux: Requires Wine
- macOS → Windows/Linux: Requires Wine (Windows builds only)
- Linux → Windows: Requires Wine
- Building macOS from non-macOS systems is not supported

## GitHub Actions (CI/CD)

### Versioning

The app version in `package.json` is automatically updated by GitHub Actions when a tag is pushed:

- Tag format: `v{major}.{minor}.{patch}` (e.g., `v1.52.0`)
- Package.json version: `{major}.{minor}.{patch}` (e.g., `1.52.0`)
- For beta releases: `v1.53.0-beta.10` → `1.53.0-beta.10`

### Release Process

1. Create and push a tag:

   ```sh
   git tag v1.52.0
   git push origin v1.52.0
   ```

2. GitHub Actions will:
   - Build for all platforms (macOS, Windows, Linux)
   - Run tests and linting
   - Create GitHub release with installers
   - Handle beta releases (pre-release) vs stable releases

3. Beta releases: Tags containing "beta" create pre-releases
4. Stable releases: Tags without "beta" create full releases

### Commit Pattern

All commits should follow this pattern:

```sh
FEATURE | ISSUE | NONE: commit message
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes following the code style guidelines
4. Commit your changes using the commit message format
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## Troubleshooting

### Port Already in Use

If you see an error about port 51432 being in use:

- The app now uses dynamic port allocation (beta version)
- Restart the application
- If issues persist, check for other Electron processes running

### Build Errors

**Missing dependencies:**

```sh
# Clean and reinstall
npm run clean
rm -rf node_modules
npm install
```

**TypeScript errors:**

```sh
npm run type-check
```

**Linting errors:**

```sh
npm run lint
```

### Application Won't Start

1. Check Node.js version: `node --version` (should be >= 16)
2. Rebuild Electron dependencies:

   ```sh
   npm run postinstall
   ```

3. Clear cache and rebuild:

   ```sh
   npm run clean
   npm run build
   ```

### API Integration Issues

- Ensure `.env` file exists in `renderer/` directory
- Verify API credentials are correct
- Check network connectivity
- Review browser console for detailed error messages

### macOS Build Issues

If DMG creation fails:

```sh
npm install -g dmg-license
```

If code signing issues occur, check your signing certificate in `electron-builder.yml`.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

- **Telegram**: [@mrdr_scn](https://t.me/mrdr_scn)
- **Repository**: [https://github.com/ukad-group/timetracker-desktop-client](https://github.com/ukad-group/timetracker-desktop-client)

<!-- MARKDOWN LINKS & IMAGES -->
[forks-shield]: https://img.shields.io/github/forks/ukad-group/timetracker-desktop-client.svg?style=for-the-badge
[forks-url]: https://github.com/ukad-group/timetracker-desktop-client/network/members
[license-shield]: https://img.shields.io/github/license/ukad-group/timetracker-desktop-client.svg?style=for-the-badge
[license-url]: https://github.com/ukad-group/timetracker-desktop-client/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/mmmykhailo

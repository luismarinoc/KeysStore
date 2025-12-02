# KeysStore Monorepo

This repository contains the **KeysStore** project, organized as a monorepo to share code effectively between the Web and Mobile applications.

## 📂 Project Structure

- **`apps/`**: Application source code.
  - **`web/`**: React + Vite web application.
  - **`mobile/`**: React Native (Expo) mobile application.
- **`packages/`**: Shared libraries.
  - **`sdk-client/`**: Core business logic, storage adapters, and Supabase integration.
  - **`shared-types/`**: TypeScript interfaces shared across the entire project.
- **`backend/`**: Backend infrastructure.
  - **`supabase/`**: Supabase migrations and configuration.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation

Install dependencies for all workspaces from the root:

```bash
npm install
```

### Building Shared Packages

Before running the apps, ensure the shared packages are built:

```bash
npm run build -w packages/shared-types
npm run build -w packages/sdk-client
```

## 💻 Running the Apps

### Web App

```bash
npm run dev -w apps/web
```

### Mobile App

```bash
npm start -w apps/mobile
```

## 🛠 Architecture

### SDK Client (`@keysstore/sdk-client`)
The SDK encapsulates all business logic, including:
- **StorageAdapter**: Interface for platform-specific storage (localStorage vs AsyncStorage).
- **DataStore**: Manages local data persistence and synchronization.
- **OrganizationService**: Handles multi-tenancy logic.
- **Encryption**: Platform-agnostic encryption utilities.

### Multi-Tenancy
The project supports multiple organizations. Data is segregated by `organization_id` in the database and filtered locally in the apps.

## 🤝 Contributing

1.  Make changes in the relevant workspace.
2.  If modifying shared code, rebuild the packages.
3.  Ensure linting passes: `npm run lint -w apps/mobile`.

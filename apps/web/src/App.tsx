import { useState, useEffect } from 'react'
import { getDataStore } from '@keysstore/sdk-client'
import type { Organization } from '@keysstore/shared-types'
import { OrganizationSelector } from './components/OrganizationSelector'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [uuid, setUuid] = useState<string>('Loading...');

  useEffect(() => {
    const loadData = async () => {
      const clientUuid = await getDataStore().getClientUUID();
      setUuid(clientUuid);
    };
    loadData();
  }, []);

  if (!currentOrg) {
    return (
      <div className="app-container">
        <h1>KeysStore</h1>
        <OrganizationSelector onSelect={setCurrentOrg} />
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <span>Org: <strong>{currentOrg.name}</strong></span>
        <button onClick={() => setCurrentOrg(null)} style={{ marginLeft: '10px' }}>Switch</button>
      </div>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>KeysStore Web</h1>
      <div className="card">
        <h2>SDK Integration Test</h2>
        <p>Client UUID from SDK:</p>
        <code>{uuid}</code>
      </div>
    </>
  )
}

export default App


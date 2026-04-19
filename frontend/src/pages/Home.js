import React, { useState, useEffect, useCallback } from 'react';
import CollectionGrid from '../components/CollectionGrid';
import SearchBar from '../components/SearchBar';
import { getCollection } from '../services/api';

function Home() {
  const [vinyls, setVinyls] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollection = useCallback(async (searchTerm) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCollection(searchTerm);
      setVinyls(data.vinyls || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection(search);
  }, [search, fetchCollection]);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">Ma Collection</h1>
        {!isLoading && (
          <p className="page-subtitle">
            <span className="stat-badge">
              <strong>{total}</strong> vinyle{total !== 1 ? 's' : ''}
            </span>
          </p>
        )}
      </header>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Rechercher par artiste ou titre..."
      />

      {error && (
        <div className="error-message" role="alert">
          Erreur de chargement : {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Chargement de la collection...</span>
        </div>
      ) : (
        <CollectionGrid
          vinyls={vinyls}
          emptyMessage={
            search
              ? `Aucun résultat pour "${search}"`
              : 'Votre collection est vide. Scannez un vinyle ou faites une recherche !'
          }
        />
      )}
    </main>
  );
}

export default Home;

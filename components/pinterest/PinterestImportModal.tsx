'use client';

import { useState, useEffect } from 'react';

interface PinterestBoard {
  id: string;
  name: string;
  description: string | null;
  pin_count: number;
  media?: {
    image_cover_url?: string;
  };
}

interface PinterestPin {
  id: string;
  title: string | null;
  description: string | null;
  link: string | null;
  media?: {
    media_type: string;
    images?: {
      '150x150'?: { url: string };
      '400x300'?: { url: string };
      '600x'?: { url: string };
    };
  };
}

interface PinterestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function PinterestImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: PinterestImportModalProps) {
  const [view, setView] = useState<'boards' | 'pins'>('boards');
  const [boards, setBoards] = useState<PinterestBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<PinterestBoard | null>(null);
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importedPins, setImportedPins] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadBoards();
    }
  }, [isOpen]);

  async function loadBoards() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pinterest/boards');
      if (!response.ok) {
        if (response.status === 401) {
          setError('Pinterest not connected. Please connect in Settings.');
          return;
        }
        throw new Error('Failed to load boards');
      }
      const data = await response.json();
      setBoards(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load Pinterest boards');
    } finally {
      setLoading(false);
    }
  }

  async function loadBoardPins(board: PinterestBoard) {
    setSelectedBoard(board);
    setView('pins');
    setLoading(true);
    setError(null);
    setPins([]);
    try {
      const response = await fetch(`/api/pinterest/pins?board_id=${board.id}`);
      if (!response.ok) throw new Error('Failed to load pins');
      const data = await response.json();
      setPins(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  }

  async function searchPins() {
    if (!searchQuery.trim()) return;

    setView('pins');
    setSelectedBoard(null);
    setLoading(true);
    setError(null);
    setPins([]);
    try {
      const response = await fetch(`/api/pinterest/pins?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search pins');
      const data = await response.json();
      setPins(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search pins');
    } finally {
      setLoading(false);
    }
  }

  async function importPin(pin: PinterestPin) {
    setImporting(pin.id);
    setError(null);
    try {
      const response = await fetch('/api/pinterest/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          setImportedPins((prev) => new Set(prev).add(pin.id));
          return;
        }
        throw new Error(data.error || 'Failed to import recipe');
      }

      setImportedPins((prev) => new Set(prev).add(pin.id));
      onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import recipe');
    } finally {
      setImporting(null);
    }
  }

  function goBack() {
    setView('boards');
    setSelectedBoard(null);
    setPins([]);
    setError(null);
  }

  function handleClose() {
    setView('boards');
    setSelectedBoard(null);
    setPins([]);
    setBoards([]);
    setError(null);
    setSearchQuery('');
    setImportedPins(new Set());
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view === 'pins' && (
                <button
                  onClick={goBack}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {view === 'boards' ? 'Import from Pinterest' : selectedBoard?.name || 'Search Results'}
                </h2>
                <p className="text-sm text-gray-500">
                  {view === 'boards'
                    ? 'Select a board or search your pins'
                    : `${pins.length} pins`}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search bar - only on boards view */}
          {view === 'boards' && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPins()}
                placeholder="Search your saved pins..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={searchPins}
                disabled={!searchQuery.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Search
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
              {error.includes('not connected') && (
                <a href="/settings" className="block mt-2 text-red-600 underline">
                  Go to Settings
                </a>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : view === 'boards' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => loadBoardPins(board)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all"
                >
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 overflow-hidden">
                    {board.media?.image_cover_url ? (
                      <img
                        src={board.media.image_cover_url}
                        alt={board.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{board.name}</h3>
                  <p className="text-sm text-gray-500">{board.pin_count} pins</p>
                </button>
              ))}

              {boards.length === 0 && !error && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No boards found. Save some recipe pins on Pinterest first!
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pins.map((pin) => {
                const imageUrl =
                  pin.media?.images?.['400x300']?.url ||
                  pin.media?.images?.['600x']?.url ||
                  pin.media?.images?.['150x150']?.url;
                const isImported = importedPins.has(pin.id);
                const isImporting = importing === pin.id;

                return (
                  <div
                    key={pin.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                  >
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={pin.title || 'Pin'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                        {pin.title || pin.description?.slice(0, 50) || 'Untitled'}
                      </h3>
                      <button
                        onClick={() => importPin(pin)}
                        disabled={isImported || isImporting}
                        className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                          isImported
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isImporting
                              ? 'bg-gray-100 text-gray-500 cursor-wait'
                              : 'bg-simpler-green-400 text-white hover:bg-simpler-green-500'
                        }`}
                      >
                        {isImported ? 'Imported' : isImporting ? 'Importing...' : 'Import Recipe'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {pins.length === 0 && !error && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No pins found in this board.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

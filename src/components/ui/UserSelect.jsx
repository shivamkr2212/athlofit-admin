import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, User as UserIcon } from 'lucide-react';
import { usersService } from '../../services/users.service';
import Spinner from './Spinner';

// Searchable "single user" picker — type a name or email, pick a result from
// the dropdown. Reports the selected user's _id via onChange (same contract
// as a plain <input>), so it drops straight into react-hook-form's
// <Controller name="userId" .../>.
export default function UserSelect({ value, onChange, placeholder = 'Search by name or email…' }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { _id, name, email }
  const containerRef = useRef(null);

  // Debounce typing before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Form value cleared/reset from outside (e.g. after a successful send) —
  // drop our local selection so the search box reappears.
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  // A userId arrived without a matching local selection (e.g. set
  // programmatically) — resolve it to a display label.
  useEffect(() => {
    if (value && (!selected || selected._id !== value)) {
      usersService
        .getById(value)
        .then((res) => {
          const u = res?.data;
          if (u) setSelected({ _id: u._id || u.id, name: u.name, email: u.email });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => usersService.getAll({ search: debounced, limit: 8 }),
    enabled: open && debounced.length >= 2,
  });

  const results = data?.data?.users || [];

  const handleSelect = (user) => {
    setSelected({ _id: user._id, name: user.name, email: user.email });
    onChange(user._id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
    setQuery('');
  };

  if (selected) {
    return (
      <div className="input flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon size={15} className="text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selected.name || 'Unnamed user'}</p>
            {selected.email && <p className="text-xs text-gray-400 truncate">{selected.email}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-md hover:bg-gray-100 shrink-0"
          aria-label="Clear selected user"
        >
          <X size={15} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        />
      </div>
      {open && debounced.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {isFetching ? (
            <div className="flex items-center justify-center py-4"><Spinner size="sm" /></div>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400">No users found</p>
          ) : (
            results.map((u) => (
              <button
                type="button"
                key={u._id}
                onClick={() => handleSelect(u)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col"
              >
                <span className="text-sm font-medium text-gray-900">{u.name || 'Unnamed user'}</span>
                <span className="text-xs text-gray-400">{u.email}</span>
              </button>
            ))
          )}
        </div>
      )}
      {open && debounced.length > 0 && debounced.length < 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-gray-400">Type at least 2 characters…</p>
        </div>
      )}
    </div>
  );
}

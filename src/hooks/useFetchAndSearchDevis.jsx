import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { useDebouncedCallback } from 'use-debounce';

const useFetchAndSearch = (apiUrl, searchKeys) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl);
      setData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError(err.response?.status || 'unknown');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);
  useEffect(() => {
    getData();
  }, [apiUrl, getData]);

  const fuse = useMemo(() => new Fuse(data, { keys: searchKeys, threshold: 0.3, includeMatches: true }), [data, searchKeys]);

  const handleSearch = useDebouncedCallback((value) => {
    if (value?.trim()) {
      setSearchText(value);
      const results = fuse.search(value);
      const autoCompleteOptions = results.map((result) => ({ ...result.item, ...result.matches[0] })).slice(0, 5);
      setAutocompleteOptions(autoCompleteOptions);
      setFilteredData(results.map((result) => result.item));
    } else {
      setAutocompleteOptions([]);
      setSearchText('');
      setFilteredData(data);
    }
  }, 500);
  useEffect(() => {
    handleSearch(searchText);
  }, [searchText, handleSearch]);
  return {
    getData,
    data,
    filteredData,
    setFilteredData,
    searchText,
    autocompleteOptions,
    handleSearch,
    loading,
    error
  };
};

export default useFetchAndSearch;

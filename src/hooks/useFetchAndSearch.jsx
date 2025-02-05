import { useState, useEffect, useMemo } from 'react';
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

  const getData = async (apiUrl) => {
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
  };

  useEffect(() => {
    getData(apiUrl);
  }, [apiUrl]);

  const fuse = useMemo(() => new Fuse(data, { keys: searchKeys, threshold: 0.3 }), [data, searchKeys]);

  const handleSearch = useDebouncedCallback((value) => {
    if (value?.trim()) {
      setSearchText(value);
      const results = fuse.search(value);
      setAutocompleteOptions(results.map((result) => result.item).slice(0, 10));
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
    data,
    filteredData,
    searchText,
    autocompleteOptions,
    handleSearch,
    loading,
    error
  };
};

export default useFetchAndSearch;

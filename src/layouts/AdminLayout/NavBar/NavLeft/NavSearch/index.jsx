/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Spin, Empty } from 'antd';
//test autocomplete
const NavSearch = (props) => {
  const { windowWidth } = props;
  const [isOpen, setIsOpen] = useState(windowWidth < 600);
  const [searchString, setSearchString] = useState(windowWidth < 600 ? '250px' : '');
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [dummyOptions] = useState(['Option 1', 'Option 2', 'Option 3', 'Another Option', 'Last Option']);

  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Filter dummy options based on the search string
    if (value) {
      const filteredSuggestions = dummyOptions.filter((option) => option.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };
  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion);
    setSuggestions([]);
  };
  const searchOnHandler = () => {
    if (windowWidth < 600) {
      document.querySelector('#navbar-right').classList.add('d-none');
    }
    setIsOpen(true);
    setSearchString('200px');
  };

  const searchOffHandler = () => {
    setIsOpen(false);
    setSearchString(0);
    setSearchValue('');
    setTimeout(() => {
      if (windowWidth < 600) {
        document.querySelector('#navbar-right').classList.remove('d-none');
      }
    }, 500);
  };

  let searchClass = ['main-search'];
  if (isOpen) {
    searchClass = [...searchClass, 'open'];
  }

  return (
    <React.Fragment>
      <div id="main-search" className={searchClass.join(' ')}>
        <div className="input-group">
          <input
            type="text"
            id="m-search"
            className="form-control"
            placeholder="Rechercher..."
            style={{ width: searchString }}
            onChange={handleInputChange}
            value={searchValue}
          />
          <Link to="#" className="input-group-append search-close" onClick={searchOffHandler}>
            <i className="feather icon-x input-group-text" />
          </Link>
          <span
            onKeyDown={searchOnHandler}
            role="button"
            tabIndex="0"
            className="input-group-append search-btn btn btn-primary"
            onClick={searchOnHandler}
            style={{ borderRadius: '50%', marginLeft: 5 }}
          >
            <i className="feather icon-search input-group-text" />
          </span>
        </div>
      </div>
      {suggestions.length > 0 && (
        <ListGroup
          style={{ width: '250px', position: 'absolute', zIndex: 10, lineHeight: 'normal' }}
          as="ul"
          bsPrefix=" "
          className="main-search-list"
        >
          {suggestions.map((suggestion, index) => (
            <ListGroup.Item
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{ cursor: 'pointer' }}
              className="m-0 p-2 border-0"
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <b>
                    <em className="text-primary">{suggestion}</em>
                  </b>
                </div>
                <div>
                  <small className="text-muted">Rechercher</small>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {searchLoading && (
        <div
          className="main-search-list d-flex justify-content-center align-items-center"
          style={{ position: 'absolute', zIndex: 10, lineHeight: 'normal', width: '250px' }}
        >
          <Spin tip="Chargement...">
            <div style={{ padding: 50 }} className="d-flex justify-content-center" />
          </Spin>
        </div>
      )}
      {!searchLoading && suggestions.length === 0 && searchValue && (
        <div className="main-search-list" style={{ position: 'absolute', zIndex: 10, lineHeight: 'normal', width: '250px' }}>
          <Empty
            description="Aucun résultat"
            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
            styles={{ image: { height: '50px' } }}
          />
        </div>
      )}
    </React.Fragment>
  );
};

NavSearch.propTypes = {
  windowWidth: PropTypes.number
};

export default NavSearch;

/* eslint-disable react/prop-types */
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';

const modules = {
    toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']]
  },
  formats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet'];

const Editor = ({ value, onChange }) => {
  return (
    <ReactQuill
      theme="bubble"
      value={value || ''}
      modules={modules}
      formats={formats}
      onChange={onChange}
      placeholder="Commancer à saisir en cliquant ici"
    />
  );
};

export default Editor;

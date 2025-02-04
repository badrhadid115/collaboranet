import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Avatar as AntAvatar } from 'antd';

const Avatar = ({ src, firstName, lastName }) => {
  const [imageExists, setImageExists] = useState(false);
  const [avatarColor, setAvatarColor] = useState('primary');
  const [textColor, setTextColor] = useState('#ffffff');

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

  useEffect(() => {
    const predefinedColors = ['#007bff', '#6c757d', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#343a40', '#f8f9fa'];
    const getRandomColor = () => {
      const randomIndex = Math.floor(Math.random() * predefinedColors.length);
      return predefinedColors[randomIndex];
    };

    const getTextColor = (bgColor) => {
      const hexColor = bgColor.replace('#', '');
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 125 ? '#000000' : '#ffffff';
    };
    const bgColor = getRandomColor();
    setAvatarColor(bgColor);
    setTextColor(getTextColor(bgColor));
    const checkImageExists = () => {
      if (!src) return;
      const img = new Image();
      img.onload = () => setImageExists(true);
      img.onerror = () => setImageExists(false);
      img.src = src;
    };
    checkImageExists();
  }, [src]);
  return imageExists ? (
    <AntAvatar src={src} size={55} className='mx-2'/>
  ) : (
    <AntAvatar
      size="large"
      style={{
        backgroundColor: avatarColor,
        color: textColor
      }}
    >
      {initials}
    </AntAvatar>
  );
};
Avatar.propTypes = {
  src: PropTypes.string,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired
};

export default Avatar;

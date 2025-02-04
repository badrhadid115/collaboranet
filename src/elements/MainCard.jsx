import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Dropdown, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import useWindowSize from '../hooks/useWindowSize';

const MainCard = (props) => {
  const { isOption, title, children, cardClass, optionClass, icon } = props;

  const [fullCard, setFullCard] = useState(false);

  const windowSize = useWindowSize();

  let fullScreenStyle, cardHeaderRight, cardHeader;
  let card = '';
  let mainCardClass = [];

  if (isOption) {
    cardHeaderRight = (
      <div className={'card-header-right ' + optionClass}>
        <Dropdown align="end" className="btn-group card-option">
          <Dropdown.Toggle id="dropdown-basic" className="btn-icon">
            <i className="feather icon-more-horizontal" />
          </Dropdown.Toggle>
          <Dropdown.Menu as="ul" className="list-unstyled card-option">
            <Dropdown.Item as="li" className="dropdown-item" onClick={() => setFullCard(!fullCard)}>
              <i className={fullCard ? 'feather icon-minimize' : 'feather icon-maximize'} />
              <Link to="#"> {fullCard ? 'Restorer' : 'Agrandir'} </Link>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }

  cardHeader = (
    <Card.Header>
      <Card.Title>
        <div className="d-flex align-items-center">
          {icon} <span className="ms-2">{title}</span>
        </div>
      </Card.Title>

      {cardHeaderRight}
    </Card.Header>
  );

  if (fullCard) {
    mainCardClass = [...mainCardClass, 'full-card'];
    fullScreenStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: windowSize.width,
      height: windowSize.height,
      overflow: 'auto'
    };
  }

  if (cardClass) {
    mainCardClass = [...mainCardClass, cardClass];
  }

  card = (
    <Card className={mainCardClass.join(' ')} style={fullScreenStyle}>
      {cardHeader}

      <div>
        <Card.Body>{children}</Card.Body>
      </div>
    </Card>
  );

  return <React.Fragment>{card}</React.Fragment>;
};

MainCard.propTypes = {
  title: PropTypes.node,
  isOption: PropTypes.bool,
  children: PropTypes.node,
  cardClass: PropTypes.string,
  optionClass: PropTypes.string,
  icon: PropTypes.node
};

export default MainCard;

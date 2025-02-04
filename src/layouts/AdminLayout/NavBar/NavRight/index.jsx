import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import axios from 'axios';
import { Badge, Tooltip, Modal, Switch } from 'antd';
import Avatar from '../../../../elements/Avatar';
import Profile from './Profile';
import ChangePwd from './ChangePwd';
import { useAuth } from 'views/auth/AuthContext';
const NavRight = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notMenuDown, setNotMenuDown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  useEffect(() => {
    axios.get('/api/notifications').then((response) => {
      setNotifications(response.data);
    });
  }, []);
  const handleNotMenuDown = () => {
    if (window.innerWidth < 992) {
      window.location.href = '/notifications';
      return;
    }
    setNotMenuDown(!notMenuDown);
  };

  useEffect(() => {
    if (notMenuDown) {
      axios.put('/api/notifications').catch((error) => {
        console.error('Erreur dans la mise à jour des notifications:', error);
      });
    }
  }, [notMenuDown]);

  const handleLogout = () => {
    axios
      .post('/api/logout')
      .then((res) => {
        if (res.status === 200) {
          window.location.href = '/';
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };
  const handleCloseProfile = () => {
    setShowProfile(false);
  };
  const handleShowChangePwd = () => {
    setShowChangePwd(true);
  };
  const handleCloseChangePwd = () => {
    setShowChangePwd(false);
  };
  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto" id="navbar-right">
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align="end" onToggle={handleNotMenuDown}>
            <Dropdown.Toggle as={Link} variant="link" to="#" id="dropdown-basic">
              <i className="feather icon-bell icon" />
              <Badge count={notifications.unreadCount} offset={[0, -10]} />
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="notification notification-scroll">
              <div className="noti-head">
                <h6 className="d-inline-block m-b-0">Notifications</h6>
              </div>
              <PerfectScrollbar>
                <ListGroup as="ul" bsPrefix=" " variant="flush" className="noti-body">
                  {notifications?.notifications?.slice(0, 5).map((data, index) => {
                    return (
                      <ListGroup.Item key={index} as="li" bsPrefix=" " className="notification">
                        <Card
                          className="d-flex align-items-center shadow-none mb-0 p-0"
                          style={{ flexDirection: 'row', backgroundColor: 'unset' }}
                        >
                          <Link to={data.notification_link} className="p-0">
                            <Card.Body className="p-0">
                              <p>
                                <strong>{data.notification_title}</strong>
                                <span className="n-time text-muted">
                                  <i className="icon feather icon-clock me-2" />
                                  {data.notification_distance}
                                </span>
                              </p>
                              <p>{data.notification_text}</p>
                            </Card.Body>
                          </Link>
                        </Card>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </PerfectScrollbar>
              <div className="noti-footer">
                <Link to="/notifications" className="text-decoration-none">
                  Voir tout
                </Link>
              </div>
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item>
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align={'end'} className="drp-user">
            <Dropdown.Toggle as={Link} variant="link" to="#" id="dropdown-basic">
              <i className="icon feather icon-user" />
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="profile-notification">
              <div className="pro-head">
                <Avatar src={user.user_profile_pic} firstName={user.user_first_name} lastName={user.user_last_name} />
                <div className="d-flex flex-column justify-content-center">
                  <b>
                    <span className="me-2">{user.user_full_name}</span>
                  </b>
                  <em>
                    <small>{user.role_fr_name}</small>
                  </em>
                </div>
                <Link to={'#'} onClick={handleLogout} className="dud-logout" title="Logout">
                  <Tooltip title="Deconnexion">
                    <i className="fas fa-power-off" />
                  </Tooltip>
                </Link>
              </div>
              <ListGroup as="ul" bsPrefix=" " variant="flush" className="pro-body">
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item" onClick={handleShowProfile}>
                    <i className="fas fa-user" /> Profile
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item" onClick={handleShowChangePwd}>
                    <i className="fas fa-lock" /> Changer le mot de passe
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" ">
                  <Link to="#" className="dropdown-item">
                    <i className="fas fa-sign-out-alt" /> Se marquer absent
                  </Link>
                </ListGroup.Item>
                <ListGroup.Item as="li" bsPrefix=" " className="d-flex align-items-center justify-content-between">
                  <Link to="#" className="dropdown-item">
                    <i className="fas fa-envelope" /> Recevoir des notifications
                  </Link>
                  <Tooltip title="Recevoir des notifications par email">
                    <Switch className="me-3" onChange={() => {}} size="small" checked={user.user_receive_email} />
                  </Tooltip>
                </ListGroup.Item>
              </ListGroup>
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item>
      </ListGroup>
      <Modal open={showProfile} footer={null} width={600} onCancel={handleCloseProfile}>
        <Profile />
      </Modal>
      <Modal open={showChangePwd} footer={null} width={600} onCancel={handleCloseChangePwd}>
        <ChangePwd />
      </Modal>
    </React.Fragment>
  );
};

export default NavRight;

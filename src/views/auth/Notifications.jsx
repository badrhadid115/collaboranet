import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, ListGroup } from 'react-bootstrap';
import { createResource } from 'utils/createResource';
import Loading from 'views/pages/loading';

const fetchNotifications = () =>
  axios
    .get('/api/notifications')
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.error('Erreur pendant le chargement des notifications:', err.response.data);
      throw err;
    });

const { read } = createResource(fetchNotifications());
const Notifications = () => {
  const notifications = read();
  return (
    <Suspense fallback={<Loading />}>
      <ListGroup as="ul" bsPrefix=" " className="nav pcoded-inner-navbar" id="nav-ps-next">
        {notifications?.notifications?.map((item) => (
          <Link to={item.notification_link} key={item.notification_id} className="w-100">
            <Card className="not-card mb-3 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Card.Title className="text-primary mb-0 fw-bold fs-6">{item.notification_title}</Card.Title>
                  <div style={{ fontSize: '0.85rem' }} className="text-muted d-flex align-items-center">
                    <small style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>{item.notification_time}</small>
                    <i className="feather icon-clock"></i>
                  </div>
                </div>
                <Card.Text className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  {item.notification_text || 'Description not available'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </ListGroup>
    </Suspense>
  );
};

export default Notifications;

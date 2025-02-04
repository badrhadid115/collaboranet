import React, { useState } from 'react';
import axios from 'axios';
import ImgCrop from 'antd-img-crop';
import { Row, Col } from 'react-bootstrap';
import { Button, Image, Tooltip, Upload } from 'antd';
import { useAuth } from 'views/auth/AuthContext';
import Blank from '../../../../assets/images/blank-user.jpg';

function Profile() {
  const { user } = useAuth();
  const [profilePic, setProfilePic] = useState(user.user_profile_pic);
  const handleDelete = () => {
    axios
      .delete('/api/profilepicture')
      .then(() => {
        setProfilePic('');
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <React.Fragment>
      <Row className="p-3">
        <Col xs={12} md={4} className="d-flex justify-content-center align-items-center">
          <div className="text-center">
            <Image className="rounded-circle" fallback={Blank} src={profilePic} width={200} height={200} preview={false} />
            <div className="position-relative d-flex justify-content-center align-items-center mt-3">
              <ImgCrop rotate>
                <Upload
                  name="profilePicture"
                  showUploadList={false}
                  action="./api/profilepicture"
                  onChange={(info) => {
                    if (info.file.status === 'done') {
                      console.log(info.file.response.url);
                      setProfilePic(info.file.response.url);
                    }
                    if (info.file.status === 'uploading') {
                      return;
                    }
                  }}
                >
                  <Button type="secondary" style={{ marginRight: '10px' }}>
                    <Tooltip title="Ajouter une photo de profile">
                      <i className="feather icon-camera text-primary"></i>
                    </Tooltip>
                  </Button>
                </Upload>
              </ImgCrop>
              <Button type="secondary" onClick={handleDelete}>
                <Tooltip title="Supprimer la photo de profile">
                  <i className="feather icon-trash-2 text-danger"></i>
                </Tooltip>
              </Button>
            </div>
          </div>
        </Col>

        <Col xs={12} md={8} className="text-start mt-3 mt-md-0 align-self-center px-3">
          <h3 className="mb-1 fw-bold">{user.user_full_name}</h3>
          <p className="mb-0 text-muted">{user.role_description}</p>
          <div className="ms-auto">
            <ul className="list-unstyled d-flex flex-column">
              <li>
                <b>Email:</b>
                <span> {user.user_email}</span>
              </li>
              <li>
                <b>Dernière connexion:</b>
                <span> {user.lastLogin}</span>
              </li>
            </ul>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default Profile;

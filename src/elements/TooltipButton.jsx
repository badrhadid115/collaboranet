import PropTypes from 'prop-types';
import { Tooltip, Button } from 'antd';
export const TooltipButton = ({ title, icon, onClick, ...props }) => (
  <Tooltip title={title} trigger={'hover'}>
    <Button onClick={onClick} shape="circle" icon={icon} size="large" {...props} />
  </Tooltip>
);
TooltipButton.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.node,
  onClick: PropTypes.func
};

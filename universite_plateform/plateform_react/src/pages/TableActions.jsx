/**
 * COMPOSANT ACTIONS DE TABLEAU
 */

import React from 'react';
import { Space, Button, Popconfirm } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

const TableActions = ({ 
  onView, 
  onEdit, 
  onDelete, 
  onToggle, 
  isActive,
  showView = true,
  showEdit = true,
  showDelete = true,
  showToggle = false,
  deleteTitle = 'Supprimer cet élément ?'
}) => {
  return (
    <Space>
      {showView && (
        <Button 
          icon={<EyeOutlined />} 
          onClick={onView}
        />
      )}
      
      {showEdit && (
        <Button 
          icon={<EditOutlined />} 
          onClick={onEdit}
        />
      )}
      
      {showToggle && (
        <Button 
          icon={isActive ? <CloseOutlined /> : <CheckOutlined />}
          onClick={onToggle}
          type={isActive ? 'default' : 'primary'}
          title={isActive ? 'Désactiver' : 'Activer'}
        />
      )}
      
      {showDelete && (
        <Popconfirm
          title={deleteTitle}
          onConfirm={onDelete}
          okText="Oui"
          cancelText="Non"
        >
          <Button icon={<DeleteOutlined />} danger />
        </Popconfirm>
      )}
    </Space>
  );
};

export default TableActions;